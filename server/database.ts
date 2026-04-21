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
    account_balance REAL DEFAULT 0,
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
    payment_method TEXT,
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

  -- Operation payments table
  CREATE TABLE IF NOT EXISTS operation_payments (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount REAL NOT NULL,
    transaction_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operation_id) REFERENCES operations (id)
  );

  -- Operation Shoes table
  CREATE TABLE IF NOT EXISTS operation_shoes (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    category TEXT NOT NULL,
    shoe_size TEXT,
    color TEXT,
    color_description TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (operation_id) REFERENCES operations (id)
  );

  -- Colors table
  CREATE TABLE IF NOT EXISTS colors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hex_code TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT
  );

  -- Invoices table
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    type TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    amount_paid REAL DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    promised_date TEXT,
    generated_by TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (operation_id) REFERENCES operations (id)
  );

  -- Staff Conversations table
  CREATE TABLE IF NOT EXISTS staff_conversations (
    id TEXT PRIMARY KEY,
    participant1_id TEXT NOT NULL,
    participant2_id TEXT NOT NULL,
    last_message_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant1_id) REFERENCES users(id),
    FOREIGN KEY (participant2_id) REFERENCES users(id),
    UNIQUE(participant1_id, participant2_id)
  );

  -- Staff Messages table
  CREATE TABLE IF NOT EXISTS staff_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES staff_conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_staff_messages_conversation ON staff_messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_staff_messages_sender ON staff_messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_staff_messages_read ON staff_messages(is_read);
  CREATE INDEX IF NOT EXISTS idx_staff_conversations_participants ON staff_conversations(participant1_id, participant2_id);

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

  -- Retail products table for accessory products for sale
  CREATE TABLE IF NOT EXISTS retail_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    default_price REAL DEFAULT 0,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Operation retail items table for storing retail items within an operation
  CREATE TABLE IF NOT EXISTS operation_retail_items (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operation_id) REFERENCES operations(id)
  );

  -- Expenses table
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    vendor TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Daily balance archives table
  CREATE TABLE IF NOT EXISTS daily_balance_archives (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    sales_total REAL NOT NULL,
    expenses_total REAL NOT NULL,
    cash_at_hand REAL NOT NULL,
    net_balance REAL NOT NULL,
    data_json TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Commission archives table for monthly commission snapshots
  CREATE TABLE IF NOT EXISTS commission_archives (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_sales REAL NOT NULL DEFAULT 0,
    commission_rate REAL NOT NULL,
    commission_amount REAL NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
    archived_at TEXT DEFAULT CURRENT_TIMESTAMP,
    paid_at TEXT,
    created_by TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, year, month)
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
  CREATE INDEX IF NOT EXISTS idx_commission_archives_user ON commission_archives(user_id);
  CREATE INDEX IF NOT EXISTS idx_commission_archives_year_month ON commission_archives(year, month);
  CREATE INDEX IF NOT EXISTS idx_commission_archives_status ON commission_archives(status);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_staff_targets_user ON staff_targets(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
  CREATE INDEX IF NOT EXISTS idx_retail_products_active_order ON retail_products(is_active, display_order);
  CREATE INDEX IF NOT EXISTS idx_operation_retail_items_operation ON operation_retail_items(operation_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
`);

// Migration: Add image_url column to retail_products if it doesn't exist
try {
  const result = db.exec("PRAGMA table_info(retail_products)");
  const columns = result[0]?.values?.map((v: any[]) => v[1]) || [];
  if (!columns.includes('image_url')) {
    db.exec('ALTER TABLE retail_products ADD COLUMN image_url TEXT');
    console.log('Migration: Added image_url column to retail_products table');
  }
} catch (e) {
  // Migration already applied or other error, continue
}

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

// Function to seed retail products
export const seedRetailProducts = async () => {
  try {
    const countResult = await db.get("SELECT COUNT(*) as count FROM retail_products");
    if (countResult && countResult.count > 0) {
      console.log('Retail products already seeded, skipping...');
      return;
    }

    const { v4: uuidv4 } = await import('uuid');
    const now = new Date().toISOString();

    const retailProducts = [
      // Care Products
      { id: uuidv4(), name: 'gel cushions', category: 'Care Products', description: 'Gel cushions for extra comfort', default_price: 25000, icon: '💆' },
      { id: uuidv4(), name: 'leather creams', category: 'Care Products', description: 'Premium leather cream polish', default_price: 35000, icon: '🧴' },
      { id: uuidv4(), name: 'mink oil', category: 'Care Products', description: 'Mink oil for leather protection', default_price: 30000, icon: '🫒' },
      { id: uuidv4(), name: 'suede protector', category: 'Care Products', description: 'Suede protector spray', default_price: 28000, icon: '🛡️' },
      { id: uuidv4(), name: 'suede renovators', category: 'Care Products', description: 'Suede renovation spray', default_price: 32000, icon: '✨' },
      { id: uuidv4(), name: 'polishing cloth', category: 'Care Products', description: 'Soft polishing cloth', default_price: 15000, icon: '🧽' },
      { id: uuidv4(), name: 'patent care', category: 'Care Products', description: 'Patent leather care product', default_price: 25000, icon: '✨' },
      { id: uuidv4(), name: 'shoe lifts', category: 'Care Products', description: 'Shoe lift inserts', default_price: 20000, icon: '🏋️' },
      { id: uuidv4(), name: 'heel stoppers', category: 'Care Products', description: 'Heel stopper grips', default_price: 12000, icon: '🛑' },
      { id: uuidv4(), name: 'renovating balms', category: 'Care Products', description: 'Leather renovating balm', default_price: 30000, icon: '💆' },

      // Cleaning
      { id: uuidv4(), name: 'crep brush', category: 'Cleaning', description: 'Crep brush for cleaning', default_price: 20000, icon: '🪥' },
      { id: uuidv4(), name: 'suede brush', category: 'Cleaning', description: 'Soft bristle suede brush', default_price: 22000, icon: '🧹' },
      { id: uuidv4(), name: 'sneaker shampoo', category: 'Cleaning', description: 'Deep cleaning sneaker shampoo', default_price: 25000, icon: '🧴' },
      { id: uuidv4(), name: 'saddle soap', category: 'Cleaning', description: 'Saddle soap for leather', default_price: 18000, icon: '🧼' },
      { id: uuidv4(), name: 'lint rollers', category: 'Cleaning', description: 'Lint rollers for clothes and shoes', default_price: 15000, icon: '🪥' },
      { id: uuidv4(), name: 'suede stone', category: 'Cleaning', description: 'Suede cleaning stone', default_price: 18000, icon: '🪨' },
      { id: uuidv4(), name: 'shoe brush', category: 'Cleaning', description: 'Hard bristle shoe brush', default_price: 20000, icon: '🪥' },
      { id: uuidv4(), name: 'suede press ons', category: 'Cleaning', description: 'Suede press-on cleaning pads', default_price: 15000, icon: '👆' },

      // Accessories
      { id: uuidv4(), name: 'shoe trees', category: 'Accessories', description: 'Cedar shoe trees', default_price: 35000, icon: '🌳' },
      { id: uuidv4(), name: 'massage sandals', category: 'Accessories', description: 'Massaging sandal inserts', default_price: 45000, icon: '🩴' },
      { id: uuidv4(), name: 'socks', category: 'Accessories', description: 'Quality socks', default_price: 15000, icon: '🧦' },
      { id: uuidv4(), name: 'shoe laces', category: 'Accessories', description: 'Replacement shoe laces', default_price: 8000, icon: '🎀' },
      { id: uuidv4(), name: 'insole', category: 'Accessories', description: 'Comfort insoles', default_price: 25000, icon: '📏' },

      // Bags & Cases
      { id: uuidv4(), name: 'toilet bags', category: 'Bags & Cases', description: 'Travel toilet bags', default_price: 55000, icon: '🧳' },
      { id: uuidv4(), name: 'passport holders', category: 'Bags & Cases', description: 'Leather passport holders', default_price: 35000, icon: '📔' },
      { id: uuidv4(), name: 'laptop bags', category: 'Bags & Cases', description: 'Leather laptop bags', default_price: 85000, icon: '💻' },
      { id: uuidv4(), name: 'document bags', category: 'Bags & Cases', description: 'Document bags', default_price: 65000, icon: '📁' },
      { id: uuidv4(), name: 'suit covers', category: 'Bags & Cases', description: 'Travel suit covers', default_price: 45000, icon: '👔' },
      { id: uuidv4(), name: 'key holders', category: 'Bags & Cases', description: 'Leather key holders', default_price: 15000, icon: '🔑' },

      // Leather Goods
      { id: uuidv4(), name: 'gents wallets', category: 'Leather Goods', description: 'Gentlemen leather wallets', default_price: 55000, icon: '👝' },
      { id: uuidv4(), name: 'ladies wallets', category: 'Leather Goods', description: 'Ladies leather wallets', default_price: 50000, icon: '👛' },
      { id: uuidv4(), name: 'belts', category: 'Leather Goods', description: 'Leather belts', default_price: 35000, icon: '🎀' },
      { id: uuidv4(), name: 'watch straps', category: 'Leather Goods', description: 'Leather watch straps', default_price: 40000, icon: '⌚' },

      // Other
      { id: uuidv4(), name: 'shoes', category: 'Shoes', description: 'Assorted shoes', default_price: 150000, icon: '👟' },
    ];

    for (const product of retailProducts) {
      await db.run(
        `INSERT INTO retail_products (id, name, category, description, default_price, icon, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [product.id, product.name, product.category, product.description, product.default_price, product.icon, 1, now, now]
      );
    }

    console.log(`Seeded ${retailProducts.length} retail products`);
  } catch (error) {
    console.error('Error seeding retail products:', error);
  }
};

interface RetailCatalogItem {
  name: string;
  category: string;
  description: string;
  default_price: number;
  display_order: number;
  icon?: string;
  aliases?: string[];
}

const RETAIL_PRODUCT_CATALOG: RetailCatalogItem[] = [
  { name: 'Gel Cushions', category: 'Care Products', description: 'Gel cushions for extra comfort', default_price: 25000, display_order: 1, aliases: ['gel cousions'] },
  { name: 'Leather Creams', category: 'Care Products', description: 'Premium leather cream polish', default_price: 35000, display_order: 2 },
  { name: 'Mink Oil', category: 'Care Products', description: 'Mink oil for leather protection', default_price: 30000, display_order: 3 },
  { name: 'Crep Brush', category: 'Cleaning', description: 'Crep brush for cleaning', default_price: 20000, display_order: 4 },
  { name: 'Suede Brush', category: 'Cleaning', description: 'Soft bristle suede brush', default_price: 22000, display_order: 5, aliases: ['sued brush'] },
  { name: 'Suede Protector', category: 'Care Products', description: 'Suede protector spray', default_price: 28000, display_order: 6 },
  { name: 'Suede Press-Ons', category: 'Cleaning', description: 'Suede press-on cleaning pads', default_price: 15000, display_order: 7, aliases: ['suede press ons'] },
  { name: 'Suede Stone', category: 'Cleaning', description: 'Suede cleaning stone', default_price: 18000, display_order: 8 },
  { name: 'Sneaker Shampoo', category: 'Cleaning', description: 'Deep cleaning sneaker shampoo', default_price: 25000, display_order: 9 },
  { name: 'Suede Renovators', category: 'Care Products', description: 'Suede renovation spray', default_price: 32000, display_order: 10 },
  { name: 'Shoe Trees', category: 'Accessories', description: 'Cedar shoe trees', default_price: 35000, display_order: 11 },
  { name: 'Shoe Brush', category: 'Cleaning', description: 'Hard bristle shoe brush', default_price: 20000, display_order: 12 },
  { name: 'Polishing Cloth', category: 'Care Products', description: 'Soft polishing cloth', default_price: 15000, display_order: 13 },
  { name: 'Massage Sandals', category: 'Accessories', description: 'Massage sandal inserts', default_price: 45000, display_order: 14, aliases: ['masage sandles'] },
  { name: 'Key Holders', category: 'Bags & Cases', description: 'Leather key holders', default_price: 15000, display_order: 15 },
  { name: 'Shoe Laces', category: 'Accessories', description: 'Replacement shoe laces', default_price: 8000, display_order: 16 },
  { name: 'Renovating Balms', category: 'Care Products', description: 'Leather renovating balm', default_price: 30000, display_order: 17 },
  { name: 'Saddle Soap', category: 'Cleaning', description: 'Saddle soap for leather', default_price: 18000, display_order: 18, aliases: ['sadle soap'] },
  { name: 'Insoles', category: 'Accessories', description: 'Comfort insoles', default_price: 25000, display_order: 19, aliases: ['insole'] },
  { name: 'Patent Care', category: 'Care Products', description: 'Patent leather care product', default_price: 25000, display_order: 20 },
  { name: 'Shoe Lifts', category: 'Care Products', description: 'Shoe lift inserts', default_price: 20000, display_order: 21 },
  { name: 'Watch Straps', category: 'Leather Goods', description: 'Leather watch straps', default_price: 40000, display_order: 22 },
  { name: 'Lint Rollers', category: 'Cleaning', description: 'Lint rollers for clothes and shoes', default_price: 15000, display_order: 23 },
  { name: 'Heel Stoppers', category: 'Care Products', description: 'Heel stopper grips', default_price: 12000, display_order: 24, aliases: ['heel stopers'] },
  { name: 'Socks', category: 'Accessories', description: 'Quality socks', default_price: 15000, display_order: 25 },
  { name: 'Suit Covers', category: 'Bags & Cases', description: 'Travel suit covers', default_price: 45000, display_order: 26 },
  { name: 'Toilet Bags', category: 'Bags & Cases', description: 'Travel toilet bags', default_price: 55000, display_order: 27 },
  { name: 'Passport Holders', category: 'Bags & Cases', description: 'Leather passport holders', default_price: 35000, display_order: 28 },
  { name: 'Laptop Bags', category: 'Bags & Cases', description: 'Leather laptop bags', default_price: 85000, display_order: 29 },
  { name: 'Gents Wallets', category: 'Leather Goods', description: 'Gentlemen leather wallets', default_price: 55000, display_order: 30 },
  { name: 'Ladies Wallets', category: 'Leather Goods', description: 'Ladies leather wallets', default_price: 50000, display_order: 31 },
  { name: 'Document Bags', category: 'Bags & Cases', description: 'Document bags', default_price: 65000, display_order: 32 },
  { name: 'Belts', category: 'Leather Goods', description: 'Leather belts', default_price: 35000, display_order: 33 },
  { name: 'Shoes', category: 'Shoes', description: 'Assorted shoes', default_price: 150000, display_order: 34 },
];

const normalizeRetailProductName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const syncRetailProductsCatalog = async () => {
  const { v4: uuidv4 } = await import('uuid');
  const now = new Date().toISOString();
  const existingProducts = await db.all('SELECT * FROM retail_products');
  const consumedProductIds = new Set<string>();

  for (const product of RETAIL_PRODUCT_CATALOG) {
    const aliases = new Set(
      [product.name, ...(product.aliases || [])].map(normalizeRetailProductName)
    );
    const match = existingProducts.find((row: any) => {
      if (consumedProductIds.has(row.id)) {
        return false;
      }

      return aliases.has(normalizeRetailProductName(row.name));
    }) as any;

    if (match) {
      consumedProductIds.add(match.id);
      await db.run(
        `UPDATE retail_products
         SET name = ?, category = ?, description = ?, default_price = ?, icon = ?, display_order = ?, is_active = 1, updated_at = ?
         WHERE id = ?`,
        [
          product.name,
          product.category,
          product.description,
          product.default_price,
          product.icon ?? match.icon ?? null,
          product.display_order,
          now,
          match.id,
        ]
      );
    } else {
      await db.run(
        `INSERT INTO retail_products (
          id, name, category, description, default_price, icon, display_order, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          uuidv4(),
          product.name,
          product.category,
          product.description,
          product.default_price,
          product.icon ?? null,
          product.display_order,
          now,
          now,
        ]
      );
    }
  }

  console.log(`Retail catalog synced (${RETAIL_PRODUCT_CATALOG.length} canonical products)`);
};

// Function to initialize the database with some default data if needed
const initializeDatabase = async () => {
  try {
    // Migration: Add created_by column to operations if it doesn't exist
    try {
      await db.run(`ALTER TABLE operations ADD COLUMN created_by TEXT`);
    } catch (e) {
      // Column already exists, ignore error
    }

    // Migration: Add payment_method column to operations if it doesn't exist
    try {
      await db.run(`ALTER TABLE operations ADD COLUMN payment_method TEXT`);
    } catch (e) {
      // Column already exists, ignore error
    }

    // Migration: Add account_balance column to customers if it doesn't exist
    try {
      await db.run(`ALTER TABLE customers ADD COLUMN account_balance REAL DEFAULT 0`);
    } catch (e) {
      // Column already exists, ignore error
    }

    // Migration: Add created_by column to sales if it doesn't exist
    try {
      await db.run(`ALTER TABLE sales ADD COLUMN created_by TEXT`);
    } catch (e) {
      // Column already exists, ignore error
    }

    // Migration: Add shoe_size column to operation_shoes if it doesn't exist
    try {
      await db.run(`ALTER TABLE operation_shoes ADD COLUMN shoe_size TEXT`);
    } catch (e) {
      // Column already exists, ignore error
    }

    // Migration: Add display_order to retail_products if it doesn't exist
    try {
      await db.run(`ALTER TABLE retail_products ADD COLUMN display_order INTEGER DEFAULT 0`);
    } catch (e) {
      // Column already exists, ignore error
    }

    // Migration: Add product_id to operation_retail_items if it doesn't exist
    try {
      await db.run(`ALTER TABLE operation_retail_items ADD COLUMN product_id TEXT`);
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
    const { seedProductsAndCategories, seedColors } = await import('./seed-data');
    await seedProductsAndCategories();
    await seedColors();
    await syncRetailProductsCatalog();
  } catch (err) {
    console.error('Failed to seed products and categories:', err);
  }
};

// Start initialization
initializeDatabaseWithSeed();

export default db as any;
