import db from './database';

async function checkSchema() {
  try {
    const columns = await db.all('PRAGMA table_info(operations)');
    console.log('\n📋 Operations Table Columns:\n');
    columns.forEach((col: any) => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    // Check if discount column exists
    const hasDiscount = columns.some((col: any) => col.name === 'discount');
    console.log(`\n${hasDiscount ? '✅' : '❌'} Discount column: ${hasDiscount ? 'EXISTS' : 'NOT FOUND'}\n`);

    if (!hasDiscount) {
      console.log('⚠️  Need to add discount column to operations table\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSchema();
