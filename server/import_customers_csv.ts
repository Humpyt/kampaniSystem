import fs from 'fs';
import db from './database';

interface CustomerRow {
  name: string;
  phone: string;
}

function parseCSV(filePath: string): CustomerRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header row
  const dataLines = lines.slice(1);

  const customers: CustomerRow[] = [];

  for (const line of dataLines) {
    // Split by comma, handle cases where name might have commas
    const parts = line.split(',');

    if (parts.length >= 2) {
      // Last part is the phone number
      const phone = parts[parts.length - 1].trim();
      // Everything before the last comma is the name
      const name = parts.slice(0, parts.length - 1).join(',').trim();

      if (name && phone) {
        customers.push({ name, phone });
      }
    }
  }

  return customers;
}

async function importCustomers() {
  try {
    console.log('🔄 Starting customer import from CSV...\n');

    const csvPath = './new customers.csv';
    const customers = parseCSV(csvPath);

    console.log(`📊 Found ${customers.length} customers in CSV file\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        // Check if customer already exists by phone
        const existing = await db.get(
          'SELECT id FROM customers WHERE phone = ?',
          [customer.phone]
        );

        if (existing) {
          console.log(`⏭️  Skipping duplicate: ${customer.name} (${customer.phone})`);
          skipped++;
          continue;
        }

        // Insert new customer
        const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        await db.run(`
          INSERT INTO customers (id, name, phone, total_orders, total_spent, last_visit, loyalty_points, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          customer.name,
          customer.phone,
          0,  // total_orders
          0,  // total_spent
          null,  // last_visit
          0,  // loyalty_points
          now,  // created_at
        ]);

        console.log(`✅ Imported: ${customer.name} (${customer.phone})`);
        imported++;

      } catch (error) {
        console.error(`❌ Error importing ${customer.name}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);

    // Verify final count
    const finalCount = await db.get('SELECT COUNT(*) as count FROM customers');
    console.log(`\n📊 Total customers in database: ${finalCount.count}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

importCustomers();
