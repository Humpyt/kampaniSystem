import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'shoerepair.db'));

// List all tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log('Tables in database:', tables.map(t => t.name));

// For each table, show its schema
tables.forEach(table => {
  console.log(`\nSchema for ${table.name}:`);
  const schema = db.prepare(`
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name=?
  `).get(table.name);
  console.log(schema.sql);
});

db.close();
