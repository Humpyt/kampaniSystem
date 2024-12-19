import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'database.db'));

// Read and parse the SQL file
const sqlContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'dummy_supplies.sql'), 'utf8');
const statements = sqlContent.split(';').filter(stmt => stmt.trim());

// Begin transaction
db.prepare('BEGIN').run();

try {
  // Create supplies table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS supplies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      on_hand INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Clear existing supplies
  db.prepare('DELETE FROM supplies').run();

  // Parse and insert each supply item
  statements.forEach(stmt => {
    if (!stmt.trim()) return;
    
    // Extract values from INSERT statement
    const valuesMatch = stmt.match(/VALUES\s*\((.*)\)/i);
    if (!valuesMatch) return;

    const values = valuesMatch[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
    if (values.length !== 7) return;

    const [name, category, description, on_hand, min_stock, cost, unit] = values;

    // Insert with UUID
    db.prepare(`
      INSERT INTO supplies (
        id, name, category, description, on_hand, min_stock, cost, unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      name,
      category,
      description,
      parseInt(on_hand),
      parseInt(min_stock),
      parseFloat(cost),
      unit
    );
  });

  // Commit transaction
  db.prepare('COMMIT').run();
  console.log('Successfully added dummy supplies data');
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error adding dummy supplies:', error);
  process.exit(1);
}
