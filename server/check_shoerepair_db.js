import sqlite3Module from 'sqlite3';
const sqlite3 = sqlite3Module.verbose();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'shoerepair.db');
const db = new sqlite3.Database(dbPath);

db.get('SELECT COUNT(*) as count FROM customers', (err, row) => {
  if (err) {
    if (err.message.includes('no such table')) {
      console.log('❌ Customers table DOES NOT EXIST in shoerepair.db');
    } else {
      console.error('❌ Error checking shoerepair.db:', err);
    }
  } else {
    console.log(`📊 shoerepair.db customers: ${row.count}`);
  }
  db.close();
});
