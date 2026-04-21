import db from '../database';

async function addAccountBalance() {
  try {
    console.log('🔄 Adding account_balance column to customers table...\n');

    // Check if column exists
    const columns = await db.all('PRAGMA table_info(customers)');
    const hasBalance = columns.some((col: any) => col.name === 'account_balance');

    if (hasBalance) {
      console.log('✅ account_balance column already exists!\n');
      process.exit(0);
    }

    // Add column
    await db.run(`ALTER TABLE customers ADD COLUMN account_balance REAL DEFAULT 0`);

    console.log('✅ Successfully added account_balance column to customers table!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding account_balance:', error);
    process.exit(1);
  }
}

addAccountBalance();
