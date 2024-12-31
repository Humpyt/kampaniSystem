import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const db = new Database(path.join(__dirname, 'database.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Customers table
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    last_visit TEXT,
    loyalty_points INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  -- Services table
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    estimated_days INTEGER,
    category TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT,
    updated_at TEXT
  );

  -- Operations table
  CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    status TEXT DEFAULT 'pending',
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    notes TEXT,
    promised_date TEXT,
    is_no_charge INTEGER DEFAULT 0,
    is_do_over INTEGER DEFAULT 0,
    is_delivery INTEGER DEFAULT 0,
    is_pickup INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  -- Operation Shoes table
  CREATE TABLE IF NOT EXISTS operation_shoes (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (operation_id) REFERENCES operations (id)
  );

  -- Operation Services table
  CREATE TABLE IF NOT EXISTS operation_services (
    id TEXT PRIMARY KEY,
    operation_shoe_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (operation_shoe_id) REFERENCES operation_shoes (id),
    FOREIGN KEY (service_id) REFERENCES services (id)
  );

  -- Inventory Items table
  CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    item_no TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    vendor TEXT NOT NULL,
    upc_sku TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    cost REAL NOT NULL DEFAULT 0,
    on_hand INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  -- Supplies table
  CREATE TABLE IF NOT EXISTS supplies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    on_hand INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Sales table to track all sales
  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    sale_type TEXT NOT NULL CHECK(sale_type IN ('repair', 'retail', 'pickup')),
    reference_id TEXT NOT NULL,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  -- QR Codes table
  CREATE TABLE IF NOT EXISTS qrcodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Initialize database with indexes
db.exec(`
  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_operations_customer ON operations(customer_id);
  CREATE INDEX IF NOT EXISTS idx_operation_shoes_operation ON operation_shoes(operation_id);
  CREATE INDEX IF NOT EXISTS idx_operation_services_operation_shoe ON operation_services(operation_shoe_id);
  CREATE INDEX IF NOT EXISTS idx_operation_services_service ON operation_services(service_id);
  CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
  CREATE INDEX IF NOT EXISTS idx_qrcodes_type ON qrcodes(type);
`);

// Function to initialize the database with some default data if needed
const initializeDatabase = () => {
  const categories = db.prepare('SELECT COUNT(*) as count FROM sales_categories').get();
  if (categories.count === 0) {
    // Add default sales categories
    const defaultCategories = [
      { id: 'cat_polish', name: 'Polish', description: 'Shoe polish products' },
      { id: 'cat_laces', name: 'Laces', description: 'Shoe laces' },
      { id: 'cat_insoles', name: 'Insoles', description: 'Shoe insoles' },
      { id: 'cat_accessories', name: 'Accessories', description: 'Other shoe accessories' }
    ];

    const insertCategory = db.prepare(`
      INSERT INTO sales_categories (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    defaultCategories.forEach(category => {
      insertCategory.run(category.id, category.name, category.description);
    });
  }

  const services = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (services.count === 0) {
    // Add default services
    const defaultServices = [
      { id: 'srv_repair', name: 'Basic Repair', price: 25.00, estimated_days: 3, category: 'repair' },
      { id: 'srv_polish', name: 'Polish Service', price: 15.00, estimated_days: 1, category: 'polish' },
      { id: 'srv_clean', name: 'Deep Cleaning', price: 20.00, estimated_days: 2, category: 'cleaning' }
    ];

    const insertService = db.prepare(`
      INSERT INTO services (id, name, price, estimated_days, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    defaultServices.forEach(service => {
      insertService.run(service.id, service.name, service.price, service.estimated_days, service.category);
    });
  }
};

// Initialize the database
initializeDatabase();

export default db;
