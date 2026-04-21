import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'shoerepair.db'));

// Delete existing operation_services first
db.prepare('DELETE FROM operation_services').run();

// Then delete existing services
db.prepare('DELETE FROM services').run();

// Add services with matching IDs
const services = [
  { id: 'sole-replacement', name: 'Sole Replacement', price: 80000, category: 'repair' },
  { id: 'heel-repair', name: 'Heel Repair', price: 40000, category: 'repair' },
  { id: 'cleaning', name: 'Cleaning', price: 25000, category: 'cleaning' },
  { id: 'polishing', name: 'Polishing', price: 15000, category: 'cleaning' },
  { id: 'waterproofing', name: 'Waterproofing', price: 30000, category: 'protection' },
  { id: 'stretching', name: 'Stretching', price: 20000, category: 'adjustment' },
  { id: 'elastic', name: 'Elastic', price: 15000, category: 'repair' },
  { id: 'hardware', name: 'Hardware', price: 20000, category: 'repair' },
  { id: 'heel-fix', name: 'Heel Fix', price: 25000, category: 'repair' },
  { id: 'misc', name: 'Misc', price: 8000, category: 'other' }
];

const insertService = db.prepare(`
  INSERT INTO services (
    id, name, price, category, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
`);

services.forEach(service => {
  insertService.run(
    service.id,
    service.name,
    service.price,
    service.category
  );
  console.log(`Added service: ${service.name}`);
});

console.log('Services updated successfully!');
db.close();
