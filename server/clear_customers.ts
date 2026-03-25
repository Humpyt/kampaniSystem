import db from './database';

async function clearCustomers() {
  try {
    await db.run('DELETE FROM customers');
    console.log('✅ Cleared all customers from database');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearCustomers();
