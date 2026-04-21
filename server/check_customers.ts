import db from './database';

async function checkCustomers() {
  try {
    const total = await db.get('SELECT COUNT(*) as count FROM customers');
    console.log(`\n📊 Total customers in database: ${total.count}\n`);

    const recent = await db.all('SELECT name, phone FROM customers ORDER BY created_at DESC LIMIT 20');
    console.log('📋 Latest 20 customers:\n');
    recent.forEach((c: any, i: number) => {
      console.log(`${i + 1}. ${c.name} - ${c.phone}`);
    });
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCustomers();
