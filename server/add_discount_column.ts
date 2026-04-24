import db from './database';

async function addDiscountColumn() {
  try {
    console.log('🔄 Adding discount column to operations table...\n');

    // Check if column already exists
    const columns = await db.all('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operations' ORDER BY ordinal_position');
    const hasDiscount = columns.some((col: any) => col.column_name === 'discount');

    if (hasDiscount) {
      console.log('✅ Discount column already exists!\n');
      process.exit(0);
    }

    // Add the discount column
    await db.run(`
      ALTER TABLE operations
      ADD COLUMN discount REAL DEFAULT 0
    `);

    console.log('✅ Successfully added discount column to operations table!\n');

    // Verify the change
    const updatedColumns = await db.all('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operations' ORDER BY ordinal_position');
    const discountCol = updatedColumns.find((col: any) => col.column_name === 'discount');

    if (discountCol) {
      console.log('📋 New column details:');
      console.log(`   Name: ${discountCol.name}`);
      console.log(`   Type: ${discountCol.type}`);
      console.log(`   Default: ${discountCol.dflt_value}\n`);
    }

    // Check existing operations
    const operations = await db.all('SELECT id, total_amount, discount FROM operations');
    console.log(`📊 Found ${operations.length} operations in database.`);

    if (operations.length > 0) {
      console.log('\nSample operations:');
      operations.slice(0, 3).forEach((op: any) => {
        console.log(`  - ID: ${op.id.slice(-6)}, Total: ${op.total_amount || 0}, Discount: ${op.discount || 0}`);
      });
    }

    console.log('\n✨ Migration completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding discount column:', error);
    process.exit(1);
  }
}

addDiscountColumn();
