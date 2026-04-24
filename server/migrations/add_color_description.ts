import db from '../database';

async function migrate() {
  console.log('Running migration: add color_description to operation_shoes...');

  try {
    // Check if column exists
    const tableInfo = await db.all("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'operation_shoes' ORDER BY ordinal_position");
    const columns = (tableInfo as any[]).map(col => col.column_name);

    if (!columns.includes('color_description')) {
      await db.run('ALTER TABLE operation_shoes ADD COLUMN color_description TEXT');
      console.log('Successfully added color_description column');
    } else {
      console.log('color_description column already exists');
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
