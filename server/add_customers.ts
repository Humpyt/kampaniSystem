import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const db = new Database(path.join(process.cwd(), 'server/shoerepair.db'));

const customers = [
  { name: 'John Smith', phone: '555-0101' },
  { name: 'Sarah Johnson', phone: '555-0102' },
  { name: 'Michael Brown', phone: '555-0103' },
  { name: 'Emma Wilson', phone: '555-0104' },
  { name: 'James Davis', phone: '555-0105' },
];

const insertCustomer = db.prepare(`
  INSERT INTO customers (
    id, name, phone, email, address, notes, status,
    total_orders, total_spent, last_visit, loyalty_points,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

customers.forEach(customer => {
  insertCustomer.run(
    uuidv4(),
    customer.name,
    customer.phone,
    '',
    '',
    '',
    'active',
    0,
    0,
    null,
    0
  );
  console.log(`Added customer: ${customer.name}`);
});

console.log('Finished adding dummy customers');
db.close();
