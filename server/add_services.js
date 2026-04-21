import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'shoerepair.db'));

// Add services
const services = [
  { id: 'service_1', name: 'Sole Replacement', price: 80000, category: 'repair' },
  { id: 'service_2', name: 'Heel Repair', price: 40000, category: 'repair' },
  { id: 'service_3', name: 'Cleaning', price: 25000, category: 'cleaning' },
  { id: 'service_4', name: 'Polishing', price: 15000, category: 'cleaning' },
  { id: 'service_5', name: 'Waterproofing', price: 30000, category: 'protection' },
  { id: 'service_6', name: 'Stretching', price: 20000, category: 'adjustment' },
  { id: 'service_7', name: 'Elastic', price: 15000, category: 'repair' },
  { id: 'service_8', name: 'Hardware', price: 20000, category: 'repair' },
  { id: 'service_9', name: 'Heel Fix', price: 25000, category: 'repair' },
  { id: 'service_10', name: 'Misc', price: 8000, category: 'other' }
];

// Clear existing services
db.prepare('DELETE FROM services').run();

// Insert services
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

console.log('Finished adding services');
db.close();
