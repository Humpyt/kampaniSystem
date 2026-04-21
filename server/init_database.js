import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'database.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Drop existing tables in correct order
const tables = [
  'order_items',
  'operation_services',
  'operation_shoes',
  'operations',
  'services',
  'sales',
  'sales_items',
  'sales_categories',
  'supply_categories',
  'customers'
];

tables.forEach(table => {
  db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
});

// Create tables
db.exec(`
  CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE operations (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled', 'held')) NOT NULL DEFAULT 'pending',
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    notes TEXT,
    promised_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_no_charge INTEGER DEFAULT 0,
    is_do_over INTEGER DEFAULT 0,
    is_delivery INTEGER DEFAULT 0,
    is_pickup INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  CREATE TABLE operation_shoes (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operation_id) REFERENCES operations (id)
  );

  CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT CHECK(category IN ('repair', 'cleaning', 'other')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE operation_services (
    id TEXT PRIMARY KEY,
    operation_shoe_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operation_shoe_id) REFERENCES operation_shoes (id),
    FOREIGN KEY (service_id) REFERENCES services (id)
  );

  CREATE TABLE supply_categories (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE sales_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER
  );

  CREATE TABLE sales_items (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sku TEXT,
    image_path TEXT,
    FOREIGN KEY (category_id) REFERENCES sales_categories (id)
  );

  CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    sale_type TEXT CHECK(sale_type IN ('repair', 'retail', 'pickup')) NOT NULL,
    reference_id TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'other')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES sales_items (id)
  );
`);

// Add sample services
const services = [
  { id: 'service_1', name: 'Sole Replacement', price: 80000, category: 'repair' },
  { id: 'service_2', name: 'Heel Repair', price: 40000, category: 'repair' },
  { id: 'service_3', name: 'Cleaning', price: 25000, category: 'cleaning' },
  { id: 'service_4', name: 'Polishing', price: 15000, category: 'cleaning' },
  { id: 'service_5', name: 'Waterproofing', price: 30000, category: 'other' },
  { id: 'service_6', name: 'Stretching', price: 20000, category: 'other' },
  { id: 'service_7', name: 'Elastic', price: 15000, category: 'repair' },
  { id: 'service_8', name: 'Hardware', price: 20000, category: 'repair' },
  { id: 'service_9', name: 'Heel Fix', price: 25000, category: 'repair' },
  { id: 'service_10', name: 'Misc', price: 8000, category: 'other' }
];

const insertService = db.prepare(`
  INSERT INTO services (
    id, name, price, category, created_at, updated_at
  ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
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

// Add sample customers
const sampleCustomers = [
  {
    id: uuidv4(),
    name: 'John Smith',
    phone: '555-0123',
    email: 'john.smith@email.com',
    address: '123 Main St'
  },
  {
    id: uuidv4(),
    name: 'Sarah Johnson',
    phone: '555-0124',
    email: 'sarah.j@email.com',
    address: '456 Oak Ave'
  },
  {
    id: uuidv4(),
    name: 'Michael Brown',
    phone: '555-0125',
    email: 'mbrown@email.com',
    address: '789 Pine Rd'
  },
  {
    id: uuidv4(),
    name: 'Emily Davis',
    phone: '555-0126',
    email: 'emily.d@email.com',
    address: '321 Elm St'
  },
  {
    id: uuidv4(),
    name: 'David Wilson',
    phone: '555-0127',
    email: 'dwilson@email.com',
    address: '654 Maple Dr'
  }
];

const insertCustomer = db.prepare(
  'INSERT INTO customers (id, name, phone, email, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
);

sampleCustomers.forEach(customer => {
  insertCustomer.run(customer.id, customer.name, customer.phone, customer.email, customer.address);
  console.log(`Added customer: ${customer.name}`);
});

// Add sample operations
const sampleOperations = [
  {
    id: uuidv4(),
    customer_id: sampleCustomers[0].id,
    status: 'pending',
    total_amount: 120000,
    paid_amount: 0,
    notes: 'Regular repair',
    promised_date: '2024-12-20',
    is_no_charge: 0,
    is_do_over: 0,
    is_delivery: 0,
    is_pickup: 0
  },
  {
    id: uuidv4(),
    customer_id: sampleCustomers[1].id,
    status: 'in_progress',
    total_amount: 80000,
    paid_amount: 40000,
    notes: 'Priority repair',
    promised_date: '2024-12-18',
    is_no_charge: 0,
    is_do_over: 0,
    is_delivery: 1,
    is_pickup: 0
  }
];

const insertOperation = db.prepare(`
  INSERT INTO operations (
    id, customer_id, status, total_amount, paid_amount, notes, promised_date,
    is_no_charge, is_do_over, is_delivery, is_pickup,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

sampleOperations.forEach(op => {
  insertOperation.run(
    op.id,
    op.customer_id,
    op.status,
    op.total_amount,
    op.paid_amount,
    op.notes,
    op.promised_date,
    op.is_no_charge,
    op.is_do_over,
    op.is_delivery,
    op.is_pickup
  );
  console.log(`Added operation for customer ${op.customer_id}`);
});

// Add sample shoes to operations
const sampleShoes = [
  {
    id: uuidv4(),
    operation_id: sampleOperations[0].id,
    category: 'Boots',
    color: 'Brown',
    notes: 'Sole replacement needed'
  },
  {
    id: uuidv4(),
    operation_id: sampleOperations[0].id,
    category: 'Dress Shoes',
    color: 'Black',
    notes: 'Heel repair'
  },
  {
    id: uuidv4(),
    operation_id: sampleOperations[1].id,
    category: 'High Heels',
    color: 'Red',
    notes: 'Replace heel tips'
  },
  {
    id: uuidv4(),
    operation_id: sampleOperations[1].id,
    category: 'Loafers',
    color: 'Tan',
    notes: 'Clean and protect'
  }
];

const insertShoe = db.prepare(`
  INSERT INTO operation_shoes 
  (id, operation_id, category, color, notes, created_at, updated_at) 
  VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

sampleShoes.forEach(shoe => {
  insertShoe.run(
    shoe.id,
    shoe.operation_id,
    shoe.category,
    shoe.color,
    shoe.notes
  );
  console.log(`Added shoe: ${shoe.category}`);
});

// Add services to operations
const sampleOperationServices = [
  { operation_shoe_id: sampleShoes[0].id, service_id: 'service_1' }, // Sole Replacement
  { operation_shoe_id: sampleShoes[0].id, service_id: 'service_3' }, // Cleaning
  { operation_shoe_id: sampleShoes[1].id, service_id: 'service_2' }, // Heel Repair
  { operation_shoe_id: sampleShoes[2].id, service_id: 'service_2' }, // Heel Repair
  { operation_shoe_id: sampleShoes[2].id, service_id: 'service_4' }, // Polishing
  { operation_shoe_id: sampleShoes[3].id, service_id: 'service_3' }, // Cleaning
  { operation_shoe_id: sampleShoes[3].id, service_id: 'service_5' }  // Waterproofing
];

const insertOperationService = db.prepare(`
  INSERT INTO operation_services 
  (id, operation_shoe_id, service_id, quantity, price, notes, created_at, updated_at) 
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

sampleOperationServices.forEach(os => {
  insertOperationService.run(
    uuidv4(),
    os.operation_shoe_id,
    os.service_id,
    1,
    0,
    ''
  );
  console.log(`Added service ${os.service_id} to shoe ${os.operation_shoe_id}`);
});

// Add supply categories
const supplyCategories = [
  'Soles and Heels',
  'Adhesives and Glues',
  'Leather and Materials',
  'Tools and Equipment',
  'Laces and Fasteners',
  'Polishes and Dyes',
  'Insoles and Padding',
  'Cleaning Supplies',
  'Hardware and Metal Parts',
  'Elastic and Stretching Materials',
  'Waterproofing Products',
  'Orthopedic Supplies',
  'Thread and Needles',
  'Heel Tips and Plates',
  'Zippers and Closures',
  'Protective Coatings',
  'Shoe Care Kits',
  'Brushes and Applicators',
  'Repair Patches',
  'Safety Equipment'
];

const insertCategory = db.prepare('INSERT OR IGNORE INTO supply_categories (name) VALUES (?)');
supplyCategories.forEach(category => {
  insertCategory.run(category);
  console.log(`Added supply category: ${category}`);
});

// Insert sales categories
const salesCategories = [
  { id: uuidv4(), name: 'Boot Trees', display_order: 1 },
  { id: uuidv4(), name: 'Brushes', display_order: 2 },
  { id: uuidv4(), name: 'Cleaners', display_order: 3 },
  { id: uuidv4(), name: 'Conditioners', display_order: 4 },
  { id: uuidv4(), name: 'Dyes', display_order: 5 },
  { id: uuidv4(), name: 'Foot Aids', display_order: 6 },
  { id: uuidv4(), name: 'Insoles', display_order: 7 },
  { id: uuidv4(), name: 'Laces', display_order: 8 },
  { id: uuidv4(), name: 'Mens Shoe Trees', display_order: 9 },
  { id: uuidv4(), name: 'Shoe Horns', display_order: 10 },
  { id: uuidv4(), name: 'Shoe Polish', display_order: 11 },
  { id: uuidv4(), name: 'Shoe Shine Kits', display_order: 12 },
  { id: uuidv4(), name: 'Stretchers', display_order: 13 },
  { id: uuidv4(), name: 'Tools & Misc Items', display_order: 14 },
  { id: uuidv4(), name: 'Waterproofers', display_order: 15 },
  { id: uuidv4(), name: 'Womens Shoe Trees', display_order: 16 },
  { id: uuidv4(), name: 'Shine', display_order: 17 },
  { id: uuidv4(), name: 'UPS', display_order: 18 }
];

const insertSalesCategory = db.prepare('INSERT INTO sales_categories (id, name, display_order) VALUES (?, ?, ?)');
salesCategories.forEach(category => {
  insertSalesCategory.run(category.id, category.name, category.display_order);
});

// Insert sample sales items
const shineKitsCategory = salesCategories.find(cat => cat.name === 'Shoe Shine Kits');
const dyesCategory = salesCategories.find(cat => cat.name === 'Dyes');
const bootTreesCategory = salesCategories.find(cat => cat.name === 'Boot Trees');
const insolesCategory = salesCategories.find(cat => cat.name === 'Insoles');

const salesItems = [
  // Shoe Shine Kits
  { id: uuidv4(), name: 'Grip-N-Shine', price: 8.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Kiwi Desert Boot Care Kit', price: 13.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Kiwi Shine Kit', price: 14.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Kiwi Travel Kit', price: 13.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Rochester Executive Shoe Care', price: 79.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Shine Butler', price: 29.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Shoe Shine Box Empty', price: 29.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Shoe Shine Box Kit', price: 42.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Shoebox Supplies', price: 13.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'ShoeKeeper', price: 47.99, category_id: shineKitsCategory.id },
  { id: uuidv4(), name: 'Traditional Golf Shoe Care Kit', price: 19.99, category_id: shineKitsCategory.id },

  // Dyes
  { id: uuidv4(), name: 'Esquire Dye', price: 6.99, category_id: dyesCategory.id },
  { id: uuidv4(), name: 'Kiwi Heel & Sole edge Color Renew 2.5oz', price: 5.99, category_id: dyesCategory.id },
  { id: uuidv4(), name: 'Suede Renew 5.5oz', price: 6.99, category_id: dyesCategory.id },
  { id: uuidv4(), name: "Kelly's Suede Dye 4oz", price: 6.99, category_id: dyesCategory.id },
  { id: uuidv4(), name: 'Kiwi Dye 4oz', price: 5.99, category_id: dyesCategory.id },
  { id: uuidv4(), name: 'Life Spray Paint 4.5oz', price: 6.99, category_id: dyesCategory.id },
  { id: uuidv4(), name: 'Sole & Edge Dressing 4oz', price: 6.99, category_id: dyesCategory.id },

  // Boot Trees
  { id: uuidv4(), name: 'Cedar Western Shapers', price: 49.99, sku: '0106', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: 'Deluxe', price: 19.99, sku: '0107', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: "Men's Cedar Western", price: 29.99, sku: '0102', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: "Men's Cedar with Hook", price: 31.99, sku: '0101', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: 'Plastic Shapers Black', price: 8.99, sku: '0108', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: 'Plastic Shapers Pink', price: 8.99, sku: '0110', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: 'Plastic Shapers White', price: 8.99, sku: '0109', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: 'Rancher Cedar', price: 23.99, sku: '0103', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: "Women's Cedar with Hook", price: 29.99, sku: '0104', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: "Women's Western Cedar", price: 29.99, sku: '0105', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: 'Brush Kit', price: 21.99, sku: '0208', category_id: bootTreesCategory.id },
  { id: uuidv4(), name: 'Brush Mini', price: 4.99, sku: '0209', category_id: bootTreesCategory.id },

  // Insoles
  { id: uuidv4(), name: 'Spenco 3/4 Length Arch Supports', price: 24.99, category_id: insolesCategory.id },
  { id: uuidv4(), name: 'Kiwi Freshins 6 pairs', price: 6.99, category_id: insolesCategory.id }
];

const insertSalesItem = db.prepare('INSERT INTO sales_items (id, category_id, name, price, sku) VALUES (?, ?, ?, ?, ?)');
salesItems.forEach(item => {
  insertSalesItem.run(item.id, item.category_id, item.name, item.price, item.sku);
});

// Add sample order items for retail sale
const retailSale = null;
const sampleOrderItems = [
  {
    id: uuidv4(),
    order_id: 'retail_order_1',
    item_id: salesItems[0].id,
    quantity: 1,
    price: 25.00
  },
  {
    id: uuidv4(),
    order_id: 'retail_order_1',
    item_id: salesItems[1].id,
    quantity: 2,
    price: 10.00
  }
];

const insertOrderItem = db.prepare(`
  INSERT INTO order_items (
    id, order_id, item_id, quantity, price, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

sampleOrderItems.forEach(item => {
  insertOrderItem.run(
    item.id,
    item.order_id,
    item.item_id,
    item.quantity,
    item.price
  );
});

// Add sample sales
const sampleSales = [
  {
    id: uuidv4(),
    customer_id: sampleCustomers[0].id,
    sale_type: 'repair',
    reference_id: sampleOperations[0].id,
    total_amount: 150.00,
    payment_method: 'card'
  },
  {
    id: uuidv4(),
    customer_id: sampleCustomers[1].id,
    sale_type: 'repair',
    reference_id: sampleOperations[1].id,
    total_amount: 85.00,
    payment_method: 'cash'
  },
  {
    id: uuidv4(),
    customer_id: null,
    sale_type: 'retail',
    reference_id: 'retail_order_1',
    total_amount: 45.00,
    payment_method: 'cash'
  }
];

const insertSale = db.prepare(`
  INSERT INTO sales (
    id, customer_id, sale_type, reference_id, 
    total_amount, payment_method, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

sampleSales.forEach(sale => {
  insertSale.run(
    sale.id,
    sale.customer_id,
    sale.sale_type,
    sale.reference_id,
    sale.total_amount,
    sale.payment_method
  );
});

console.log('Database initialized successfully!');
db.close();
