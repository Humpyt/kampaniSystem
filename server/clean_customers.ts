import db from './database';

async function cleanCustomers() {
  try {
    // First, let's identify which customers have operations
    const customersWithOps = await db.all(`
      SELECT DISTINCT customer_id
      FROM operations
      WHERE customer_id IS NOT NULL
    `);

    const customerIdsWithOps = new Set(customersWithOps.map((c: any) => c.customer_id));
    console.log(`Found ${customerIdsWithOps.size} customers with operations`);

    // Get all customers ordered by creation date
    const allCustomers = await db.all('SELECT id, name, phone, created_at FROM customers ORDER BY created_at ASC');

    // Keep only the first 3 (original ones) and those with operations
    const toKeep = allCustomers.slice(0, 3).map((c: any) => c.id);
    customerIdsWithOps.forEach(id => toKeep.push(id));

    const uniqueToKeep = [...new Set(toKeep)];
    console.log(`Keeping ${uniqueToKeep.length} customers`);

    // Delete customers that are not in the keep list
    let deleted = 0;
    for (const customer of allCustomers) {
      if (!uniqueToKeep.includes(customer.id)) {
        await db.run('DELETE FROM customers WHERE id = ?', [customer.id]);
        deleted++;
      }
    }

    console.log(`✅ Deleted ${deleted} corrupted customers`);

    // Verify final count
    const finalCount = await db.get('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Total customers remaining: ${finalCount.count}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanCustomers();
