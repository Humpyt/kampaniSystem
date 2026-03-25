import db from '../database';

async function addOperationPayments() {
  try {
    console.log('🔄 Creating operation_payments table...\n');

    // Create operation_payments table
    await db.run(`
      CREATE TABLE IF NOT EXISTS operation_payments (
        id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operation_id) REFERENCES operations (id)
      )
    `);

    // Create index for faster queries
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_operation_payments_operation_id
      ON operation_payments(operation_id)
    `);

    console.log('✅ Successfully created operation_payments table!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating operation_payments table:', error);
    process.exit(1);
  }
}

addOperationPayments();
