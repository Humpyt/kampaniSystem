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
`);

export default db;
