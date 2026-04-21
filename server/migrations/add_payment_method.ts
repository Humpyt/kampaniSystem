import db from '../database';

async function addPaymentMethod() {
  try {
    console.log('🔄 Adding payment_method column to operations table...\n');

    const columns = await db.all('PRAGMA table_info(operations)');
    const hasPaymentMethod = columns.some((col: any) => col.name === 'payment_method');

    if (!hasPaymentMethod) {
      await db.run(`ALTER TABLE operations ADD COLUMN payment_method TEXT`);
      console.log('✅ Added payment_method column');
    } else {
      console.log('✅ payment_method column already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addPaymentMethod();
