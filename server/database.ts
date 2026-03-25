import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

// Promisify database methods
db.run = promisify(db.run.bind(db)) as any;
db.get = promisify(db.get.bind(db)) as any;
db.all = promisify(db.all.bind(db)) as any;
db.exec = promisify(db.exec.bind(db)) as any;

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

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
    discount REAL DEFAULT 0,
    notes TEXT,
    promised_date TEXT,
    is_no_charge INTEGER DEFAULT 0,
    is_do_over INTEGER DEFAULT 0,
    is_delivery INTEGER DEFAULT 0,
    is_pickup INTEGER DEFAULT 0,
    created_by TEXT,
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

  -- Customer credits table
  CREATE TABLE IF NOT EXISTS customer_credits (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    amount REAL NOT NULL,
    balance_after REAL NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );

  -- Sales table to track all sales
  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    sale_type TEXT NOT NULL CHECK(sale_type IN ('repair', 'retail', 'pickup')),
    reference_id TEXT NOT NULL,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    created_by TEXT,
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

  -- Categories table
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  -- Products table
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image_url TEXT,
    category_id TEXT NOT NULL,
    in_stock INTEGER DEFAULT 1,
    featured INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  -- Sales categories table
  CREATE TABLE IF NOT EXISTS sales_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  -- Sales items table
  CREATE TABLE IF NOT EXISTS sales_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (category_id) REFERENCES sales_categories (id)
  );

  -- Users table for authentication
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    status TEXT DEFAULT 'active',
    created_at TEXT,
    updated_at TEXT,
    created_by TEXT
  );

  -- Staff targets table
  CREATE TABLE IF NOT EXISTS staff_targets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    daily_target REAL DEFAULT 1000000,
    monthly_target REAL DEFAULT 26000000,
    effective_date TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- User permissions table for granular control
  CREATE TABLE IF NOT EXISTS user_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    permission TEXT NOT NULL,
    granted INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, permission)
  );
`);

// Initialize database with indexes
db.exec(`
  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_operations_customer ON operations(customer_id);
  CREATE INDEX IF NOT EXISTS idx_operations_created_by ON operations(created_by);
  CREATE INDEX IF NOT EXISTS idx_operation_shoes_operation ON operation_shoes(operation_id);
  CREATE INDEX IF NOT EXISTS idx_operation_services_operation_shoe ON operation_services(operation_shoe_id);
  CREATE INDEX IF NOT EXISTS idx_operation_services_service ON operation_services(service_id);
  CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
  CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);
  CREATE INDEX IF NOT EXISTS idx_qrcodes_type ON qrcodes(type);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_staff_targets_user ON staff_targets(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
`);

// Create a wrapper to mimic better-sqlite3's prepare interface
const createStatement = (sql: string) => {
  return {
    run: (...params: any[]) => db.run(sql, params),
    get: (...params: any[]) => db.get(sql, params),
    all: (...params: any[]) => db.all(sql, params),
  };
};

// Extend db with prepare method
(db as any).prepare = createStatement;

// Add transaction method (simplified)
(db as any).transaction = (fn: Function) => {
  return async (...args: any[]) => {
    await db.run('BEGIN TRANSACTION');
    try {
      const result = await fn(...args);
      await db.run('COMMIT');
      return result;
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  };
};

// Add name property
Object.defineProperty(db, 'name', {
  get: () => path.join(__dirname, 'database.db')
});

// Function to initialize the database with some default data if needed
const initializeDatabase = async () => {
  try {
    // Migration: Add created_by column to operations if it doesn't exist
    try {
      await db.run(`ALTER TABLE operations ADD COLUMN created_by TEXT`);
    } catch (e) {
      // Column already exists, ignore error
    }

    // Migration: Add created_by column to sales if it doesn't exist
    try {
      await db.run(`ALTER TABLE sales ADD COLUMN created_by TEXT`);
    } catch (e) {
      // Column already exists, ignore error
    }

    const categories = await db.get("SELECT COUNT(*) as count FROM sales_categories");
    if (!categories || categories.count === 0) {
      // Add default sales categories
      const defaultCategories = [
        { id: 'cat_polish', name: 'Polish', description: 'Shoe polish products' },
        { id: 'cat_laces', name: 'Laces', description: 'Shoe laces' },
        { id: 'cat_insoles', name: 'Insoles', description: 'Shoe insoles' },
        { id: 'cat_accessories', name: 'Accessories', description: 'Other shoe accessories' }
      ];

      for (const category of defaultCategories) {
        await db.run(
          `INSERT INTO sales_categories (id, name, description, created_at, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [category.id, category.name, category.description]
        );
      }
    }

    const services = await db.get("SELECT COUNT(*) as count FROM services");
    if (!services || services.count === 0) {
      // Add default services
      const defaultServices = [
        { id: 'srv_repair', name: 'Basic Repair', price: 30000, estimated_days: 3, category: 'repair' },
        { id: 'srv_polish', name: 'Polish Service', price: 15000, estimated_days: 1, category: 'polish' },
        { id: 'srv_clean', name: 'Deep Cleaning', price: 25000, estimated_days: 2, category: 'cleaning' }
      ];

      for (const service of defaultServices) {
        await db.run(
          `INSERT INTO services (id, name, price, estimated_days, category, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [service.id, service.name, service.price, service.estimated_days, service.category]
        );
      }
    }

    // Create default admin user if no users exist
    const users = await db.get("SELECT COUNT(*) as count FROM users");
    if (!users || users.count === 0) {
      const bcrypt = await import('bcryptjs');
      const adminPassword = await bcrypt.default.hash('admin123', 10);
      const managerPassword = await bcrypt.default.hash('manager123', 10);
      const staffPassword = await bcrypt.default.hash('staff123', 10);
      const now = new Date().toISOString();

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['admin-001', 'Admin User', 'admin@repairpro.com', adminPassword, 'admin', 'active', now, now]
      );

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['manager-001', 'Manager User', 'manager@repairpro.com', managerPassword, 'manager', 'active', now, now]
      );

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['staff-001', 'Staff One', 'staff1@repairpro.com', staffPassword, 'staff', 'active', now, now]
      );

      // Add new staff members
      const stellaPassword = await bcrypt.default.hash('stella123', 10);
      const estherPassword = await bcrypt.default.hash('esther123', 10);
      const ritahPassword = await bcrypt.default.hash('ritah123', 10);
      const noelahPassword = await bcrypt.default.hash('noelah123', 10);
      const danielahPassword = await bcrypt.default.hash('danielah123', 10);

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['staff-002', 'Stella', 'stella@repairpro.com', stellaPassword, 'admin', 'active', now, now]
      );

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['staff-003', 'Esther', 'esther@repairpro.com', estherPassword, 'staff', 'active', now, now]
      );

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['staff-004', 'Ritah', 'ritah@repairpro.com', ritahPassword, 'staff', 'active', now, now]
      );

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['staff-005', 'Noelah', 'noelah@repairpro.com', noelahPassword, 'staff', 'active', now, now]
      );

      await db.run(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['staff-006', 'Danielah', 'danielah@repairpro.com', danielahPassword, 'staff', 'active', now, now]
      );

      // Add default permissions for admin
      const adminPermissions = [
        'view_customers', 'create_drop', 'create_pickup', 'send_messages',
        'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
        'view_business_targets', 'view_all_targets', 'manage_staff',
        'manage_users', 'manage_settings', 'manage_inventory', 'manage_supplies'
      ];

      for (const permission of adminPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-admin-${permission}`, 'admin-001', permission, 1, now]
        );
      }

      // Add default permissions for manager (staff + management)
      const managerPermissions = [
        'view_customers', 'create_drop', 'create_pickup', 'send_messages',
        'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
        'view_business_targets', 'view_all_targets', 'manage_staff', 'view_reports'
      ];

      for (const permission of managerPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-manager-${permission}`, 'manager-001', permission, 1, now]
        );
      }

      // Add default permissions for staff
      const staffPermissions = [
        'view_customers', 'create_drop', 'create_pickup', 'send_messages',
        'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
        'view_business_targets'
      ];

      for (const permission of staffPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-staff-${permission}`, 'staff-001', permission, 1, now]
        );
      }

      // Add admin permissions for Stella (staff-002)
      for (const permission of adminPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-stella-${permission}`, 'staff-002', permission, 1, now]
        );
      }

      // Add staff permissions for Esther (staff-003)
      for (const permission of staffPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-esther-${permission}`, 'staff-003', permission, 1, now]
        );
      }

      // Add staff permissions for Ritah (staff-004)
      for (const permission of staffPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-ritah-${permission}`, 'staff-004', permission, 1, now]
        );
      }

      // Add staff permissions for Noelah (staff-005)
      for (const permission of staffPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-noelah-${permission}`, 'staff-005', permission, 1, now]
        );
      }

      // Add staff permissions for Danielah (staff-006)
      for (const permission of staffPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [`perm-danielah-${permission}`, 'staff-006', permission, 1, now]
        );
      }

      // Add staff targets for all users
      const staffTargets = [
        { userId: 'admin-001', dailyTarget: 1000000, monthlyTarget: 26000000 },
        { userId: 'manager-001', dailyTarget: 1000000, monthlyTarget: 26000000 },
        { userId: 'staff-001', dailyTarget: 1000000, monthlyTarget: 26000000 },
        { userId: 'staff-002', dailyTarget: 1200000, monthlyTarget: 31200000 }, // Stella - admin
        { userId: 'staff-003', dailyTarget: 1000000, monthlyTarget: 26000000 }, // Esther
        { userId: 'staff-004', dailyTarget: 1000000, monthlyTarget: 26000000 }, // Ritah
        { userId: 'staff-005', dailyTarget: 1000000, monthlyTarget: 26000000 }, // Noelah
        { userId: 'staff-006', dailyTarget: 1000000, monthlyTarget: 26000000 }, // Danielah
      ];

      for (const target of staffTargets) {
        await db.run(
          `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [`target-${target.userId}`, target.userId, target.dailyTarget, target.monthlyTarget, now, now, now]
        );
      }

      console.log('Created default users: admin@repairpro.com/admin123, manager@repairpro.com/manager123, staff1@repairpro.com/staff123');
      console.log('Created additional staff: stella@repairpro.com/stella123 (admin), esther@repairpro.com/esther123, ritah@repairpro.com/ritah123, noelah@repairpro.com/noelah123, danielah@repairpro.com/danielah123');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Initialize the database and seed data
const initializeDatabaseWithSeed = async () => {
  await initializeDatabase();

  // Seed sample data after initialization
  try {
    const { seedProductsAndCategories } = await import('./seed-data');
    await seedProductsAndCategories();
  } catch (err) {
    console.error('Failed to seed products and categories:', err);
  }
};

// Start initialization
initializeDatabaseWithSeed();

export default db as any;
