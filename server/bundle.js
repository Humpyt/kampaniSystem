var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/seed-data.ts
var seed_data_exports = {};
__export(seed_data_exports, {
  seedColors: () => seedColors,
  seedProductsAndCategories: () => seedProductsAndCategories
});
import { v4 as uuidv4 } from "uuid";
async function seedProductsAndCategories() {
  try {
    console.log("Seeding products and categories...");
    const existingCategories = await database_default.prepare("SELECT COUNT(*) as count FROM categories").get();
    if (existingCategories && existingCategories.count > 0) {
      console.log("Products and categories already seeded");
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const categories = [
      { id: uuidv4(), name: "Shoe Care", description: "Shoe polish, cleaners, and care products", created_at: now, updated_at: now },
      { id: uuidv4(), name: "Repair Services", description: "Professional shoe repair services", created_at: now, updated_at: now },
      { id: uuidv4(), name: "Accessories", description: "Shoe laces, insoles, and accessories", created_at: now, updated_at: now }
    ];
    for (const category of categories) {
      await database_default.prepare(`
        INSERT INTO categories (id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(category.id, category.name, category.description, category.created_at, category.updated_at);
    }
    const products = [
      {
        id: uuidv4(),
        name: "Premium Shoe Polish Kit",
        price: 95e3,
        description: "Complete shoe care kit with polish, brushes, and cloths",
        imageUrl: "",
        categoryId: categories[0].id,
        inStock: 1,
        featured: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        name: "Heel Replacement",
        price: 14e4,
        description: "Professional heel replacement service",
        imageUrl: "",
        categoryId: categories[1].id,
        inStock: 1,
        featured: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        name: "Premium Shoe Laces",
        price: 35e3,
        description: "High-quality wax cotton shoe laces",
        imageUrl: "",
        categoryId: categories[2].id,
        inStock: 1,
        featured: 0,
        created_at: now,
        updated_at: now
      }
    ];
    for (const product of products) {
      await database_default.prepare(`
        INSERT INTO products (id, name, price, description, image_url, category_id, in_stock, featured, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        product.id,
        product.name,
        product.price,
        product.description,
        product.imageUrl,
        product.categoryId,
        product.inStock,
        product.featured,
        product.created_at,
        product.updated_at
      );
    }
    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}
async function seedColors() {
  try {
    console.log("Seeding colors...");
    const existingColors = await database_default.prepare("SELECT COUNT(*) as count FROM colors").get();
    if (existingColors && existingColors.count > 0) {
      console.log("Colors already seeded");
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const colors = [
      { id: "beige", name: "Beige", hex_code: "#F5F5DC", display_order: 1 },
      { id: "black", name: "Black", hex_code: "#000000", display_order: 2 },
      { id: "blue", name: "Blue", hex_code: "#0000FF", display_order: 3 },
      { id: "brown", name: "Brown", hex_code: "#8B4513", display_order: 4 },
      { id: "burgundy", name: "Burgundy", hex_code: "#800000", display_order: 5 },
      { id: "gray", name: "Gray", hex_code: "#808080", display_order: 6 },
      { id: "green", name: "Green", hex_code: "#008000", display_order: 7 },
      { id: "multi", name: "Multi", hex_code: "#RAINBOW", display_order: 8 },
      { id: "navy", name: "Navy", hex_code: "#000080", display_order: 9 },
      { id: "orange", name: "Orange", hex_code: "#FFA500", display_order: 10 },
      { id: "pink", name: "Pink", hex_code: "#FFC0CB", display_order: 11 },
      { id: "red", name: "Red", hex_code: "#FF0000", display_order: 12 },
      { id: "white", name: "White", hex_code: "#FFFFFF", display_order: 13 },
      { id: "yellow", name: "Yellow", hex_code: "#FFFF00", display_order: 14 }
    ];
    for (const color of colors) {
      await database_default.prepare(`
        INSERT INTO colors (id, name, hex_code, display_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `).run(color.id, color.name, color.hex_code, color.display_order, now, now);
    }
    console.log("Colors seeded successfully");
  } catch (error) {
    console.error("Error seeding colors:", error);
    throw error;
  }
}
var init_seed_data = __esm({
  "server/seed-data.ts"() {
    init_database();
  }
});

// server/database.ts
var database_exports = {};
__export(database_exports, {
  default: () => database_default,
  seedRetailProducts: () => seedRetailProducts
});
import sqlite3 from "sqlite3";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
var __filename, __dirname, db, createStatement, seedRetailProducts, RETAIL_PRODUCT_CATALOG, normalizeRetailProductName, syncRetailProductsCatalog, initializeDatabase, initializeDatabaseWithSeed, database_default;
var init_database = __esm({
  "server/database.ts"() {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    db = new sqlite3.Database(path.join(__dirname, "database.db"));
    db.run = promisify(db.run.bind(db));
    db.get = promisify(db.get.bind(db));
    db.all = promisify(db.all.bind(db));
    db.exec = promisify(db.exec.bind(db));
    db.exec("PRAGMA foreign_keys = ON;");
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
    createStatement = (sql) => {
      return {
        run: (...params) => db.run(sql, params),
        get: (...params) => db.get(sql, params),
        all: (...params) => db.all(sql, params)
      };
    };
    db.prepare = createStatement;
    db.transaction = (fn) => {
      return async (...args) => {
        await db.run("BEGIN TRANSACTION");
        try {
          const result = await fn(...args);
          await db.run("COMMIT");
          return result;
        } catch (error) {
          await db.run("ROLLBACK");
          throw error;
        }
      };
    };
    Object.defineProperty(db, "name", {
      get: () => path.join(__dirname, "database.db")
    });
    seedRetailProducts = async () => {
      try {
        const countResult = await db.get("SELECT COUNT(*) as count FROM retail_products");
        if (countResult && countResult.count > 0) {
          console.log("Retail products already seeded, skipping...");
          return;
        }
        const { v4: uuidv415 } = await import("uuid");
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const retailProducts = [
          // Care Products
          { id: uuidv415(), name: "gel cushions", category: "Care Products", description: "Gel cushions for extra comfort", default_price: 25e3, icon: "\u{1F486}" },
          { id: uuidv415(), name: "leather creams", category: "Care Products", description: "Premium leather cream polish", default_price: 35e3, icon: "\u{1F9F4}" },
          { id: uuidv415(), name: "mink oil", category: "Care Products", description: "Mink oil for leather protection", default_price: 3e4, icon: "\u{1FAD2}" },
          { id: uuidv415(), name: "suede protector", category: "Care Products", description: "Suede protector spray", default_price: 28e3, icon: "\u{1F6E1}\uFE0F" },
          { id: uuidv415(), name: "suede renovators", category: "Care Products", description: "Suede renovation spray", default_price: 32e3, icon: "\u2728" },
          { id: uuidv415(), name: "polishing cloth", category: "Care Products", description: "Soft polishing cloth", default_price: 15e3, icon: "\u{1F9FD}" },
          { id: uuidv415(), name: "patent care", category: "Care Products", description: "Patent leather care product", default_price: 25e3, icon: "\u2728" },
          { id: uuidv415(), name: "shoe lifts", category: "Care Products", description: "Shoe lift inserts", default_price: 2e4, icon: "\u{1F3CB}\uFE0F" },
          { id: uuidv415(), name: "heel stoppers", category: "Care Products", description: "Heel stopper grips", default_price: 12e3, icon: "\u{1F6D1}" },
          { id: uuidv415(), name: "renovating balms", category: "Care Products", description: "Leather renovating balm", default_price: 3e4, icon: "\u{1F486}" },
          // Cleaning
          { id: uuidv415(), name: "crep brush", category: "Cleaning", description: "Crep brush for cleaning", default_price: 2e4, icon: "\u{1FAA5}" },
          { id: uuidv415(), name: "suede brush", category: "Cleaning", description: "Soft bristle suede brush", default_price: 22e3, icon: "\u{1F9F9}" },
          { id: uuidv415(), name: "sneaker shampoo", category: "Cleaning", description: "Deep cleaning sneaker shampoo", default_price: 25e3, icon: "\u{1F9F4}" },
          { id: uuidv415(), name: "saddle soap", category: "Cleaning", description: "Saddle soap for leather", default_price: 18e3, icon: "\u{1F9FC}" },
          { id: uuidv415(), name: "lint rollers", category: "Cleaning", description: "Lint rollers for clothes and shoes", default_price: 15e3, icon: "\u{1FAA5}" },
          { id: uuidv415(), name: "suede stone", category: "Cleaning", description: "Suede cleaning stone", default_price: 18e3, icon: "\u{1FAA8}" },
          { id: uuidv415(), name: "shoe brush", category: "Cleaning", description: "Hard bristle shoe brush", default_price: 2e4, icon: "\u{1FAA5}" },
          { id: uuidv415(), name: "suede press ons", category: "Cleaning", description: "Suede press-on cleaning pads", default_price: 15e3, icon: "\u{1F446}" },
          // Accessories
          { id: uuidv415(), name: "shoe trees", category: "Accessories", description: "Cedar shoe trees", default_price: 35e3, icon: "\u{1F333}" },
          { id: uuidv415(), name: "massage sandals", category: "Accessories", description: "Massaging sandal inserts", default_price: 45e3, icon: "\u{1FA74}" },
          { id: uuidv415(), name: "socks", category: "Accessories", description: "Quality socks", default_price: 15e3, icon: "\u{1F9E6}" },
          { id: uuidv415(), name: "shoe laces", category: "Accessories", description: "Replacement shoe laces", default_price: 8e3, icon: "\u{1F380}" },
          { id: uuidv415(), name: "insole", category: "Accessories", description: "Comfort insoles", default_price: 25e3, icon: "\u{1F4CF}" },
          // Bags & Cases
          { id: uuidv415(), name: "toilet bags", category: "Bags & Cases", description: "Travel toilet bags", default_price: 55e3, icon: "\u{1F9F3}" },
          { id: uuidv415(), name: "passport holders", category: "Bags & Cases", description: "Leather passport holders", default_price: 35e3, icon: "\u{1F4D4}" },
          { id: uuidv415(), name: "laptop bags", category: "Bags & Cases", description: "Leather laptop bags", default_price: 85e3, icon: "\u{1F4BB}" },
          { id: uuidv415(), name: "document bags", category: "Bags & Cases", description: "Document bags", default_price: 65e3, icon: "\u{1F4C1}" },
          { id: uuidv415(), name: "suit covers", category: "Bags & Cases", description: "Travel suit covers", default_price: 45e3, icon: "\u{1F454}" },
          { id: uuidv415(), name: "key holders", category: "Bags & Cases", description: "Leather key holders", default_price: 15e3, icon: "\u{1F511}" },
          // Leather Goods
          { id: uuidv415(), name: "gents wallets", category: "Leather Goods", description: "Gentlemen leather wallets", default_price: 55e3, icon: "\u{1F45D}" },
          { id: uuidv415(), name: "ladies wallets", category: "Leather Goods", description: "Ladies leather wallets", default_price: 5e4, icon: "\u{1F45B}" },
          { id: uuidv415(), name: "belts", category: "Leather Goods", description: "Leather belts", default_price: 35e3, icon: "\u{1F380}" },
          { id: uuidv415(), name: "watch straps", category: "Leather Goods", description: "Leather watch straps", default_price: 4e4, icon: "\u231A" },
          // Other
          { id: uuidv415(), name: "shoes", category: "Shoes", description: "Assorted shoes", default_price: 15e4, icon: "\u{1F45F}" }
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
        console.error("Error seeding retail products:", error);
      }
    };
    RETAIL_PRODUCT_CATALOG = [
      { name: "Gel Cushions", category: "Care Products", description: "Gel cushions for extra comfort", default_price: 25e3, display_order: 1, aliases: ["gel cousions"] },
      { name: "Leather Creams", category: "Care Products", description: "Premium leather cream polish", default_price: 35e3, display_order: 2 },
      { name: "Mink Oil", category: "Care Products", description: "Mink oil for leather protection", default_price: 3e4, display_order: 3 },
      { name: "Crep Brush", category: "Cleaning", description: "Crep brush for cleaning", default_price: 2e4, display_order: 4 },
      { name: "Suede Brush", category: "Cleaning", description: "Soft bristle suede brush", default_price: 22e3, display_order: 5, aliases: ["sued brush"] },
      { name: "Suede Protector", category: "Care Products", description: "Suede protector spray", default_price: 28e3, display_order: 6 },
      { name: "Suede Press-Ons", category: "Cleaning", description: "Suede press-on cleaning pads", default_price: 15e3, display_order: 7, aliases: ["suede press ons"] },
      { name: "Suede Stone", category: "Cleaning", description: "Suede cleaning stone", default_price: 18e3, display_order: 8 },
      { name: "Sneaker Shampoo", category: "Cleaning", description: "Deep cleaning sneaker shampoo", default_price: 25e3, display_order: 9 },
      { name: "Suede Renovators", category: "Care Products", description: "Suede renovation spray", default_price: 32e3, display_order: 10 },
      { name: "Shoe Trees", category: "Accessories", description: "Cedar shoe trees", default_price: 35e3, display_order: 11 },
      { name: "Shoe Brush", category: "Cleaning", description: "Hard bristle shoe brush", default_price: 2e4, display_order: 12 },
      { name: "Polishing Cloth", category: "Care Products", description: "Soft polishing cloth", default_price: 15e3, display_order: 13 },
      { name: "Massage Sandals", category: "Accessories", description: "Massage sandal inserts", default_price: 45e3, display_order: 14, aliases: ["masage sandles"] },
      { name: "Key Holders", category: "Bags & Cases", description: "Leather key holders", default_price: 15e3, display_order: 15 },
      { name: "Shoe Laces", category: "Accessories", description: "Replacement shoe laces", default_price: 8e3, display_order: 16 },
      { name: "Renovating Balms", category: "Care Products", description: "Leather renovating balm", default_price: 3e4, display_order: 17 },
      { name: "Saddle Soap", category: "Cleaning", description: "Saddle soap for leather", default_price: 18e3, display_order: 18, aliases: ["sadle soap"] },
      { name: "Insoles", category: "Accessories", description: "Comfort insoles", default_price: 25e3, display_order: 19, aliases: ["insole"] },
      { name: "Patent Care", category: "Care Products", description: "Patent leather care product", default_price: 25e3, display_order: 20 },
      { name: "Shoe Lifts", category: "Care Products", description: "Shoe lift inserts", default_price: 2e4, display_order: 21 },
      { name: "Watch Straps", category: "Leather Goods", description: "Leather watch straps", default_price: 4e4, display_order: 22 },
      { name: "Lint Rollers", category: "Cleaning", description: "Lint rollers for clothes and shoes", default_price: 15e3, display_order: 23 },
      { name: "Heel Stoppers", category: "Care Products", description: "Heel stopper grips", default_price: 12e3, display_order: 24, aliases: ["heel stopers"] },
      { name: "Socks", category: "Accessories", description: "Quality socks", default_price: 15e3, display_order: 25 },
      { name: "Suit Covers", category: "Bags & Cases", description: "Travel suit covers", default_price: 45e3, display_order: 26 },
      { name: "Toilet Bags", category: "Bags & Cases", description: "Travel toilet bags", default_price: 55e3, display_order: 27 },
      { name: "Passport Holders", category: "Bags & Cases", description: "Leather passport holders", default_price: 35e3, display_order: 28 },
      { name: "Laptop Bags", category: "Bags & Cases", description: "Leather laptop bags", default_price: 85e3, display_order: 29 },
      { name: "Gents Wallets", category: "Leather Goods", description: "Gentlemen leather wallets", default_price: 55e3, display_order: 30 },
      { name: "Ladies Wallets", category: "Leather Goods", description: "Ladies leather wallets", default_price: 5e4, display_order: 31 },
      { name: "Document Bags", category: "Bags & Cases", description: "Document bags", default_price: 65e3, display_order: 32 },
      { name: "Belts", category: "Leather Goods", description: "Leather belts", default_price: 35e3, display_order: 33 },
      { name: "Shoes", category: "Shoes", description: "Assorted shoes", default_price: 15e4, display_order: 34 }
    ];
    normalizeRetailProductName = (name) => name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
    syncRetailProductsCatalog = async () => {
      const { v4: uuidv415 } = await import("uuid");
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const existingProducts = await db.all("SELECT * FROM retail_products");
      const consumedProductIds = /* @__PURE__ */ new Set();
      for (const product of RETAIL_PRODUCT_CATALOG) {
        const aliases = new Set(
          [product.name, ...product.aliases || []].map(normalizeRetailProductName)
        );
        const match = existingProducts.find((row) => {
          if (consumedProductIds.has(row.id)) {
            return false;
          }
          return aliases.has(normalizeRetailProductName(row.name));
        });
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
              match.id
            ]
          );
        } else {
          await db.run(
            `INSERT INTO retail_products (
          id, name, category, description, default_price, icon, display_order, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            [
              uuidv415(),
              product.name,
              product.category,
              product.description,
              product.default_price,
              product.icon ?? null,
              product.display_order,
              now,
              now
            ]
          );
        }
      }
      console.log(`Retail catalog synced (${RETAIL_PRODUCT_CATALOG.length} canonical products)`);
    };
    initializeDatabase = async () => {
      try {
        try {
          await db.run(`ALTER TABLE operations ADD COLUMN created_by TEXT`);
        } catch (e) {
        }
        try {
          await db.run(`ALTER TABLE operations ADD COLUMN payment_method TEXT`);
        } catch (e) {
        }
        try {
          await db.run(`ALTER TABLE customers ADD COLUMN account_balance REAL DEFAULT 0`);
        } catch (e) {
        }
        try {
          await db.run(`ALTER TABLE sales ADD COLUMN created_by TEXT`);
        } catch (e) {
        }
        try {
          await db.run(`ALTER TABLE operation_shoes ADD COLUMN shoe_size TEXT`);
        } catch (e) {
        }
        try {
          await db.run(`ALTER TABLE retail_products ADD COLUMN display_order INTEGER DEFAULT 0`);
        } catch (e) {
        }
        try {
          await db.run(`ALTER TABLE operation_retail_items ADD COLUMN product_id TEXT`);
        } catch (e) {
        }
        const categories = await db.get("SELECT COUNT(*) as count FROM sales_categories");
        if (!categories || categories.count === 0) {
          const defaultCategories = [
            { id: "cat_polish", name: "Polish", description: "Shoe polish products" },
            { id: "cat_laces", name: "Laces", description: "Shoe laces" },
            { id: "cat_insoles", name: "Insoles", description: "Shoe insoles" },
            { id: "cat_accessories", name: "Accessories", description: "Other shoe accessories" }
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
          const defaultServices = [
            { id: "srv_repair", name: "Basic Repair", price: 3e4, estimated_days: 3, category: "repair" },
            { id: "srv_polish", name: "Polish Service", price: 15e3, estimated_days: 1, category: "polish" },
            { id: "srv_clean", name: "Deep Cleaning", price: 25e3, estimated_days: 2, category: "cleaning" }
          ];
          for (const service of defaultServices) {
            await db.run(
              `INSERT INTO services (id, name, price, estimated_days, category, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [service.id, service.name, service.price, service.estimated_days, service.category]
            );
          }
        }
        const users = await db.get("SELECT COUNT(*) as count FROM users");
        if (!users || users.count === 0) {
          const bcrypt2 = await import("bcryptjs");
          const adminPassword = await bcrypt2.default.hash("admin123", 10);
          const managerPassword = await bcrypt2.default.hash("manager123", 10);
          const staffPassword = await bcrypt2.default.hash("staff123", 10);
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await db.run(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["admin-001", "Admin User", "admin@repairpro.com", adminPassword, "admin", "active", now, now]
          );
          await db.run(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["manager-001", "Manager User", "manager@repairpro.com", managerPassword, "manager", "active", now, now]
          );
          const stellaPassword = await bcrypt2.default.hash("stella123", 10);
          const estherPassword = await bcrypt2.default.hash("esther123", 10);
          const ritahPassword = await bcrypt2.default.hash("ritah123", 10);
          const noelahPassword = await bcrypt2.default.hash("noelah123", 10);
          const danielahPassword = await bcrypt2.default.hash("danielah123", 10);
          await db.run(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["staff-002", "Stella", "stella@repairpro.com", stellaPassword, "admin", "active", now, now]
          );
          await db.run(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["staff-003", "Esther", "esther@repairpro.com", estherPassword, "staff", "active", now, now]
          );
          await db.run(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["staff-004", "Ritah", "ritah@repairpro.com", ritahPassword, "staff", "active", now, now]
          );
          await db.run(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["staff-005", "Noelah", "noelah@repairpro.com", noelahPassword, "staff", "active", now, now]
          );
          await db.run(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ["staff-006", "Danielah", "danielah@repairpro.com", danielahPassword, "staff", "active", now, now]
          );
          const adminPermissions = [
            "view_customers",
            "create_drop",
            "create_pickup",
            "send_messages",
            "view_operations",
            "view_sales",
            "view_marketing",
            "view_qrcodes",
            "view_business_targets",
            "view_all_targets",
            "manage_staff",
            "manage_users",
            "manage_settings",
            "manage_inventory",
            "manage_supplies"
          ];
          for (const permission of adminPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-admin-${permission}`, "admin-001", permission, 1, now]
            );
          }
          const managerPermissions = [
            "view_customers",
            "create_drop",
            "create_pickup",
            "send_messages",
            "view_operations",
            "view_sales",
            "view_marketing",
            "view_qrcodes",
            "view_business_targets",
            "view_all_targets",
            "manage_staff",
            "view_reports"
          ];
          for (const permission of managerPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-manager-${permission}`, "manager-001", permission, 1, now]
            );
          }
          const staffPermissions = [
            "view_customers",
            "create_drop",
            "create_pickup",
            "send_messages",
            "view_operations",
            "view_sales",
            "view_marketing",
            "view_qrcodes",
            "view_business_targets"
          ];
          for (const permission of staffPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-staff-${permission}`, "staff-001", permission, 1, now]
            );
          }
          for (const permission of adminPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-stella-${permission}`, "staff-002", permission, 1, now]
            );
          }
          for (const permission of staffPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-esther-${permission}`, "staff-003", permission, 1, now]
            );
          }
          for (const permission of staffPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-ritah-${permission}`, "staff-004", permission, 1, now]
            );
          }
          for (const permission of staffPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-noelah-${permission}`, "staff-005", permission, 1, now]
            );
          }
          for (const permission of staffPermissions) {
            await db.run(
              `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
              [`perm-danielah-${permission}`, "staff-006", permission, 1, now]
            );
          }
          const staffTargets = [
            { userId: "admin-001", dailyTarget: 1e6, monthlyTarget: 26e6 },
            { userId: "manager-001", dailyTarget: 1e6, monthlyTarget: 26e6 },
            { userId: "staff-001", dailyTarget: 1e6, monthlyTarget: 26e6 },
            { userId: "staff-002", dailyTarget: 12e5, monthlyTarget: 312e5 },
            // Stella - admin
            { userId: "staff-003", dailyTarget: 1e6, monthlyTarget: 26e6 },
            // Esther
            { userId: "staff-004", dailyTarget: 1e6, monthlyTarget: 26e6 },
            // Ritah
            { userId: "staff-005", dailyTarget: 1e6, monthlyTarget: 26e6 },
            // Noelah
            { userId: "staff-006", dailyTarget: 1e6, monthlyTarget: 26e6 }
            // Danielah
          ];
          for (const target of staffTargets) {
            await db.run(
              `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [`target-${target.userId}`, target.userId, target.dailyTarget, target.monthlyTarget, now, now, now]
            );
          }
          console.log("Created default users: admin@repairpro.com/admin123, manager@repairpro.com/manager123, staff1@repairpro.com/staff123");
          console.log("Created additional staff: stella@repairpro.com/stella123 (admin), esther@repairpro.com/esther123, ritah@repairpro.com/ritah123, noelah@repairpro.com/noelah123, danielah@repairpro.com/danielah123");
        }
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };
    initializeDatabaseWithSeed = async () => {
      await initializeDatabase();
      try {
        const { seedProductsAndCategories: seedProductsAndCategories2, seedColors: seedColors2 } = await Promise.resolve().then(() => (init_seed_data(), seed_data_exports));
        await seedProductsAndCategories2();
        await seedColors2();
        await syncRetailProductsCatalog();
      } catch (err) {
        console.error("Failed to seed products and categories:", err);
      }
    };
    initializeDatabaseWithSeed();
    database_default = db;
  }
});

// server/index.ts
init_database();
import express18 from "express";
import cors from "cors";
import { v4 as uuidv414 } from "uuid";

// server/operations.ts
init_database();
import express from "express";
import { v4 as uuidv42 } from "uuid";

// server/utils.ts
var transformOperation = (operation) => ({
  id: operation.id,
  customerId: operation.customer_id,
  status: operation.status || "pending",
  totalAmount: operation.total_amount || 0,
  paidAmount: operation.paid_amount || 0,
  discount: operation.discount || 0,
  notes: operation.notes || "",
  promisedDate: operation.promised_date || null,
  createdAt: operation.created_at,
  updatedAt: operation.updated_at,
  isNoCharge: Boolean(operation.is_no_charge),
  isDoOver: Boolean(operation.is_do_over),
  isDelivery: Boolean(operation.is_delivery),
  isPickup: Boolean(operation.is_pickup),
  customer: operation.customer_id ? {
    id: operation.customer_id,
    name: operation.customer_name,
    phone: operation.customer_phone
  } : null,
  createdBy: operation.created_by || null,
  staffName: operation.staff_name || null,
  shoes: operation.shoes || [],
  retailItems: operation.retailItems || [],
  generatedDocumentId: operation.generatedDocumentId || null,
  generatedDocumentType: operation.generatedDocumentType || null,
  ticketNumber: operation.ticket_number || null
});

// server/operations.ts
var router = express.Router();
var mapRetailItem = (item) => ({
  id: item.id,
  productId: item.product_id || null,
  productName: item.product_name,
  unitPrice: item.unit_price,
  quantity: item.quantity,
  totalPrice: item.total_price
});
var getRetailItemsByOperationIds = async (operationIds) => {
  const retailItemsMap = /* @__PURE__ */ new Map();
  if (operationIds.length === 0) {
    return retailItemsMap;
  }
  const placeholders = operationIds.map(() => "?").join(",");
  const retailItems = await database_default.prepare(`
    SELECT * FROM operation_retail_items
    WHERE operation_id IN (${placeholders})
    ORDER BY created_at ASC
  `).all(...operationIds);
  for (const item of retailItems) {
    if (!retailItemsMap.has(item.operation_id)) {
      retailItemsMap.set(item.operation_id, []);
    }
    retailItemsMap.get(item.operation_id).push(mapRetailItem(item));
  }
  return retailItemsMap;
};
router.get("/", async (req, res) => {
  try {
    const { created_by, status, limit = 1e3, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 1e3, 5e3);
    const parsedOffset = parseInt(offset) || 0;
    let query = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, u.name as staff_name
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
    `;
    const params = [];
    const conditions = [];
    if (created_by) {
      conditions.push(`o.created_by = ?`);
      params.push(created_by);
    }
    if (status) {
      conditions.push(`o.status = ?`);
      params.push(status);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }
    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parsedLimit, parsedOffset);
    const operations = await database_default.prepare(query).all(...params);
    const countQuery = `SELECT COUNT(*) as total FROM operations ${conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""}`;
    const countParams = conditions.length > 0 ? params.slice(0, -2) : [];
    const { total } = await database_default.prepare(countQuery).get(...countParams);
    const operationIds = operations.map((op) => op.id);
    let shoesMap = /* @__PURE__ */ new Map();
    const retailItemsMap = await getRetailItemsByOperationIds(operationIds);
    if (operationIds.length > 0) {
      const placeholders = operationIds.map(() => "?").join(",");
      const allShoes = await database_default.prepare(`
        SELECT os.*, s.name as service_name, s.price as service_base_price
        FROM operation_shoes os
        LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
        LEFT JOIN services s ON oss.service_id = s.id
        WHERE os.operation_id IN (${placeholders})
      `).all(...operationIds);
      for (const shoe of allShoes) {
        if (!shoesMap.has(shoe.operation_id)) {
          shoesMap.set(shoe.operation_id, []);
        }
        shoesMap.get(shoe.operation_id).push(shoe);
      }
    }
    const operationsWithShoes = operations.map((operation) => ({
      ...operation,
      shoes: (shoesMap.get(operation.id) || []).map((shoe) => ({
        id: shoe.id,
        category: shoe.category,
        color: shoe.color,
        colorDescription: shoe.color_description || "",
        notes: shoe.notes,
        services: [{
          id: shoe.service_id,
          name: shoe.service_name,
          price: shoe.price,
          basePrice: shoe.service_base_price
        }]
      })),
      retailItems: retailItemsMap.get(operation.id) || []
    }));
    res.json({
      data: operationsWithShoes.map(transformOperation),
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      }
    });
  } catch (error) {
    console.error("Failed to fetch operations:", error);
    res.status(500).json({ error: "Failed to fetch operations" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const operation = await database_default.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, u.name as staff_name
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = ?
    `).get(id);
    if (!operation) {
      return res.status(404).json({ error: "Operation not found" });
    }
    const shoes = await database_default.prepare(`
      SELECT os.*, s.name as service_name, s.price as service_base_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = ?
    `).all(id);
    const operationWithShoes = {
      ...operation,
      shoes: shoes.map((shoe) => ({
        id: shoe.id,
        category: shoe.category,
        color: shoe.color,
        colorDescription: shoe.color_description || "",
        notes: shoe.notes,
        services: [{
          id: shoe.service_id,
          name: shoe.service_name,
          price: shoe.price,
          basePrice: shoe.service_base_price
        }]
      })),
      retailItems: (await getRetailItemsByOperationIds([id])).get(id) || []
    };
    res.json(transformOperation(operationWithShoes));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch operation" });
  }
});
router.get("/:id/payments", async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await database_default.prepare(`
      SELECT * FROM operation_payments
      WHERE operation_id = ?
      ORDER BY created_at DESC
    `).all(id);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});
router.post("/", async (req, res) => {
  console.log("Received operation request:", JSON.stringify(req.body, null, 2));
  const {
    customer,
    shoes = [],
    retailItems = [],
    status,
    totalAmount,
    discount,
    isNoCharge,
    isDoOver,
    isDelivery,
    isPickup,
    notes,
    promisedDate,
    created_by,
    ticket_number
  } = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const normalizedShoes = Array.isArray(shoes) ? shoes : [];
  const normalizedRetailItems = Array.isArray(retailItems) ? retailItems : [];
  const finalTotalAmount = Number(totalAmount) || 0;
  const discountAmount = Number(discount) || 0;
  let generatedDocumentId = null;
  const walkInId = "w001";
  try {
    const existingWalkIn = await database_default.get("SELECT id FROM customers WHERE id = ?", [walkInId]);
    if (!existingWalkIn) {
      await database_default.run(
        "INSERT INTO customers (id, name, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [walkInId, "WALK-IN CUSTOMER", "N/A", "active", now, now]
      );
    }
    if (!customer || !customer.id || String(customer.id).trim() === "") {
      req.body.customer = { ...customer, id: walkInId };
    } else {
      const existingCustomer = await database_default.get("SELECT id FROM customers WHERE id = ?", [customer.id]);
      if (!existingCustomer) {
        try {
          await database_default.run(
            "INSERT INTO customers (id, name, phone, email, address, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [customer.id, customer.name || "Unknown", customer.phone || "N/A", customer.email || null, customer.address || null, "active", now, now]
          );
        } catch (insertErr) {
          if (!String(insertErr).includes("UNIQUE")) throw insertErr;
        }
      }
    }
  } catch (validationErr) {
    console.error("Customer validation error:", validationErr);
    if (!customer || !customer.id) {
      req.body.customer = { ...customer, id: walkInId };
    }
  }
  if (normalizedShoes.length === 0 && normalizedRetailItems.length === 0) {
    console.error("Invalid operation items:", { shoes, retailItems });
    return res.status(400).json({ error: "At least one repair or retail item is required" });
  }
  try {
    await database_default.run("BEGIN TRANSACTION");
    try {
      const operationId = uuidv42();
      console.log("Creating operation with ID:", operationId);
      await database_default.prepare(`
        INSERT INTO operations (
          id, customer_id, status, total_amount, discount, notes, promised_date,
          is_no_charge, is_do_over, is_delivery, is_pickup,
          ticket_number, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        operationId,
        customer.id,
        status || "pending",
        finalTotalAmount,
        discountAmount,
        notes || null,
        promisedDate || null,
        isNoCharge ? 1 : 0,
        isDoOver ? 1 : 0,
        isDelivery ? 1 : 0,
        isPickup ? 1 : 0,
        ticket_number || null,
        created_by || null,
        now,
        now
      );
      for (let index = 0; index < normalizedShoes.length; index++) {
        const shoe = normalizedShoes[index];
        console.log(`Processing shoe ${index + 1}:`, JSON.stringify(shoe, null, 2));
        const shoeId = uuidv42();
        await database_default.prepare(`
          INSERT INTO operation_shoes (
            id, operation_id, category, shoe_size, color, color_description, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          shoeId,
          operationId,
          shoe.category,
          shoe.size || null,
          shoe.color || null,
          shoe.colorDescription || null,
          shoe.notes || null,
          now,
          now
        );
        if (Array.isArray(shoe.services)) {
          for (let sIndex = 0; sIndex < shoe.services.length; sIndex++) {
            const service = shoe.services[sIndex];
            console.log(`Processing service ${sIndex + 1} for shoe ${index + 1}:`, JSON.stringify(service, null, 2));
            if (!service.service_id) {
              throw new Error(`Missing service_id for service ${sIndex + 1} of shoe ${index + 1}`);
            }
            await database_default.prepare(`
              INSERT INTO operation_services (
                id, operation_shoe_id, service_id, quantity, price, notes,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              uuidv42(),
              shoeId,
              service.service_id,
              service.quantity || 1,
              service.price || 0,
              service.notes || null,
              now,
              now
            );
          }
        }
      }
      for (let index = 0; index < normalizedRetailItems.length; index++) {
        const item = normalizedRetailItems[index];
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const unitPrice = Number(item.unitPrice);
        const totalPrice = Number(item.totalPrice) || unitPrice * quantity;
        if (!item.productName || !Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw new Error(`Invalid retail item at position ${index + 1}`);
        }
        await database_default.prepare(`
          INSERT INTO operation_retail_items (
            id, operation_id, product_id, product_name, unit_price, quantity, total_price, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv42(),
          operationId,
          item.productId || null,
          item.productName,
          unitPrice,
          quantity,
          totalPrice,
          now
        );
      }
      const operation = await database_default.prepare(`
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email
        FROM operations o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).get(operationId);
      const operationShoes = await database_default.prepare(`
        SELECT * FROM operation_shoes WHERE operation_id = ?
      `).all(operationId);
      const operationRetailItems = (await getRetailItemsByOperationIds([operationId])).get(operationId) || [];
      const shoesWithServices = [];
      for (const shoe of operationShoes) {
        const services = await database_default.prepare(`
          SELECT 
            os.*,
            s.name as service_name,
            s.price as service_base_price
          FROM operation_services os
          LEFT JOIN services s ON os.service_id = s.id
          WHERE os.operation_shoe_id = ?
        `).all(shoe.id);
        shoesWithServices.push({
          ...shoe,
          services: services.map((s) => ({
            id: s.service_id,
            name: s.service_name,
            price: s.price,
            quantity: s.quantity,
            notes: s.notes
          }))
        });
      }
      await database_default.prepare(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            last_visit = ?
        WHERE id = ?
      `).run(now, customer.id);
      await database_default.run("COMMIT");
      try {
        const invoiceId = uuidv42();
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        await database_default.prepare(`
          INSERT INTO invoices (
            id, operation_id, type, invoice_number, customer_name, customer_phone,
            subtotal, discount, total, amount_paid, payment_method, notes,
            promised_date, generated_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          invoiceId,
          operationId,
          "invoice",
          invoiceNumber,
          customer.name,
          customer.phone || "",
          finalTotalAmount + discountAmount,
          discountAmount,
          finalTotalAmount,
          0,
          null,
          notes || null,
          promisedDate || null,
          created_by || null,
          now,
          now
        );
        generatedDocumentId = invoiceId;
      } catch (err) {
        console.error("Failed to auto-generate invoice:", err);
      }
      res.json(transformOperation({
        ...operation,
        shoes: shoesWithServices,
        retailItems: operationRetailItems,
        isNoCharge: Boolean(operation.is_no_charge),
        isDoOver: Boolean(operation.is_do_over),
        isDelivery: Boolean(operation.is_delivery),
        isPickup: Boolean(operation.is_pickup),
        discount: operation.discount || 0,
        generatedDocumentId,
        generatedDocumentType: generatedDocumentId ? "invoice" : null
      }));
    } catch (error) {
      await database_default.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating operation:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create operation" });
  }
});
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const setClauses = Object.keys(updates).map((key) => {
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      return `${dbKey} = ?`;
    }).concat(["updated_at = ?"]).join(", ");
    const values = [...Object.values(updates), now, id];
    await database_default.prepare(`
      UPDATE operations
      SET ${setClauses}
      WHERE id = ?
    `).run(...values);
    const operation = await database_default.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);
    res.json(transformOperation(operation));
  } catch (error) {
    res.status(500).json({ error: "Failed to update operation" });
  }
});
router.post("/:id/payments", async (req, res) => {
  try {
    const { id } = req.params;
    const { payments } = req.body;
    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: "Payments array is required" });
    }
    const operation = await database_default.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    if (!operation) {
      return res.status(404).json({ error: "Operation not found" });
    }
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.run("BEGIN TRANSACTION");
    for (const payment of payments) {
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await database_default.run(`
        INSERT INTO operation_payments (id, operation_id, payment_method, amount, transaction_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [paymentId, id, payment.method, payment.amount, payment.transaction_id || null, now]);
    }
    const newPaidAmount = (operation.paid_amount || 0) + totalPaid;
    await database_default.run(`
      UPDATE operations
      SET paid_amount = ?,
          status = CASE WHEN ? >= total_amount THEN 'completed' ELSE status END,
          updated_at = ?
      WHERE id = ?
    `, [newPaidAmount, newPaidAmount, now, id]);
    await database_default.prepare(`
      UPDATE customers
      SET total_spent = total_spent + ?,
          last_visit = ?
      WHERE id = ?
    `).run(totalPaid, now, operation.customer_id);
    const creditAmount = Math.round(totalPaid * 0.02);
    if (creditAmount > 0) {
      const customerId = operation.customer_id;
      const creditTransactionId = `credit_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const currentCustomer = await database_default.get("SELECT account_balance FROM customers WHERE id = ?", [customerId]);
      const newCreditBalance = (currentCustomer?.account_balance || 0) + creditAmount;
      await database_default.run(`
        INSERT INTO customer_credits (id, customer_id, amount, balance_after, type, description, created_by, created_at)
        VALUES (?, ?, ?, ?, 'credit', ?, ?, ?)
      `, [creditTransactionId, customerId, creditAmount, newCreditBalance, "2% transaction credit", null, now]);
      await database_default.run("UPDATE customers SET account_balance = ? WHERE id = ?", [newCreditBalance, customerId]);
    }
    await database_default.run("COMMIT");
    let generatedDocumentId = null;
    let generatedDocumentType = null;
    if (newPaidAmount >= operation.total_amount) {
      try {
        const existingReceipt = await database_default.get(
          "SELECT id FROM invoices WHERE operation_id = ? AND type = ?",
          [id, "receipt"]
        );
        if (!existingReceipt) {
          const invoiceId = uuidv42();
          const invoiceNumber = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
          await database_default.prepare(`
            INSERT INTO invoices (
              id, operation_id, type, invoice_number, customer_name, customer_phone,
              subtotal, discount, total, amount_paid, payment_method, notes,
              promised_date, generated_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            invoiceId,
            id,
            "receipt",
            invoiceNumber,
            operation.customer_name || "",
            operation.customer_phone || "",
            operation.total_amount + (operation.discount || 0),
            operation.discount || 0,
            operation.total_amount,
            newPaidAmount,
            payments[0]?.method || null,
            operation.notes,
            operation.promised_date,
            null,
            now,
            now
          );
          generatedDocumentId = invoiceId;
        } else {
          generatedDocumentId = existingReceipt.id;
        }
        generatedDocumentType = "receipt";
      } catch (err) {
        console.error("Failed to auto-generate receipt:", err);
      }
    } else {
      const existingInvoice = await database_default.get(
        "SELECT id FROM invoices WHERE operation_id = ? AND type = ?",
        [id, "invoice"]
      );
      if (existingInvoice) {
        generatedDocumentId = existingInvoice.id;
        generatedDocumentType = "invoice";
      }
    }
    const updatedOperation = await database_default.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    const retailItems = (await getRetailItemsByOperationIds([id])).get(id) || [];
    res.json(transformOperation({
      ...updatedOperation,
      retailItems,
      generatedDocumentId,
      generatedDocumentType
    }));
  } catch (error) {
    await database_default.run("ROLLBACK");
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});
var operations_default = router;

// server/routes/inventory.ts
init_database();
import express2 from "express";
import { v4 as uuidv43 } from "uuid";
var router2 = express2.Router();
router2.get("/supplies", async (req, res) => {
  try {
    const { category } = req.query;
    console.log("Fetching supplies for category:", category);
    const query = category ? "SELECT * FROM supplies WHERE LOWER(category) = LOWER(?)" : "SELECT * FROM supplies";
    const items = category ? await database_default.prepare(query).all(category) : await database_default.prepare(query).all();
    console.log("Found items:", items.length);
    console.log("Sample item:", items[0]);
    res.json(items);
  } catch (error) {
    console.error("Error fetching supplies:", error);
    res.status(500).json({ error: "Failed to fetch supplies items" });
  }
});
router2.post("/supplies", async (req, res) => {
  try {
    const { name, category, description, onHand, minStock, cost, unit } = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = uuidv43();
    await database_default.prepare(`
      INSERT INTO supplies (
        id, name, category, description, on_hand, min_stock, cost, unit,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      category,
      description,
      onHand,
      minStock,
      cost,
      unit,
      now,
      now
    );
    const item = await database_default.prepare("SELECT * FROM supplies WHERE id = ?").get(id);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating supply:", error);
    res.status(500).json({ error: "Failed to create supply item" });
  }
});
router2.put("/supplies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, onHand, minStock, cost, unit } = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      UPDATE supplies SET
        name = ?,
        category = ?,
        description = ?,
        on_hand = ?,
        min_stock = ?,
        cost = ?,
        unit = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name,
      category,
      description,
      onHand,
      minStock,
      cost,
      unit,
      now,
      id
    );
    const item = await database_default.prepare("SELECT * FROM supplies WHERE id = ?").get(id);
    if (!item) {
      return res.status(404).json({ error: "Supply item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error updating supply:", error);
    res.status(500).json({ error: "Failed to update supply item" });
  }
});
router2.delete("/supplies/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database_default.prepare("DELETE FROM supplies WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Supply item not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting supply:", error);
    res.status(500).json({ error: "Failed to delete supply item" });
  }
});
var inventory_default = router2;

// server/routes/printer.ts
init_database();
import express3 from "express";
var router3 = express3.Router();
var printerConfig = {
  type: "EPSON",
  interface: "printer:auto",
  characterSet: "PC437_USA",
  removeSpecialCharacters: false,
  options: { timeout: 5e3 },
  width: 42
};
var _printerMod = null;
var _escposMod = null;
async function loadPrinterModules() {
  if (!_printerMod) {
    try {
      _printerMod = await import("node-thermal-printer");
    } catch (err) {
      console.warn("node-thermal-printer unavailable:", err.message);
    }
  }
  if (!_escposMod) {
    try {
      _escposMod = await import("escpos-usb");
    } catch (err) {
      console.warn("escpos-usb unavailable:", err.message);
    }
  }
  return {
    printerModule: _printerMod ?? { ThermalPrinter: null },
    escposModule: _escposMod ?? { USB: null }
  };
}
async function generateReceiptPDF(data) {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ margin: 15, size: [226, 600], layout: "portrait" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const W = 196;
  const RX = 160;
  const fmt = (n) => "UGX " + (n || 0).toLocaleString("en-US");
  let y = 15;
  doc.fillColor("#000000").fontSize(16).font("Helvetica-Bold");
  doc.text("KAMPANIS", 0, y, { align: "center", width: 226 });
  y += 20;
  doc.fontSize(8).font("Helvetica");
  doc.text("Shoes & Bags Clinic", 0, y, { align: "center", width: 226 });
  y += 11;
  doc.fontSize(6.5).fillColor("#777777");
  doc.text("FORESET MALL, KOLOLO, KAMPALA, UGANDA", 0, y, { align: "center", width: 226 });
  y += 11;
  doc.moveTo(15, y).lineTo(211, y).strokeColor("#cccccc").stroke();
  y += 9;
  doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
  doc.text(data.title, 0, y, { align: "center", width: 226 });
  y += 9;
  doc.moveTo(15, y).lineTo(211, y).strokeColor("#dddddd").stroke();
  y += 9;
  const infoPairs = [];
  if (data.ticketNumber) infoPairs.push(["Ticket No", data.ticketNumber]);
  if (data.date) infoPairs.push(["Date", data.date]);
  if (data.customerName) infoPairs.push(["Customer", data.customerName]);
  if (data.customerPhone) infoPairs.push(["Phone", data.customerPhone]);
  if (data.promisedDate) infoPairs.push(["Ready On", data.promisedDate]);
  doc.fontSize(7.5).font("Helvetica");
  for (const [label, value] of infoPairs) {
    doc.fillColor("#999999").text(label + ": ", 15, y, { width: 70 });
    doc.fillColor("#222222").text(value || "N/A", 85, y, { width: RX - 85 });
    y += 12;
  }
  y += 4;
  doc.moveTo(15, y).lineTo(211, y).strokeColor("#cccccc").stroke();
  y += 9;
  doc.fillColor("#888888").fontSize(7).font("Helvetica-Bold");
  doc.text("SERVICE", 15, y, { width: 130 });
  doc.text("AMOUNT", RX, y, { align: "right", width: 66 });
  y += 7;
  doc.moveTo(15, y).lineTo(211, y).strokeColor("#dddddd").stroke();
  y += 6;
  const DESC_X = 15;
  const AMT_X = 160;
  const AMT_W = 51;
  doc.font("Helvetica").fillColor("#222222").fontSize(8);
  for (const item of data.items) {
    const lines = (item.description || "Service").split("\n");
    let maxHeight = 0;
    for (const line of lines) {
      const lh = doc.heightOfString(line, { width: 130 });
      doc.text(line, DESC_X, y, { width: 130, height: lh });
      maxHeight = Math.max(maxHeight, lh);
    }
    const amtStr = fmt(item.price);
    doc.text(amtStr, AMT_X, y, { align: "right", width: AMT_W });
    y += Math.max(maxHeight + 2, 13);
  }
  y += 4;
  doc.moveTo(15, y).lineTo(211, y).strokeColor("#cccccc").stroke();
  y += 9;
  const totals = [];
  totals.push(["Subtotal", fmt(data.subtotal || data.total), false]);
  if (data.tax) totals.push(["Tax", fmt(data.tax), false]);
  totals.push(["TOTAL", fmt(data.total), true]);
  for (const [label, value, bold] of totals) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 9.5 : 8);
    doc.fillColor(bold ? "#000000" : "#555555").text(label + ":", 15, y, { width: 130 });
    doc.fillColor("#000000").text(value, RX, y, { align: "right", width: 66 });
    y += bold ? 14 : 12;
  }
  if (data.amountPaid !== void 0) {
    doc.fontSize(8).font("Helvetica").fillColor("#666666");
    doc.text("Paid (" + (data.paymentMethod || "Cash") + "):", 15, y, { width: 130 });
    doc.fillColor("#000000").text(fmt(data.amountPaid), RX, y, { align: "right", width: 66 });
    y += 12;
    if (data.balance !== void 0 && data.balance !== 0) {
      doc.font("Helvetica-Bold").fillColor(data.balance > 0 ? "#cc2200" : "#008800");
      doc.text(data.balance > 0 ? "Balance:" : "Change:", 15, y, { width: 130 });
      doc.text(fmt(Math.abs(data.balance)), RX, y, { align: "right", width: 66 });
      y += 12;
    }
  }
  if (data.promisedDate) {
    y += 6;
    doc.moveTo(15, y).lineTo(211, y).strokeColor("#cccccc").stroke();
    y += 9;
    try {
      const https = await import("https");
      const barcodeData = data.ticketNumber || data.ticketId || "";
      const url = "https://barcode.tec-it.com/barcode.ashx?data=" + encodeURIComponent(barcodeData) + "&code=Code128&dpi=96";
      const imgBuf = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          const chunks2 = [];
          res.on("data", (c) => chunks2.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks2)));
          res.on("error", reject);
        }).on("error", reject);
      });
      if (imgBuf && imgBuf.length > 0) {
        doc.image(imgBuf, 60, y, { width: 106, height: 40 });
        y += 45;
      }
    } catch (_e) {
    }
    doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold");
    doc.text("REG/PICKUP", 0, y, { align: "center", width: 226 });
    y += 14;
  }
  if (data.notes) {
    y += 4;
    doc.moveTo(15, y).lineTo(211, y).strokeColor("#dddddd").stroke();
    y += 8;
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#888888").text("Notes:", 15, y, { width: W });
    y += 10;
    doc.font("Helvetica").fillColor("#444444");
    const noteLines = doc.wrapText(String(data.notes), W);
    for (const line of noteLines) {
      doc.text(line, 15, y, { width: W });
      y += 10;
    }
    y += 4;
  }
  doc.moveTo(15, y).lineTo(211, y).strokeColor("#cccccc").stroke();
  y += 9;
  doc.fillColor("#999999").fontSize(7).font("Helvetica");
  doc.text("Thank you for your business!", 0, y, { align: "center", width: 226 });
  y += 11;
  doc.fontSize(6).fillColor("#bbbbbb");
  doc.text("Items not collected after 30 days attract storage fees.", 0, y, { align: "center", width: 226 });
  y += 9;
  doc.text("After 60 days items may be disposed of.", 0, y, { align: "center", width: 226 });
  await new Promise((resolve) => {
    doc.on("end", resolve);
    doc.end();
  });
  return Buffer.concat(chunks);
}
async function tryPrintZPL(zpl) {
  try {
    const usb = await import("usb");
    let device = usb.findByIds(2655, 9) || null;
    if (!device) {
      const all = usb.getDeviceList();
      device = all.find((d) => d.deviceDescriptor.idVendor === 2655 && d.deviceDescriptor.idProduct === 9) || null;
    }
    if (!device) return;
    device.open();
    try {
      const iface = device.interfaces[0];
      if (iface.isKernelDriverActive()) iface.detachKernelDriver();
      iface.claim();
      const ep = iface.endpoints.find((e) => e.direction === "out");
      if (!ep) return;
      const buf = Buffer.from(zpl + "\n", "utf8");
      for (let i = 0; i < buf.length; i += 64) ep.transfer(buf.subarray(i, i + 64));
    } finally {
      device.close();
    }
  } catch (_) {
  }
}
router3.get("/config", (req, res) => {
  res.json(printerConfig);
});
router3.put("/config", (req, res) => {
  try {
    printerConfig = { ...printerConfig, ...req.body };
    res.json(printerConfig);
  } catch (error) {
    res.status(500).json({ error: "Failed to update printer configuration" });
  }
});
router3.get("/print/order/:id", async (req, res) => {
  const { id } = req.params;
  const order = await database_default.get(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM operations o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = $1 OR o.ticket_number = $1
  `, [id]);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const shoeRows = await database_default.all(`
    SELECT os.id, os.category, os.shoe_size, os.color, os.notes, os_s.price, s.name as service_name
    FROM operation_shoes os
    LEFT JOIN operation_services os_s ON os.id = os_s.operation_shoe_id
    LEFT JOIN services s ON os_s.service_id = s.id
    WHERE os.operation_id = $1
    ORDER BY os.created_at
  `, [order.id]);
  const shoeMap = {};
  for (const row of shoeRows) {
    if (!shoeMap[row.id]) shoeMap[row.id] = { category: row.category, services: [] };
    if (row.service_name) shoeMap[row.id].services.push({ name: row.service_name, price: Number(row.price) || 0 });
  }
  const lineItems = [];
  let subtotal = 0;
  for (const [, shoe] of Object.entries(shoeMap)) {
    const svcs = shoe.services;
    if (svcs.length > 0) {
      for (const svc of svcs) {
        const cat = shoe.category || "";
        const size = shoe.shoe_size ? "Size " + shoe.shoe_size : "";
        const col = shoe.color || "";
        const detail = [cat, cat, size, col, svc.name].filter(Boolean).join("\n");
        lineItems.push({ description: detail, price: svc.price });
        subtotal += svc.price;
      }
    } else {
      const cat = shoe.category || "";
      lineItems.push({ description: [cat, cat, "(no service)"].join("\n"), price: 0 });
    }
  }
  const orderTotal = Number(order.total_amount) || subtotal;
  const safe = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/\^/g, "\\^").replace(/_/g, "\\_");
  const W = 812, LM = 20, RX = 620, LH = 20;
  let y = 10;
  const fo = (x, yn) => "^FO" + x + "," + yn;
  const fd = (t) => "^FD" + safe(t) + "^FS";
  const fb = (w, l, m, t, j) => "^FB" + w + "," + l + "," + m + "," + t + "," + j;
  const font = (h, w) => "^A0N," + h + "," + w;
  const vl = (yy, th) => fo(LM, yy) + "^GB" + (W - 2 * LM) + "," + th + "," + th + "^FS";
  const fmt = (n) => "UGX " + (n || 0).toLocaleString("en-US");
  const rl = (label, amt, yy) => fo(LM, yy) + font(20, 20) + " " + fd(label) + ":" + fo(RX, yy) + font(20, 20) + " " + fd(fmt(amt));
  const zl = [];
  zl.push("^XA", "^CI28");
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(60, 60) + " " + fd("KAMPANIS"));
  y += 65;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(28, 28) + " " + fd("Shoes & Bags Clinic"));
  y += 35;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(20, 20) + " " + fd("FORESET MALL, KOLOLO, KAMPALA, UGANDA"));
  y += 30;
  zl.push(vl(y, 3));
  y += 12;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(30, 30) + " " + fd("ORDER TICKET"));
  y += 10;
  zl.push(vl(y, 2));
  y += 15;
  const col1X = LM, col2X = LM + 150;
  const ip = [
    ["Order No", order.ticket_number || order.id],
    ["Date", new Date(order.created_at).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })],
    ["Customer", order.customer_name || "N/A"]
  ];
  if (order.customer_phone) ip.push(["Phone", order.customer_phone]);
  for (const [l, v] of ip) {
    zl.push(fo(col1X, y) + font(22, 22) + "^B1 " + fd(l + " :"));
    zl.push(fo(col2X, y) + font(22, 22) + "^B0 " + fd(v));
    y += LH + 4;
  }
  if (order.promised_date) {
    zl.push(fo(col1X, y) + font(22, 22) + "^B1 " + fd("Ready On :"));
    zl.push(fo(col2X, y) + font(22, 22) + "^B1 " + fd(new Date(order.promised_date).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })));
    y += LH + 4;
  }
  y += 5;
  zl.push(vl(y, 2));
  y += 12;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(22, 22) + " ^B1 " + fd("ITEMS TO WORK ON"));
  y += 8;
  zl.push(vl(y, 2));
  y += 12;
  zl.push(fo(LM, y) + font(18, 18) + " " + fd("Service / Item"));
  zl.push(fo(RX, y) + font(18, 18) + " " + fd("Amount"));
  y += 8;
  zl.push(vl(y, 1));
  y += 10;
  if (lineItems.length > 0) {
    for (const item of lineItems) {
      zl.push(fo(LM, y) + font(20, 20) + " " + fd(item.description.substring(0, 35)));
      zl.push(fo(RX, y) + font(20, 20) + " " + fd(fmt(item.price)));
      y += LH + 3;
    }
  } else {
    zl.push(fo(LM, y) + font(20, 20) + " " + fd("No charge"));
    zl.push(fo(RX, y) + font(20, 20) + " " + fd(fmt(0)));
    y += LH + 3;
  }
  y += 5;
  zl.push(vl(y, 1));
  y += 10;
  zl.push(rl("Subtotal", subtotal, y));
  y += LH + 2;
  if (order.discount > 0) {
    zl.push(rl("Discount", Number(order.discount), y));
    y += LH + 2;
  }
  zl.push(vl(y, 2));
  y += 8;
  zl.push(fo(col1X, y) + font(24, 24) + "^B1 " + fd("TOTAL:") + fo(RX, y) + font(24, 24) + "^B1 " + fd(fmt(orderTotal)));
  y += LH + 6;
  if (order.notes) {
    y += 4;
    zl.push(vl(y, 2));
    y += 8;
    zl.push(fo(col1X, y) + font(20, 20) + "^B1 " + fd("Notes:"));
    y += LH + 2;
    const words = String(order.notes).split(" ");
    let nl = "";
    for (const w of words) {
      if ((nl + " " + w).trim().length > 40) {
        zl.push(fo(LM, y) + font(18, 18) + " " + fd(nl.trim()));
        y += LH;
        nl = w;
      } else nl += " " + w;
    }
    if (nl.trim()) {
      zl.push(fo(LM, y) + font(18, 18) + " " + fd(nl.trim()));
      y += LH;
    }
    y += 5;
  }
  zl.push(vl(y, 3));
  y += 12;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(18, 18) + " " + fd("Thank you for your business!"));
  y += 25;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(16, 16) + " " + fd("Items not collected after 30 days attract storage fees."));
  y += 20;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(16, 16) + " " + fd("After 60 days items may be disposed of."));
  y += 20;
  zl.push("^XZ");
  tryPrintZPL(zl.join("\n")).catch(() => {
  });
  try {
    const pdfBuf = await generateReceiptPDF({
      title: "ORDER TICKET",
      ticketId: order.id,
      ticketNumber: order.ticket_number || order.id,
      customerName: order.customer_name || void 0,
      customerPhone: order.customer_phone || void 0,
      date: new Date(order.created_at).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }),
      promisedDate: order.promised_date ? new Date(order.promised_date).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }) : void 0,
      items: lineItems,
      subtotal,
      total: orderTotal,
      notes: order.notes || void 0
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="order-' + (order.ticket_number || order.id) + '.pdf"');
    res.setHeader("Content-Length", pdfBuf.length);
    res.end(pdfBuf);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF receipt" });
  }
});
function estimateH(text, cpl = 50) {
  return 11 + (Math.max(1, Math.ceil(text.length / cpl)) - 1) * 10;
}
async function generatePolicyPDF(data) {
  const PDFDocument = (await import("pdfkit")).default;
  const W = 196, boxX = 15;
  let totalH = 0;
  const add = (h) => {
    totalH += h;
  };
  add(14 + 10 + 10 + 14);
  add(12 + 10);
  add(4 * 11 + 10);
  const cleaningBullets = [
    "May cause all material types to become tender, stiff, brittle and may cause some buckling and peeling.",
    "Shrinkage of all material types is unpredictable and may happen.",
    "Slight changes in shades or top finish may occur on all material types.",
    "Insect bites and scars on leather skins, which were covered over by the manufacture, could show afterward.",
    "Breaks and skin lines may show to be more apparent.",
    "Unevenly matched skins are common and may show more uneven.",
    "May cause bleeding on all material types, which in turn, causes change of color.",
    "May cause hardware pieces to bleed onto all material types and may stain material."
  ];
  add(13);
  for (const b of cleaningBullets) add(estimateH(b));
  add(4 + 14);
  const dyeingBullets = [
    "We cannot guarantee that the color will match the given swatch 100%.",
    "Certain imperfections in the construction of the item may become visible after the item is dyed.",
    "The dyed color will look different when viewed in different types of lighting.",
    "If shoes are worn in the rain or come in contact with water the color may come off and/or bleed onto a material."
  ];
  add(13);
  for (const b of dyeingBullets) add(estimateH(b));
  add(4);
  add(13);
  add(estimateH("We cannot guarantee that all shoe repair/handbag repair/alterations requests will meet the product's original condition but we will do our best."));
  add(4);
  const stretchBullets = [
    "May cause some wrinkling, buckling and peeling.",
    "Slight changes in shades or top finish may occur on all material types.",
    "Stretching the width may or may not give you more room in the length.",
    "Stretching may cause some finished imperfections on the innersole and/or lining."
  ];
  add(13);
  for (const b of stretchBullets) add(estimateH(b));
  add(4);
  const storageBullets = [
    "After one month from the date received items are sent to storage, fee of $5 per month.",
    "After six months from the date received items are disposed of at our own discretion."
  ];
  add(13);
  for (const b of storageBullets) add(estimateH(b));
  add(4);
  add(10 + 14 + 30);
  const PAGE_H = Math.ceil(totalH) + 24;
  const doc = new PDFDocument({ margin: 0, size: [226, PAGE_H], layout: "portrait" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  let y = 12;
  const dashedLine = (yy) => {
    doc.moveTo(boxX, yy).lineTo(boxX + W, yy).strokeColor("#bbbbbb").lineWidth(0.5).stroke();
  };
  doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold");
  doc.text("Kampa\u0161kis Shoes & Bags Clinic", 0, y, { align: "center", width: 226 });
  y += 14;
  doc.fontSize(7.5).font("Helvetica").fillColor("#555555");
  doc.text("Forest Mall, Kampala", 0, y, { align: "center", width: 226 });
  y += 10;
  doc.text("+256 789 183784", 0, y, { align: "center", width: 226 });
  y += 14;
  doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
  doc.text("Store Policies", 0, y, { align: "center", width: 226 });
  y += 12;
  dashedLine(y);
  y += 10;
  const infoRow = (label, value) => {
    doc.fontSize(8).font("Helvetica").fillColor("#555555");
    doc.text(label, boxX, y, { width: 72 });
    doc.fillColor("#000000").font("Helvetica-Bold");
    doc.text(value, boxX + 72, y, { width: 124 });
    y += 11;
  };
  infoRow("Ticket No :", data.ticketNumber || "01-000000");
  infoRow("Date      :", data.date || "");
  infoRow("Cust No   :", data.customerNumber || "0");
  infoRow("Name      :", (data.customerName || "WALK-IN").toUpperCase());
  dashedLine(y);
  y += 10;
  const policySection = (title, items) => {
    doc.fillColor("#000000").fontSize(8.5).font("Helvetica-Bold");
    doc.text(title, boxX, y, { width: W });
    y += 13;
    doc.fontSize(7.5).font("Helvetica").fillColor("#333333");
    for (const item of items) {
      doc.text("\u2022  " + item, boxX + 4, y, { width: W - 8 });
      y += estimateH(item);
    }
    y += 4;
  };
  policySection("Cleaning:", cleaningBullets);
  doc.fontSize(7.5).font("Helvetica-Oblique").fillColor("#555555");
  doc.text("We cannot guarantee that all cleaning requests will meet the product's original condition but we will do our best.", boxX, y, { align: "center", width: W });
  y += 14;
  policySection("Dyeing:", dyeingBullets);
  policySection("Repairs/Alterations:", [
    "We cannot guarantee that all shoe repair/handbag repair/alterations requests will meet the product's original condition but we will do our best."
  ]);
  policySection("Shoe Stretching:", stretchBullets);
  policySection("Storage:", storageBullets);
  dashedLine(y);
  y += 10;
  doc.fontSize(7.5).font("Helvetica-Oblique").fillColor("#555555");
  doc.text("I have read the policies and understand that you will carefully service my item(s) to the best of your ability.", boxX, y, { align: "center", width: W });
  y += 14;
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#000000");
  doc.text("Signature: _______________________", boxX, y, { width: W });
  await new Promise((resolve) => {
    doc.on("end", resolve);
    doc.end();
  });
  return Buffer.concat(chunks);
}
router3.get("/print/policy", async (req, res) => {
  try {
    const { ticketNumber, date, customerNumber, customerName } = req.query;
    if (!ticketNumber) {
      res.status(400).json({ error: "Missing required fields: ticketNumber" });
      return;
    }
    const pdfBuf = await generatePolicyPDF({ ticketNumber, date: date || "", customerNumber: customerNumber || "", customerName: customerName || "" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="policies-' + (ticketNumber || "receipt") + '.pdf"');
    res.setHeader("Content-Length", pdfBuf.length);
    res.end(pdfBuf);
  } catch (err) {
    console.error("Policy PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate policy slip: " + err.message });
  }
});
router3.post("/print/quotation/:id", async (req, res) => {
  const { printerModule } = await loadPrinterModules();
  if (!printerModule?.ThermalPrinter) {
    return res.status(501).json({ error: "Quotation printing requires a thermal printer driver (not installed)" });
  }
  res.status(501).json({ error: "Quotation printing not supported via PDF yet" });
});
router3.post("/print/payment-receipt", async (req, res) => {
  const { ticketId, ticketNumber, customerName, customerPhone, items, subtotal, tax, total, amountPaid, balance, paymentMethod, date } = req.body;
  const flatRows = [];
  if (items && items.length > 0) {
    for (const item of items) {
      if (item.services && item.services.length > 0) {
        for (const svc of item.services) {
          flatRows.push({ description: svc.name || item.description || "Service", price: Number(svc.price) || 0 });
        }
      } else {
        flatRows.push({ description: item.description || "Service", price: Number(item.price || item.amount) || 0 });
      }
    }
  }
  const remaining = balance !== void 0 && balance !== null ? balance : (total || 0) - (amountPaid || 0);
  const safe = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/\^/g, "\\^").replace(/_/g, "\\_");
  const W = 812, LM = 20, RX = 620, LH = 20;
  let y = 10;
  const fo = (x, yn) => "^FO" + x + "," + yn;
  const fd = (t) => "^FD" + safe(t) + "^FS";
  const fb = (w, l, m, t, j) => "^FB" + w + "," + l + "," + m + "," + t + "," + j;
  const font = (h, w) => "^A0N," + h + "," + w;
  const vl = (yy, th) => fo(LM, yy) + "^GB" + (W - 2 * LM) + "," + th + "," + th + "^FS";
  const fmt = (n) => "UGX " + (n || 0).toLocaleString("en-US");
  const rl = (label, amt, yy) => fo(LM, yy) + font(20, 20) + " " + fd(label) + ":" + fo(RX, yy) + font(20, 20) + " " + fd(fmt(amt));
  const col1X = LM, col2X = LM + 120;
  const zl = [];
  zl.push("^XA", "^CI28");
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(60, 60) + " " + fd("KAMPANIS"));
  y += 65;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(28, 28) + " " + fd("Shoes & Bags Clinic"));
  y += 35;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(20, 20) + " " + fd("FORESET MALL, KOLOLO, KAMPALA, UGANDA"));
  y += 30;
  zl.push(vl(y, 3));
  y += 12;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(30, 30) + " " + fd("PAYMENT RECEIPT"));
  y += 10;
  zl.push(vl(y, 2));
  y += 15;
  const ip = [
    ["Ticket No", ticketNumber || "TKT-" + (ticketId || "").slice(-6).toUpperCase()],
    ["Date", date || (/* @__PURE__ */ new Date()).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" })],
    ["Customer", customerName || "N/A"]
  ];
  if (customerPhone) ip.push(["Phone", customerPhone]);
  for (const [l, v] of ip) {
    zl.push(fo(col1X, y) + font(22, 22) + "^B1 " + fd(l + " :"));
    zl.push(fo(col2X, y) + font(22, 22) + "^B0 " + fd(v));
    y += LH + 4;
  }
  y += 5;
  zl.push(vl(y, 2));
  y += 12;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(22, 22) + " ^B1 " + fd("SERVICE DETAILS"));
  y += 8;
  zl.push(vl(y, 2));
  y += 12;
  zl.push(fo(LM, y) + font(18, 18) + " " + fd("Service"));
  zl.push(fo(RX, y) + font(18, 18) + " " + fd("Amount"));
  y += 8;
  zl.push(vl(y, 1));
  y += 10;
  if (flatRows.length > 0) {
    for (const row of flatRows) {
      zl.push(fo(LM, y) + font(20, 20) + " " + fd(row.description.substring(0, 35)));
      zl.push(fo(RX, y) + font(20, 20) + " " + fd(fmt(row.price)));
      y += LH + 3;
    }
  } else {
    zl.push(fo(LM, y) + font(20, 20) + " " + fd("Payment"));
    zl.push(fo(RX, y) + font(20, 20) + " " + fd(fmt(total || 0)));
    y += LH + 3;
  }
  y += 5;
  zl.push(vl(y, 1));
  y += 10;
  zl.push(rl("Subtotal", subtotal || total || 0, y));
  y += LH + 2;
  if (tax) {
    zl.push(rl("Tax", tax, y));
    y += LH + 2;
  }
  zl.push(vl(y, 2));
  y += 8;
  zl.push(fo(col1X, y) + font(24, 24) + "^B1 " + fd("TOTAL") + ":" + fo(RX, y) + font(24, 24) + "^B1 " + fd(fmt(total || 0)));
  y += LH + 6;
  zl.push(fo(col1X, y) + font(20, 20) + "^B0 " + fd("Paid (" + (paymentMethod || "Cash") + "):") + fo(RX, y) + font(20, 20) + " " + fd(fmt(amountPaid || 0)));
  y += LH + 2;
  if (remaining > 0) {
    zl.push(fo(col1X, y) + font(20, 20) + " " + fd("Balance:") + fo(RX, y) + font(20, 20) + " " + fd(fmt(remaining)));
  } else {
    zl.push(fo(col1X, y) + font(20, 20) + " " + fd("Change:") + fo(RX, y) + font(20, 20) + " " + fd(fmt(Math.abs(remaining))));
  }
  y += 15;
  zl.push(vl(y, 3));
  y += 12;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(18, 18) + " " + fd("Thank you for your business!"));
  y += 25;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(16, 16) + " " + fd("Items not collected after 30 days attract storage fees."));
  y += 20;
  zl.push(fo(0, y) + fb(W, 1, 0, 0, "C") + " " + font(16, 16) + " " + fd("After 60 days items may be disposed of."));
  y += 20;
  zl.push("^XZ");
  tryPrintZPL(zl.join("\n")).catch(() => {
  });
  try {
    const pdfBuf = await generateReceiptPDF({
      title: "PAYMENT RECEIPT",
      ticketId,
      ticketNumber,
      customerName,
      customerPhone,
      date,
      items: flatRows,
      subtotal: subtotal || total || 0,
      tax: tax || void 0,
      total: total || 0,
      amountPaid: amountPaid || 0,
      balance: remaining,
      paymentMethod: paymentMethod || "Cash"
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="receipt-' + (ticketNumber || ticketId || "payment") + '.pdf"');
    res.setHeader("Content-Length", pdfBuf.length);
    res.end(pdfBuf);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF receipt" });
  }
});
var printer_default = router3;

// server/routes/sales.ts
init_database();
import express5 from "express";
import { v4 as uuidv45 } from "uuid";

// server/routes/auth.ts
init_database();
import express4 from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv44 } from "uuid";
var router4 = express4.Router();
var JWT_SECRET = process.env.JWT_SECRET || "shoe-repair-pos-secret-key-change-in-production";
var generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};
var verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
  req.user = decoded;
  next();
};
var requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};
router4.post("/register", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role = "staff", permissions = [] } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    const existingUser = await database_default.get("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    if (!["admin", "manager", "staff"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv44();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.run(
      `INSERT INTO users (id, name, email, password_hash, role, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [userId, name, email, passwordHash, role, req.user.id, now, now]
    );
    if (role === "staff") {
      await database_default.run(
        `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv44(), userId, 1e6, 26e6, now, now, now]
      );
    }
    if (permissions.length > 0) {
      for (const permission of permissions) {
        await database_default.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv44(), userId, permission, 1, now]
        );
      }
    } else if (role === "staff") {
      const defaultStaffPermissions = [
        "view_customers",
        "create_drop",
        "create_pickup",
        "send_messages",
        "view_operations",
        "view_sales",
        "view_marketing",
        "view_qrcodes",
        "view_business_targets"
      ];
      for (const permission of defaultStaffPermissions) {
        await database_default.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv44(), userId, permission, 1, now]
        );
      }
    }
    const newUser = await database_default.get(
      "SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});
router4.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await database_default.get(
      "SELECT * FROM users WHERE email = ? AND status = ?",
      [email, "active"]
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const permissions = await database_default.all(
      "SELECT permission FROM user_permissions WHERE user_id = ? AND granted = 1",
      [user.id]
    );
    const token = generateToken(user);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: permissions.map((p) => p.permission)
      },
      token
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});
router4.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await database_default.get(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const permissions = await database_default.all(
      "SELECT permission FROM user_permissions WHERE user_id = ? AND granted = 1",
      [user.id]
    );
    res.json({
      ...user,
      permissions: permissions.map((p) => p.permission)
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
router4.get("/users", authenticateToken, requireRole("admin", "manager"), async (req, res) => {
  try {
    const users = await database_default.all(`
      SELECT
        u.id, u.name, u.email, u.role, u.status, u.created_at,
        COUNT(DISTINCT op.id) as total_operations,
        COUNT(DISTINCT s.id) as total_sales
      FROM users u
      LEFT JOIN operations op ON op.created_by = u.id
      LEFT JOIN sales s ON s.created_by = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const permissions = await database_default.all(
          "SELECT permission FROM user_permissions WHERE user_id = ? AND granted = 1",
          [user.id]
        );
        return {
          ...user,
          permissions: permissions.map((p) => p.permission)
        };
      })
    );
    res.json(usersWithPermissions);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
router4.put("/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    if (role && !["admin", "manager", "staff"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updates = [];
    const values = [];
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (role) {
      updates.push("role = ?");
      values.push(role);
    }
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }
    updates.push("updated_at = ?");
    values.push((/* @__PURE__ */ new Date()).toISOString());
    values.push(id);
    await database_default.run(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    const updatedUser = await database_default.get(
      "SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});
router4.delete("/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    await database_default.run("DELETE FROM users WHERE id = ?", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});
router4.put("/users/:id/permissions", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: "Permissions must be an array" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.run("DELETE FROM user_permissions WHERE user_id = ?", [id]);
    for (const permission of permissions) {
      await database_default.run(
        `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv44(), id, permission, 1, now]
      );
    }
    res.json({ success: true, message: "Permissions updated" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ error: "Failed to update permissions" });
  }
});
router4.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new passwords are required" });
    }
    const user = await database_default.get(
      "SELECT * FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await database_default.run(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
      [newPasswordHash, (/* @__PURE__ */ new Date()).toISOString(), req.user.id]
    );
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});
var auth_default = router4;

// server/routes/sales.ts
var router5 = express5.Router();
router5.get("/", async (req, res) => {
  try {
    const { startDate, endDate, saleType } = req.query;
    let query = `
      SELECT 
        s.*,
        c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (startDate) {
      query += " AND s.created_at >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND s.created_at <= ?";
      params.push(endDate);
    }
    if (saleType) {
      query += " AND s.sale_type = ?";
      params.push(saleType);
    }
    query += " ORDER BY s.created_at DESC";
    const sales = await database_default.prepare(query).all(...params);
    const salesWithDetails = [];
    for (const sale of sales) {
      let details = [];
      if (sale.sale_type === "repair") {
        details = await database_default.prepare(`
          SELECT 
            os.category,
            srv.name as service_name,
            osrv.price
          FROM operations o
          JOIN operation_shoes os ON o.id = os.operation_id
          JOIN operation_services osrv ON os.id = osrv.operation_shoe_id
          JOIN services srv ON srv.id = osrv.service_id
          WHERE o.id = ?
        `).all(sale.reference_id);
      } else if (sale.sale_type === "retail") {
        details = await database_default.prepare(`
          SELECT 
            si.name,
            si.price,
            oi.quantity
          FROM order_items oi
          JOIN sales_items si ON si.id = oi.item_id
          WHERE oi.order_id = ?
        `).all(sale.reference_id);
      }
      salesWithDetails.push({
        ...sale,
        details
      });
    }
    res.json(salesWithDetails);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});
router5.post("/", authenticateToken, async (req, res) => {
  try {
    const { customerId, saleType, referenceId, totalAmount, paymentMethod } = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const userId = req.user?.id || null;
    const result = await database_default.prepare(`
      INSERT INTO sales (
        id, customer_id, sale_type, reference_id,
        total_amount, payment_method, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv45(),
      customerId,
      saleType,
      referenceId,
      totalAmount,
      paymentMethod,
      userId,
      now,
      now
    );
    if (true) {
      res.status(201).json({ success: true });
    } else {
      res.status(400).json({ error: "Failed to record sale" });
    }
  } catch (error) {
    console.error("Error recording sale:", error);
    res.status(500).json({ error: "Failed to record sale" });
  }
});
router5.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = [
    { email: "user1@example.com", password: "1234" },
    { email: "user2@example.com", password: "1234" }
  ];
  const user = users.find((u) => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});
var sales_default = router5;

// server/routes/qrcodes.ts
init_database();
import express6 from "express";
import { v4 as uuidv46 } from "uuid";
var router6 = express6.Router();
(async () => {
  try {
    await database_default.prepare(`
      CREATE TABLE IF NOT EXISTS qrcodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (error) {
    console.error("Error creating qrcodes table:", error);
  }
})();
router6.get("/", async (req, res) => {
  try {
    const qrCodes = await database_default.prepare(`
      SELECT * FROM qrcodes 
      ORDER BY created_at DESC
    `).all();
    res.json(qrCodes);
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).json({ error: "Failed to fetch QR codes" });
  }
});
router6.post("/", async (req, res) => {
  try {
    const { type, label, data } = req.body;
    const id = uuidv46();
    await database_default.prepare(`
      INSERT INTO qrcodes (id, type, label, data)
      VALUES (?, ?, ?, ?)
    `).run(id, type, label, data);
    const newQRCode = await database_default.prepare("SELECT * FROM qrcodes WHERE id = ?").get(id);
    res.status(201).json(newQRCode);
  } catch (error) {
    console.error("Error creating QR code:", error);
    res.status(500).json({ error: "Failed to create QR code" });
  }
});
router6.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await database_default.prepare("DELETE FROM qrcodes WHERE id = ?").run(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting QR code:", error);
    res.status(500).json({ error: "Failed to delete QR code" });
  }
});
var qrcodes_default = router6;

// server/routes/supplies.ts
init_database();
import express7 from "express";
import { v4 as uuidv47 } from "uuid";
var router7 = express7.Router();
router7.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = "SELECT * FROM supplies";
    let params = [];
    if (category && category !== "all") {
      query += " WHERE category = ?";
      params.push(category);
    }
    query += " ORDER BY name ASC";
    const items = await database_default.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    console.error("Error fetching supplies:", error);
    res.status(500).json({ error: "Failed to fetch supplies" });
  }
});
router7.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await database_default.prepare("SELECT * FROM supplies WHERE id = ?").get(id);
    if (!item) {
      return res.status(404).json({ error: "Supply item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching supply item:", error);
    res.status(500).json({ error: "Failed to fetch supply item" });
  }
});
router7.post("/", async (req, res) => {
  try {
    const { name, category, price, quantity, image_url } = req.body;
    if (!name || !category || price === void 0 || quantity === void 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = uuidv47();
    await database_default.prepare(`
      INSERT INTO supplies (
        id, name, category, price, quantity,
        image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, category, price, quantity, image_url || null, now, now);
    const newItem = await database_default.prepare("SELECT * FROM supplies WHERE id = ?").get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating supply item:", error);
    res.status(500).json({ error: "Failed to create supply item" });
  }
});
router7.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, quantity, image_url } = req.body;
    if (!name || !category || price === void 0 || quantity === void 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      UPDATE supplies SET
        name = ?,
        category = ?,
        price = ?,
        quantity = ?,
        image_url = ?,
        updated_at = ?
      WHERE id = ?
    `).run(name, category, price, quantity, image_url || null, now, id);
    const updatedItem = await database_default.prepare("SELECT * FROM supplies WHERE id = ?").get(id);
    if (!updatedItem) {
      return res.status(404).json({ error: "Supply item not found" });
    }
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating supply item:", error);
    res.status(500).json({ error: "Failed to update supply item" });
  }
});
router7.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database_default.prepare("DELETE FROM supplies WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Supply item not found" });
    }
    res.json({ message: "Supply item deleted successfully" });
  } catch (error) {
    console.error("Error deleting supply item:", error);
    res.status(500).json({ error: "Failed to delete supply item" });
  }
});
var supplies_default = router7;

// server/routes/categories.ts
init_database();
import express8 from "express";
import { v4 as uuidv48 } from "uuid";
var router8 = express8.Router();
router8.get("/", async (req, res) => {
  try {
    const categories = await database_default.prepare("SELECT * FROM categories ORDER BY name ASC").all();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
router8.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await database_default.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});
router8.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = uuidv48();
    await database_default.prepare(`
      INSERT INTO categories (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(id, name, now, now);
    const newCategory = await database_default.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});
router8.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await database_default.prepare(`
      UPDATE categories SET
        name = ?,
        updated_at = ?
      WHERE id = ?
    `).run(name, now, id);
    if (result.changes > 0) {
      const updatedCategory = await database_default.prepare("SELECT * FROM categories WHERE id = ?").get(id);
      res.json(updatedCategory);
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});
router8.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const itemsUsingCategory = await database_default.prepare("SELECT COUNT(*) as count FROM supplies WHERE category = ?").get(id);
    if (itemsUsingCategory.count > 0) {
      return res.status(400).json({ error: "Cannot delete category that is in use" });
    }
    const result = await database_default.prepare("DELETE FROM categories WHERE id = ?").run(id);
    if (result.changes > 0) {
      res.json({ message: "Category deleted successfully" });
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});
var categories_default = router8;

// server/routes/products.ts
init_database();
import { v4 as uuidv49 } from "uuid";
import express9 from "express";
var router9 = express9.Router();
router9.get("/", async (req, res) => {
  try {
    const products = await database_default.prepare(`
      SELECT products.*, categories.name as category_name 
      FROM products 
      LEFT JOIN categories ON products.category_id = categories.id
      ORDER BY products.name ASC
    `).all();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
router9.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await database_default.prepare(`
      SELECT * FROM products 
      WHERE category_id = ? 
      ORDER BY name ASC
    `).all(categoryId);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
router9.post("/", async (req, res) => {
  try {
    const { name, price, description, imageUrl, categoryId, inStock, featured } = req.body;
    if (!name || !categoryId || price === void 0) {
      return res.status(400).json({ error: "Name, categoryId and price are required" });
    }
    const id = uuidv49();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      INSERT INTO products (
        id, name, price, description, image_url, category_id, 
        in_stock, featured, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      price,
      description || null,
      imageUrl || null,
      categoryId,
      inStock ? 1 : 0,
      featured ? 1 : 0,
      now,
      now
    );
    const newProduct = await database_default.prepare("SELECT * FROM products WHERE id = ?").get(id);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});
router9.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const setClause = Object.keys(updates).map((key) => {
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      return `${dbKey} = ?`;
    }).concat(["updated_at = ?"]).join(", ");
    const values = [...Object.values(updates), now, id];
    const result = await database_default.prepare(`
      UPDATE products 
      SET ${setClause}
      WHERE id = ?
    `).run(...values);
    if (result.changes > 0) {
      const updatedProduct = await database_default.prepare("SELECT * FROM products WHERE id = ?").get(id);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});
router9.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database_default.prepare("DELETE FROM products WHERE id = ?").run(id);
    if (result.changes > 0) {
      res.json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});
var products_default = router9;

// server/routes/credits.ts
init_database();
import express10 from "express";
var router10 = express10.Router();
router10.post("/:customerId/credits", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { amount, description, createdBy } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }
    const customer = await database_default.get("SELECT account_balance FROM customers WHERE id = ?", [customerId]);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const currentBalance = customer.account_balance || 0;
    const newBalance = currentBalance + amount;
    const transactionId = `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.run("BEGIN TRANSACTION");
    await database_default.run(`
      INSERT INTO customer_credits (id, customer_id, amount, balance_after, type, description, created_by, created_at)
      VALUES (?, ?, ?, ?, 'credit', ?, ?, ?)
    `, [transactionId, customerId, amount, newBalance, description, createdBy, now]);
    await database_default.run("UPDATE customers SET account_balance = ?, updated_at = ? WHERE id = ?", [newBalance, now, customerId]);
    await database_default.run("COMMIT");
    const updatedCustomer = await database_default.get("SELECT * FROM customers WHERE id = ?", [customerId]);
    res.json(updatedCustomer);
  } catch (error) {
    await database_default.run("ROLLBACK");
    console.error("Error adding credit:", error);
    res.status(500).json({ error: "Failed to add credit" });
  }
});
router10.post("/:customerId/apply-credit-to-debts", async (req, res) => {
  try {
    const { customerId } = req.params;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const customer = await database_default.get("SELECT account_balance FROM customers WHERE id = ?", [customerId]);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const availableCredit = customer.account_balance || 0;
    if (availableCredit <= 0) {
      return res.json({ success: true, message: "No credit to apply", paymentsMade: [], remainingCredit: 0 });
    }
    const unpaidOperations = await database_default.prepare(`
      SELECT * FROM operations
      WHERE customer_id = ? AND total_amount > COALESCE(paid_amount, 0)
      ORDER BY created_at ASC
    `).all(customerId);
    if (unpaidOperations.length === 0) {
      return res.json({ success: true, message: "No outstanding debts", paymentsMade: [], remainingCredit: availableCredit });
    }
    await database_default.run("BEGIN TRANSACTION");
    const paymentsMade = [];
    let remainingCredit = availableCredit;
    try {
      for (const operation of unpaidOperations) {
        if (remainingCredit <= 0) break;
        const operationBalance = operation.total_amount - (operation.paid_amount || 0);
        const paymentAmount = Math.min(remainingCredit, operationBalance);
        if (paymentAmount > 0) {
          const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await database_default.run(`
            INSERT INTO operation_payments (id, operation_id, payment_method, amount, transaction_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [paymentId, operation.id, "store_credit", paymentAmount, `auto-credit-${paymentId.slice(-8)}`, now]);
          const newPaidAmount = (operation.paid_amount || 0) + paymentAmount;
          await database_default.run(`
            UPDATE operations
            SET paid_amount = ?,
                status = CASE WHEN ? >= total_amount THEN 'completed' ELSE status END,
                updated_at = ?
            WHERE id = ?
          `, [newPaidAmount, newPaidAmount, now, operation.id]);
          await database_default.run(`
            UPDATE customers
            SET account_balance = account_balance - ?
            WHERE id = ?
          `, [paymentAmount, customerId]);
          await database_default.run(`
            INSERT INTO customer_credits (id, customer_id, type, amount, description, balance_after, created_at)
            VALUES (?, ?, 'debit', ?, ?, ?, ?)
          `, [
            `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            customerId,
            paymentAmount,
            `Auto-payment for operation #${operation.id.slice(-6)}`,
            (customer.account_balance || 0) - paymentAmount,
            now
          ]);
          paymentsMade.push({
            operationId: operation.id,
            amount: paymentAmount,
            remainingBalance: operationBalance - paymentAmount
          });
          remainingCredit -= paymentAmount;
        }
      }
      await database_default.run("COMMIT");
      const updatedCustomer = await database_default.get("SELECT account_balance FROM customers WHERE id = ?", [customerId]);
      res.json({
        success: true,
        paymentsMade,
        remainingCredit,
        newBalance: updatedCustomer?.account_balance || 0,
        message: paymentsMade.length > 0 ? `Applied credit to ${paymentsMade.length} debt${paymentsMade.length > 1 ? "s" : ""}` : "No debts to pay off"
      });
    } catch (error) {
      await database_default.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error auto-applying credit to debts:", error);
    res.status(500).json({ error: "Failed to apply credit to debts" });
  }
});
router10.get("/:customerId/credits", async (req, res) => {
  try {
    const { customerId } = req.params;
    const transactions = await database_default.all(`
      SELECT * FROM customer_credits
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [customerId]);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching credit transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});
router10.post("/:customerId/credits/deduct", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { amount, description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }
    const customer = await database_default.get("SELECT account_balance FROM customers WHERE id = ?", [customerId]);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const currentBalance = customer.account_balance || 0;
    if (currentBalance < amount) {
      return res.status(400).json({ error: "Insufficient credit balance" });
    }
    const newBalance = currentBalance - amount;
    const transactionId = `debit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.run("BEGIN TRANSACTION");
    await database_default.run(`
      INSERT INTO customer_credits (id, customer_id, amount, balance_after, type, description, created_at)
      VALUES (?, ?, ?, ?, 'debit', ?, ?)
    `, [transactionId, customerId, amount, newBalance, description, now]);
    await database_default.run("UPDATE customers SET account_balance = ?, updated_at = ? WHERE id = ?", [newBalance, now, customerId]);
    await database_default.run("COMMIT");
    const updatedCustomer = await database_default.get("SELECT * FROM customers WHERE id = ?", [customerId]);
    res.json(updatedCustomer);
  } catch (error) {
    await database_default.run("ROLLBACK");
    console.error("Error deducting credit:", error);
    res.status(500).json({ error: "Failed to deduct credit" });
  }
});
var credits_default = router10;

// server/routes/business.ts
init_database();
import express11 from "express";
var router11 = express11.Router();
var TARGETS = {
  businessMonthly: 104e6,
  // 104M UGX
  staffMonthly: 26e6,
  // 26M UGX
  staffDaily: 1e6
  // 1M UGX
};
var getBusinessColor = (amount) => {
  if (amount < 3e7) return "red";
  if (amount < 8e7) return "orange";
  return "green";
};
var getStaffDailyColor = (amount) => {
  if (amount < 3e5) return "red";
  if (amount < 8e5) return "orange";
  return "green";
};
var getStaffMonthlyColor = (amount) => {
  if (amount < 1e7) return "red";
  if (amount < 2e7) return "orange";
  return "green";
};
var getCommissionTier = (monthlySales) => {
  if (monthlySales < 1e7) return { rate: 0.01, tier: 1, min: 0, max: 1e7 };
  if (monthlySales < 2e7) return { rate: 0.02, tier: 2, min: 1e7, max: 2e7 };
  return { rate: 0.03, tier: 3, min: 2e7, max: 26e6 };
};
router11.get("/targets/summary", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const operationsResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);
    const operationsTotal = operationsResult.total || 0;
    const salesResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);
    const salesTotal = salesResult.total || 0;
    const totalSales = operationsTotal + salesTotal;
    const percentage = Math.min(totalSales / TARGETS.businessMonthly * 100, 100);
    const color = getBusinessColor(totalSales);
    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString("default", { month: "long", year: "numeric" })
      },
      targets: {
        businessMonthly: TARGETS.businessMonthly
      },
      current: {
        totalSales,
        operationsTotal,
        retailTotal: salesTotal
      },
      progress: {
        percentage: Math.round(percentage * 100) / 100,
        remaining: Math.max(TARGETS.businessMonthly - totalSales, 0),
        color
      }
    });
  } catch (error) {
    console.error("Error fetching business targets summary:", error);
    res.status(500).json({ error: "Failed to fetch business targets summary" });
  }
});
router11.get("/targets/daily", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const operationsDaily = await database_default.prepare(`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(startOfMonth, endOfMonth);
    const salesDaily = await database_default.prepare(`
      SELECT
        DATE(created_at) as date,
        SUM(total_amount) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(startOfMonth, endOfMonth);
    const dailyMap = /* @__PURE__ */ new Map();
    operationsDaily.forEach((row) => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.total);
    });
    salesDaily.forEach((row) => {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.total);
    });
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, total]) => {
      const percentage = Math.min(total / TARGETS.staffDaily * 100, 100);
      const color = getStaffDailyColor(total);
      const deficit = Math.max(TARGETS.staffDaily - total, 0);
      const surplus = Math.max(total - TARGETS.staffDaily, 0);
      return {
        date,
        total,
        target: TARGETS.staffDaily,
        percentage: Math.round(percentage * 100) / 100,
        color,
        deficit: deficit > 0 ? deficit : null,
        surplus: surplus > 0 ? surplus : null
      };
    });
    const totalDays = dailyBreakdown.length;
    const totalMonthlySales = dailyBreakdown.reduce((sum, day) => sum + day.total, 0);
    const averageDailySales = totalDays > 0 ? totalMonthlySales / totalDays : 0;
    const daysAtTarget = dailyBreakdown.filter((day) => day.total >= TARGETS.staffDaily).length;
    const daysBelowTarget = totalDays - daysAtTarget;
    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString("default", { month: "long", year: "numeric" })
      },
      dailyTarget: TARGETS.staffDaily,
      dailyBreakdown,
      statistics: {
        totalDays,
        totalMonthlySales: Math.round(totalMonthlySales),
        averageDailySales: Math.round(averageDailySales),
        daysAtTarget,
        daysBelowTarget,
        percentageOfTarget: Math.round(averageDailySales / TARGETS.staffDaily * 1e4) / 100
      }
    });
  } catch (error) {
    console.error("Error fetching daily targets:", error);
    res.status(500).json({ error: "Failed to fetch daily targets" });
  }
});
router11.get("/targets/staff", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const todayOpsResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay);
    const todaySalesResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay);
    const todayTotal = todayOpsResult.total + todaySalesResult.total;
    const monthlyOpsResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);
    const monthlySalesResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);
    const monthlyTotal = monthlyOpsResult.total + monthlySalesResult.total;
    const todayPercentage = Math.min(todayTotal / TARGETS.staffDaily * 100, 100);
    const monthlyPercentage = Math.min(monthlyTotal / TARGETS.staffMonthly * 100, 100);
    const todayColor = getStaffDailyColor(todayTotal);
    const monthlyColor = getStaffMonthlyColor(monthlyTotal);
    const todayDeficit = Math.max(TARGETS.staffDaily - todayTotal, 0);
    const todaySurplus = Math.max(todayTotal - TARGETS.staffDaily, 0);
    const monthlyDeficit = Math.max(TARGETS.staffMonthly - monthlyTotal, 0);
    const monthlySurplus = Math.max(monthlyTotal - TARGETS.staffMonthly, 0);
    const commissionTier = getCommissionTier(monthlyTotal);
    const estimatedCommission = monthlyTotal * commissionTier.rate;
    const progressToNextTier = commissionTier.tier < 3 ? commissionTier.max - monthlyTotal : 0;
    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString("default", { month: "long", year: "numeric" }),
        today: now.toLocaleDateString()
      },
      targets: {
        daily: TARGETS.staffDaily,
        monthly: TARGETS.staffMonthly
      },
      dailyPerformance: {
        total: todayTotal,
        target: TARGETS.staffDaily,
        percentage: Math.round(todayPercentage * 100) / 100,
        color: todayColor,
        deficit: todayDeficit > 0 ? todayDeficit : null,
        surplus: todaySurplus > 0 ? todaySurplus : null
      },
      monthlyPerformance: {
        total: monthlyTotal,
        target: TARGETS.staffMonthly,
        percentage: Math.round(monthlyPercentage * 100) / 100,
        color: monthlyColor,
        deficit: monthlyDeficit > 0 ? monthlyDeficit : null,
        surplus: monthlySurplus > 0 ? monthlySurplus : null
      },
      commission: {
        currentTier: commissionTier.tier,
        rate: commissionTier.rate,
        rateDisplay: `${Math.round(commissionTier.rate * 100)}%`,
        estimatedCommission: Math.round(estimatedCommission),
        progressToNextTier: progressToNextTier > 0 ? progressToNextTier : null,
        nextTierThreshold: commissionTier.tier < 3 ? commissionTier.max : null
      }
    });
  } catch (error) {
    console.error("Error fetching staff targets:", error);
    res.status(500).json({ error: "Failed to fetch staff targets" });
  }
});
router11.get("/targets/staff/all", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const staffUsers = await database_default.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE role IN ('staff', 'manager') AND status = 'active'
      ORDER BY name ASC
    `).all();
    const staffPerformance = await Promise.all(
      staffUsers.map(async (staff) => {
        const targetData = await database_default.prepare(`
          SELECT daily_target, monthly_target
          FROM staff_targets
          WHERE user_id = ?
        `).get(staff.id);
        const dailyTarget = targetData?.daily_target || TARGETS.staffDaily;
        const monthlyTarget = targetData?.monthly_target || TARGETS.staffMonthly;
        const todayOpsResult = await database_default.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM operations
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfDay, endOfDay);
        const todaySalesResult = await database_default.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM sales
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfDay, endOfDay);
        const todayTotal = todayOpsResult?.total || 0 + todaySalesResult?.total || 0;
        const monthlyOpsResult = await database_default.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM operations
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfMonth, endOfMonth);
        const monthlySalesResult = await database_default.prepare(`
          SELECT COALESCE(SUM(total_amount), 0) as total
          FROM sales
          WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        `).get(staff.id, startOfMonth, endOfMonth);
        const monthlyTotal = monthlyOpsResult?.total || 0 + monthlySalesResult?.total || 0;
        const todayPercentage = Math.min(todayTotal / dailyTarget * 100, 100);
        const monthlyPercentage = Math.min(monthlyTotal / monthlyTarget * 100, 100);
        const todayColor = getStaffDailyColor(todayTotal);
        const monthlyColor = getStaffMonthlyColor(monthlyTotal);
        const commissionTier = getCommissionTier(monthlyTotal);
        const estimatedCommission = monthlyTotal * commissionTier.rate;
        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          daily_target: dailyTarget,
          monthly_target: monthlyTarget,
          today_sales: todayTotal,
          monthly_sales: monthlyTotal,
          daily_percentage: Math.round(todayPercentage * 100) / 100,
          daily_color: todayColor,
          monthly_percentage: Math.round(monthlyPercentage * 100) / 100,
          monthly_color: monthlyColor,
          commission_tier: commissionTier.tier,
          commission_rate: commissionTier.rate,
          estimated_commission: Math.round(estimatedCommission)
        };
      })
    );
    res.json(staffPerformance);
  } catch (error) {
    console.error("Error fetching all staff performance:", error);
    res.status(500).json({ error: "Failed to fetch staff performance" });
  }
});
router11.get("/targets/staff/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const staff = await database_default.prepare(`
      SELECT id, name, email, role
      FROM users
      WHERE id = ? AND status = 'active'
    `).get(userId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    const targetData = await database_default.prepare(`
      SELECT daily_target, monthly_target
      FROM staff_targets
      WHERE user_id = ?
    `).get(userId);
    const dailyTarget = targetData?.daily_target || TARGETS.staffDaily;
    const monthlyTarget = targetData?.monthly_target || TARGETS.staffMonthly;
    const todayOpsResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfDay, endOfDay);
    const todaySalesResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfDay, endOfDay);
    const todayTotal = todayOpsResult?.total || 0 + todaySalesResult?.total || 0;
    const monthlyOpsResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfMonth, endOfMonth);
    const monthlySalesResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_by = ? AND created_at >= ? AND created_at <= ?
    `).get(userId, startOfMonth, endOfMonth);
    const monthlyTotal = monthlyOpsResult?.total || 0 + monthlySalesResult?.total || 0;
    const dailyBreakdown = await database_default.prepare(`
      SELECT DATE(created_at) as date,
             COALESCE(SUM(total_amount), 0) as total
      FROM (
        SELECT created_at, total_amount
        FROM operations
        WHERE created_by = ? AND created_at >= ? AND created_at <= ?
        UNION ALL
        SELECT created_at, total_amount
        FROM sales
        WHERE created_by = ? AND created_at >= ? AND created_at <= ?
      )
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(userId, startOfMonth, endOfMonth, userId, startOfMonth, endOfMonth);
    const todayPercentage = Math.min(todayTotal / dailyTarget * 100, 100);
    const monthlyPercentage = Math.min(monthlyTotal / monthlyTarget * 100, 100);
    const todayColor = getStaffDailyColor(todayTotal);
    const monthlyColor = getStaffMonthlyColor(monthlyTotal);
    const todayDeficit = Math.max(dailyTarget - todayTotal, 0);
    const todaySurplus = Math.max(todayTotal - dailyTarget, 0);
    const monthlyDeficit = Math.max(monthlyTarget - monthlyTotal, 0);
    const monthlySurplus = Math.max(monthlyTotal - monthlyTarget, 0);
    const commissionTier = getCommissionTier(monthlyTotal);
    const estimatedCommission = monthlyTotal * commissionTier.rate;
    const progressToNextTier = commissionTier.tier < 3 ? commissionTier.max - monthlyTotal : 0;
    const dailyData = dailyBreakdown.map((day) => {
      const dayTotal = day.total;
      const dayPercentage = Math.min(dayTotal / dailyTarget * 100, 100);
      const dayColor = getStaffDailyColor(dayTotal);
      return {
        date: day.date,
        total: dayTotal,
        target: dailyTarget,
        percentage: Math.round(dayPercentage * 100) / 100,
        color: dayColor,
        deficit: Math.max(dailyTarget - dayTotal, 0),
        surplus: Math.max(dayTotal - dailyTarget, 0)
      };
    });
    res.json({
      period: {
        start: startOfMonth,
        end: endOfMonth,
        currentMonth: now.toLocaleString("default", { month: "long", year: "numeric" }),
        today: now.toLocaleDateString()
      },
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      },
      targets: {
        daily: dailyTarget,
        monthly: monthlyTarget
      },
      todayPerformance: {
        total: todayTotal,
        target: dailyTarget,
        percentage: Math.round(todayPercentage * 100) / 100,
        color: todayColor,
        deficit: todayDeficit > 0 ? todayDeficit : null,
        surplus: todaySurplus > 0 ? todaySurplus : null
      },
      monthlyPerformance: {
        total: monthlyTotal,
        target: monthlyTarget,
        percentage: Math.round(monthlyPercentage * 100) / 100,
        color: monthlyColor,
        deficit: monthlyDeficit > 0 ? monthlyDeficit : null,
        surplus: monthlySurplus > 0 ? monthlySurplus : null
      },
      commission: {
        currentTier: commissionTier.tier,
        rate: commissionTier.rate,
        rateDisplay: `${Math.round(commissionTier.rate * 100)}%`,
        estimatedCommission: Math.round(estimatedCommission),
        progressToNextTier: progressToNextTier > 0 ? progressToNextTier : null,
        nextTierThreshold: commissionTier.tier < 3 ? commissionTier.max : null
      },
      dailyBreakdown: dailyData
    });
  } catch (error) {
    console.error("Error fetching staff performance:", error);
    res.status(500).json({ error: "Failed to fetch staff performance" });
  }
});
router11.put("/targets/staff/:userId/targets", async (req, res) => {
  try {
    const { userId } = req.params;
    const { daily_target, monthly_target } = req.body;
    if (daily_target !== void 0 && (isNaN(daily_target) || daily_target < 0)) {
      return res.status(400).json({ error: "Invalid daily target" });
    }
    if (monthly_target !== void 0 && (isNaN(monthly_target) || monthly_target < 0)) {
      return res.status(400).json({ error: "Invalid monthly target" });
    }
    const staff = await database_default.prepare("SELECT id FROM users WHERE id = ?", [userId]).get(userId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existingTargets = await database_default.prepare(
      "SELECT id FROM staff_targets WHERE user_id = ?",
      [userId]
    ).get();
    if (existingTargets) {
      const updates = [];
      const values = [];
      if (daily_target !== void 0) {
        updates.push("daily_target = ?");
        values.push(daily_target);
      }
      if (monthly_target !== void 0) {
        updates.push("monthly_target = ?");
        values.push(monthly_target);
      }
      updates.push("updated_at = ?");
      values.push(now);
      values.push(userId);
      await database_default.run(
        `UPDATE staff_targets SET ${updates.join(", ")} WHERE user_id = ?`,
        values
      );
    } else {
      await database_default.run(
        `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`${userId}-targets`, userId, daily_target || TARGETS.staffDaily, monthly_target || TARGETS.staffMonthly, now, now, now]
      );
    }
    const updatedTargets = await database_default.prepare(
      "SELECT daily_target, monthly_target FROM staff_targets WHERE user_id = ?",
      [userId]
    ).get(userId);
    res.json({
      success: true,
      targets: updatedTargets
    });
  } catch (error) {
    console.error("Error updating staff targets:", error);
    res.status(500).json({ error: "Failed to update staff targets" });
  }
});
router11.get("/commissions/archives", async (req, res) => {
  try {
    const { year, month, status, userId, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT ca.*, u.name as user_name, u.email as user_email
      FROM commission_archives ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (year) {
      query += " AND ca.year = ?";
      params.push(Number(year));
    }
    if (month) {
      query += " AND ca.month = ?";
      params.push(Number(month));
    }
    if (status) {
      query += " AND ca.status = ?";
      params.push(status);
    }
    if (userId) {
      query += " AND ca.user_id = ?";
      params.push(userId);
    }
    query += " ORDER BY ca.year DESC, ca.month DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));
    const archives = await database_default.prepare(query).all(...params);
    let totalsQuery = `
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(commission_amount), 0) as total_commissions,
        COALESCE(SUM(total_sales), 0) as total_sales,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM commission_archives ca
      WHERE 1=1
    `;
    const totalsParams = [];
    if (year) {
      totalsQuery += " AND ca.year = ?";
      totalsParams.push(Number(year));
    }
    if (month) {
      totalsQuery += " AND ca.month = ?";
      totalsParams.push(Number(month));
    }
    if (status) {
      totalsQuery += " AND ca.status = ?";
      totalsParams.push(status);
    }
    if (userId) {
      totalsQuery += " AND ca.user_id = ?";
      totalsParams.push(userId);
    }
    const totals = await database_default.prepare(totalsQuery).get(...totalsParams);
    res.json({
      archives,
      totals,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error("Error fetching commission archives:", error);
    res.status(500).json({ error: "Failed to fetch commission archives" });
  }
});
router11.get("/commissions/by-staff", async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = /* @__PURE__ */ new Date();
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;
    let archives = await database_default.prepare(`
      SELECT ca.*, u.name as user_name
      FROM commission_archives ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.year = ? AND ca.month = ?
      ORDER BY ca.commission_amount DESC
    `).all(targetYear, targetMonth);
    if (archives.length === 0) {
      const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
      const endDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-31`;
      const staffSales = await database_default.prepare(`
        SELECT
          u.id as user_id,
          u.name as user_name,
          COALESCE(SUM(o.total_amount), 0) as total_sales
        FROM users u
        LEFT JOIN operations o ON u.id = o.created_by
          AND o.created_at >= ? AND o.created_at <= ?
          AND o.status = 'completed'
        WHERE u.role IN ('staff', 'manager')
        GROUP BY u.id, u.name
        HAVING total_sales > 0
        ORDER BY total_sales DESC
      `).all(startDate, endDate);
      archives = staffSales.map((staff) => {
        const tier = getCommissionTier(staff.total_sales);
        return {
          user_id: staff.user_id,
          user_name: staff.user_name,
          total_sales: staff.total_sales,
          commission_rate: tier.rate,
          commission_amount: staff.total_sales * tier.rate,
          year: targetYear,
          month: targetMonth
        };
      });
    }
    res.json({ staff: archives });
  } catch (error) {
    console.error("Error fetching commission by staff:", error);
    res.status(500).json({ error: "Failed to fetch commission by staff" });
  }
});
router11.get("/commissions/trends", async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = /* @__PURE__ */ new Date();
    const trends = [];
    for (let i = Number(months) - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const archives = await database_default.prepare(`
        SELECT
          COALESCE(SUM(commission_amount), 0) as total_commissions,
          COUNT(*) as staff_count
        FROM commission_archives
        WHERE year = ? AND month = ?
      `).get(year, month);
      const topPerformer = await database_default.prepare(`
        SELECT ca.*, u.name as user_name
        FROM commission_archives ca
        LEFT JOIN users u ON ca.user_id = u.id
        WHERE ca.year = ? AND ca.month = ?
        ORDER BY ca.commission_amount DESC
        LIMIT 1
      `).get(year, month);
      trends.push({
        month: `${year}-${String(month).padStart(2, "0")}`,
        year,
        monthNum: month,
        totalCommissions: archives.total_commissions,
        staffCount: archives.staff_count,
        topPerformer: topPerformer ? {
          userId: topPerformer.user_id,
          userName: topPerformer.user_name,
          commissionAmount: topPerformer.commission_amount
        } : null
      });
    }
    const avgMonthly = trends.reduce((sum, t) => sum + t.totalCommissions, 0) / trends.length;
    res.json({ trends, averageMonthlyCommission: avgMonthly });
  } catch (error) {
    console.error("Error fetching commission trends:", error);
    res.status(500).json({ error: "Failed to fetch commission trends" });
  }
});
router11.post("/commissions/archive", async (req, res) => {
  try {
    const { year: providedYear, month: providedMonth } = req.body;
    const now = /* @__PURE__ */ new Date();
    let targetYear = providedYear;
    let targetMonth = providedMonth;
    if (!targetYear || !targetMonth) {
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      targetYear = prevMonth.getFullYear();
      targetMonth = prevMonth.getMonth() + 1;
    }
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-31`;
    const adminUser = await database_default.prepare(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `).get();
    const createdBy = adminUser?.id || null;
    const staffCommissions = await database_default.prepare(`
      SELECT
        u.id as user_id,
        u.name as user_name,
        COALESCE(SUM(o.total_amount), 0) as total_sales
      FROM users u
      LEFT JOIN operations o ON u.id = o.created_by
        AND o.created_at >= ? AND o.created_at <= ?
        AND o.status = 'completed'
      WHERE u.role IN ('staff', 'manager')
      GROUP BY u.id, u.name
    `).all(startDate, endDate);
    const archives = [];
    for (const staff of staffCommissions) {
      if (staff.total_sales <= 0) continue;
      const tier = getCommissionTier(staff.total_sales);
      const commissionAmount = staff.total_sales * tier.rate;
      const archiveId = `ca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const existing = await database_default.prepare(`
        SELECT id FROM commission_archives WHERE user_id = ? AND year = ? AND month = ?
      `).get(staff.user_id, targetYear, targetMonth);
      if (existing) {
        await database_default.prepare(`
          UPDATE commission_archives
          SET total_sales = ?, commission_rate = ?, commission_amount = ?, archived_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND year = ? AND month = ?
        `).run(staff.total_sales, tier.rate, commissionAmount, staff.user_id, targetYear, targetMonth);
      } else {
        await database_default.prepare(`
          INSERT INTO commission_archives (id, user_id, year, month, total_sales, commission_rate, commission_amount, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).run(archiveId, staff.user_id, targetYear, targetMonth, staff.total_sales, tier.rate, commissionAmount, createdBy);
      }
      archives.push({
        userId: staff.user_id,
        userName: staff.user_name,
        totalSales: staff.total_sales,
        commissionRate: tier.rate,
        commissionAmount
      });
    }
    res.json({
      success: true,
      archivedCount: archives.length,
      year: targetYear,
      month: targetMonth,
      archives
    });
  } catch (error) {
    console.error("Error archiving commissions:", error);
    res.status(500).json({ error: "Failed to archive commissions" });
  }
});
router11.patch("/commissions/:id/mark-paid", async (req, res) => {
  try {
    const { id } = req.params;
    const archive = await database_default.prepare(`
      SELECT * FROM commission_archives WHERE id = ?
    `).get(id);
    if (!archive) {
      return res.status(404).json({ error: "Commission archive not found" });
    }
    await database_default.prepare(`
      UPDATE commission_archives
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
    const updated = await database_default.prepare(`
      SELECT ca.*, u.name as user_name
      FROM commission_archives ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.id = ?
    `).get(id);
    res.json({ success: true, archive: updated });
  } catch (error) {
    console.error("Error marking commission as paid:", error);
    res.status(500).json({ error: "Failed to mark commission as paid" });
  }
});
var business_default = router11;

// server/routes/staffMessages.ts
init_database();
import express12 from "express";
import { v4 as uuidv410 } from "uuid";
var router12 = express12.Router();
router12.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await database_default.all(`
      SELECT
        sc.*,
        u1.name as participant1_name,
        u2.name as participant2_name,
        (
          SELECT content FROM staff_messages
          WHERE conversation_id = sc.id
          ORDER BY created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM staff_messages
          WHERE conversation_id = sc.id AND sender_id != ? AND is_read = 0
        ) as unread_count
      FROM staff_conversations sc
      JOIN users u1 ON sc.participant1_id = u1.id
      JOIN users u2 ON sc.participant2_id = u2.id
      WHERE sc.participant1_id = ? OR sc.participant2_id = ?
      ORDER BY sc.last_message_at DESC
    `, [userId, userId, userId]);
    const transformed = conversations.map((c) => ({
      id: c.id,
      otherParticipant: c.participant1_id === userId ? {
        id: c.participant2_id,
        name: c.participant2_name
      } : {
        id: c.participant1_id,
        name: c.participant1_name
      },
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      unreadCount: c.unread_count
    }));
    res.json(transformed);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});
router12.get("/conversations/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const conversation = await database_default.get(`
      SELECT * FROM staff_conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [id, userId, userId]);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const messages = await database_default.all(`
      SELECT sm.*, u.name as sender_name
      FROM staff_messages sm
      JOIN users u ON sm.sender_id = u.id
      WHERE sm.conversation_id = ?
      ORDER BY sm.created_at ASC
    `, [id]);
    await database_default.run(`
      UPDATE staff_messages SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `, [id, userId]);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
router12.post("/conversations", authenticateToken, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID required" });
    }
    if (recipientId === senderId) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }
    let conversation = await database_default.get(`
      SELECT * FROM staff_conversations
      WHERE (participant1_id = ? AND participant2_id = ?)
         OR (participant1_id = ? AND participant2_id = ?)
    `, [senderId, recipientId, recipientId, senderId]);
    if (!conversation) {
      const id = uuidv410();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await database_default.run(`
        INSERT INTO staff_conversations (id, participant1_id, participant2_id, created_at, last_message_at)
        VALUES (?, ?, ?, ?, ?)
      `, [id, senderId, recipientId, now, now]);
      conversation = { id };
    }
    res.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});
router12.post("/", authenticateToken, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;
    if (!conversationId || !content) {
      return res.status(400).json({ error: "Conversation ID and content required" });
    }
    const conversation = await database_default.get(`
      SELECT * FROM staff_conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [conversationId, senderId, senderId]);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const id = uuidv410();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.run(`
      INSERT INTO staff_messages (id, conversation_id, sender_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, conversationId, senderId, content.trim(), now]);
    await database_default.run(`
      UPDATE staff_conversations SET last_message_at = ? WHERE id = ?
    `, [now, conversationId]);
    const sender = await database_default.get("SELECT name FROM users WHERE id = ?", [senderId]);
    res.json({
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: sender?.name,
      content: content.trim(),
      is_read: false,
      created_at: now
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});
router12.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await database_default.get(`
      SELECT COUNT(*) as count FROM staff_messages sm
      JOIN staff_conversations sc ON sm.conversation_id = sc.id
      WHERE (sc.participant1_id = ? OR sc.participant2_id = ?)
        AND sm.sender_id != ?
        AND sm.is_read = 0
    `, [userId, userId, userId]);
    res.json({ count: result?.count || 0 });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});
router12.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await database_default.all(`
      SELECT id, name, email, role FROM users
      WHERE status = 'active'
      ORDER BY name ASC
    `);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
var staffMessages_default = router12;

// server/routes/colors.ts
init_database();
import express13 from "express";
var router13 = express13.Router();
router13.get("/", async (req, res) => {
  try {
    const colors = await database_default.prepare(`
      SELECT id, name, hex_code, display_order
      FROM colors
      WHERE is_active = 1
      ORDER BY display_order ASC, name ASC
    `).all();
    res.json(colors.map((color) => ({
      id: color.id,
      name: color.name,
      hexCode: color.hex_code,
      displayOrder: color.display_order,
      isRainbow: color.hex_code === "#RAINBOW"
    })));
  } catch (error) {
    console.error("Failed to fetch colors:", error);
    res.status(500).json({ error: "Failed to fetch colors" });
  }
});
var colors_default = router13;

// server/routes/invoices.ts
init_database();
import express14 from "express";
import { v4 as uuidv411 } from "uuid";
import { spawn } from "child_process";
import fs from "fs";
import path2 from "path";
import os from "os";
var router14 = express14.Router();
function generateInvoiceNumber(type) {
  const prefix = type === "invoice" ? "INV" : "RCP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
var getRetailItems = async (operationId) => {
  return database_default.prepare(`
    SELECT * FROM operation_retail_items
    WHERE operation_id = ?
    ORDER BY created_at ASC
  `).all(operationId);
};
router14.get("/", async (req, res) => {
  try {
    const { type, startDate, endDate, customer } = req.query;
    let query = `
      SELECT i.*, o.id as operation_id
      FROM invoices i
      LEFT JOIN operations o ON i.operation_id = o.id
      WHERE 1=1
    `;
    const params = [];
    if (type && type !== "all") {
      query += ` AND i.type = ?`;
      params.push(type);
    }
    if (startDate) {
      query += ` AND DATE(i.created_at) >= DATE(?)`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(i.created_at) <= DATE(?)`;
      params.push(endDate);
    }
    if (customer) {
      query += ` AND i.customer_name LIKE ?`;
      params.push(`%${customer}%`);
    }
    query += ` ORDER BY i.created_at DESC`;
    const invoices = await database_default.prepare(query).all(...params);
    res.json(invoices.map((inv) => ({
      id: inv.id,
      operationId: inv.operation_id,
      type: inv.type,
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name,
      customerPhone: inv.customer_phone,
      subtotal: inv.subtotal,
      discount: inv.discount,
      total: inv.total,
      amountPaid: inv.amount_paid,
      paymentMethod: inv.payment_method,
      promisedDate: inv.promised_date,
      generatedBy: inv.generated_by,
      createdAt: inv.created_at
    })));
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});
router14.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await database_default.prepare(`
      SELECT * FROM invoices WHERE id = ?
    `).get(id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const inv = invoice;
    const operation = await database_default.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(inv.operation_id);
    const shoes = await database_default.prepare(`
      SELECT os.*, s.name as service_name, oss.price as service_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = ?
    `).all(inv.operation_id);
    const retailItems = await getRetailItems(inv.operation_id);
    const payments = inv.type === "receipt" ? await database_default.prepare(`SELECT * FROM operation_payments WHERE operation_id = ?`).all(inv.operation_id) : [];
    res.json({
      id: inv.id,
      operationId: inv.operation_id,
      type: inv.type,
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name,
      customerPhone: inv.customer_phone,
      subtotal: inv.subtotal,
      discount: inv.discount,
      total: inv.total,
      amountPaid: inv.amount_paid,
      paymentMethod: inv.payment_method,
      promisedDate: inv.promised_date,
      notes: inv.notes,
      generatedBy: inv.generated_by,
      createdAt: inv.created_at,
      operation: operation ? {
        id: operation.id,
        status: operation.status,
        notes: operation.notes,
        isNoCharge: Boolean(operation.is_no_charge),
        isDoOver: Boolean(operation.is_do_over),
        isDelivery: Boolean(operation.is_delivery),
        isPickup: Boolean(operation.is_pickup)
      } : null,
      items: [
        ...shoes.map((shoe) => ({
          id: shoe.id,
          type: "repair",
          category: shoe.category,
          color: shoe.color,
          colorDescription: shoe.color_description || "",
          notes: shoe.notes,
          serviceName: shoe.service_name,
          price: shoe.service_price
        })),
        ...retailItems.map((item) => ({
          id: item.id,
          type: "retail",
          productId: item.product_id || null,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          price: item.total_price
        }))
      ],
      payments: payments.map((p) => ({
        id: p.id,
        method: p.payment_method,
        amount: p.amount,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});
router14.post("/", async (req, res) => {
  try {
    const { operationId, type, generatedBy } = req.body;
    if (!operationId) {
      return res.status(400).json({ error: "Operation ID is required" });
    }
    const operation = await database_default.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(operationId);
    if (!operation) {
      return res.status(404).json({ error: "Operation not found" });
    }
    const op = operation;
    let documentType = type;
    if (!documentType) {
      documentType = op.paid_amount >= op.total_amount ? "receipt" : "invoice";
    }
    const existing = await database_default.prepare(`
      SELECT id FROM invoices WHERE operation_id = ? AND type = ?
    `).get(operationId, documentType);
    if (existing) {
      return res.status(400).json({ error: `This ${documentType} already exists`, invoiceId: existing.id });
    }
    const subtotal = (op.total_amount || 0) + (op.discount || 0);
    const total = op.total_amount;
    const discount = op.discount || 0;
    const amountPaid = op.paid_amount || 0;
    let paymentMethod = null;
    if (amountPaid > 0) {
      const lastPayment = await database_default.prepare(`
        SELECT payment_method FROM operation_payments WHERE operation_id = ? ORDER BY created_at DESC LIMIT 1
      `).get(operationId);
      paymentMethod = lastPayment ? lastPayment.payment_method : null;
    }
    const invoiceId = uuidv411();
    const invoiceNumber = generateInvoiceNumber(documentType);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      INSERT INTO invoices (
        id, operation_id, type, invoice_number, customer_name, customer_phone,
        subtotal, discount, total, amount_paid, payment_method, notes,
        promised_date, generated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId,
      operationId,
      documentType,
      invoiceNumber,
      op.customer_name,
      op.customer_phone,
      subtotal,
      discount,
      total,
      amountPaid,
      paymentMethod,
      op.notes,
      op.promised_date,
      generatedBy || null,
      now,
      now
    );
    const invoice = await database_default.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId);
    res.json(invoice);
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});
router14.post("/:id/print", async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await database_default.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const operation = await database_default.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.account_balance as customer_credit
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(invoice.operation_id);
    if (!operation) {
      return res.status(404).json({ error: "Operation not found" });
    }
    const shoes = await database_default.prepare(`
      SELECT os.*, s.name as service_name, oss.price as service_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = ?
    `).all(invoice.operation_id);
    const retailItems = await getRetailItems(invoice.operation_id);
    const payments = invoice.type === "receipt" ? await database_default.prepare("SELECT * FROM operation_payments WHERE operation_id = ?").all(invoice.operation_id) : [];
    const formatCurrency = (amount) => {
      return `UGX ${amount.toLocaleString()}`;
    };
    const ESC = 27;
    const GS = 29;
    const cmd = {
      init: Buffer.from([ESC, 64]),
      alignCenter: Buffer.from([ESC, 97, 1]),
      alignLeft: Buffer.from([ESC, 97, 0]),
      boldOn: Buffer.from([ESC, 69, 1]),
      boldOff: Buffer.from([ESC, 69, 0]),
      normalSize: Buffer.from([ESC, 33, 0]),
      doubleSize: Buffer.from([ESC, 33, 17]),
      cut: Buffer.from([GS, 86, 0]),
      feed: Buffer.from([ESC, 100, 3])
    };
    const text = (str) => Buffer.from(str + "\n", "ascii");
    const line = (char, width = 48) => Buffer.from(char.repeat(width) + "\n", "ascii");
    const padRight = (str, len) => str.padEnd(len).slice(0, len);
    const padLeft = (str, len) => str.padStart(len).slice(0, len);
    try {
      const chunks = [];
      chunks.push(cmd.init);
      chunks.push(cmd.alignCenter, cmd.boldOn, cmd.doubleSize);
      chunks.push(text(invoice.type === "receipt" ? "RECEIPT" : "INVOICE"));
      chunks.push(cmd.boldOff, cmd.normalSize);
      chunks.push(text("SHOE REPAIR POS"));
      chunks.push(line("="));
      chunks.push(cmd.alignLeft);
      chunks.push(cmd.boldOn);
      chunks.push(text(`Doc #: ${invoice.invoice_number}`));
      chunks.push(cmd.boldOff);
      chunks.push(text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`));
      chunks.push(text(`Customer: ${invoice.customer_name}`));
      if (invoice.customer_phone) {
        chunks.push(text(`Phone: ${invoice.customer_phone}`));
      }
      chunks.push(line("-"));
      chunks.push(cmd.boldOn);
      chunks.push(text(invoice.type === "receipt" ? "PAYMENT RECEIVED" : "SERVICES / PRODUCTS"));
      chunks.push(cmd.boldOff);
      chunks.push(text(""));
      if (shoes.length > 0) {
        for (const shoe of shoes) {
          chunks.push(text(`[${shoe.category}]`));
          if (shoe.color) chunks.push(text(`  Color: ${shoe.color}`));
          if (shoe.service_name) {
            const priceStr = formatCurrency(shoe.service_price);
            const lineStr = `${padRight(shoe.service_name, 30)}${padLeft(priceStr, 18)}`;
            chunks.push(text(lineStr));
          }
          chunks.push(text(""));
        }
      }
      if (retailItems.length > 0) {
        chunks.push(line("-"));
        for (const item of retailItems) {
          chunks.push(text(item.product_name));
          const priceStr = formatCurrency(item.total_price);
          const qtyStr = `  Qty: ${item.quantity} x ${formatCurrency(item.unit_price)}`;
          chunks.push(text(qtyStr));
          const totalLine = `${padRight("", 30)}${padLeft(priceStr, 18)}`;
          chunks.push(text(totalLine));
        }
        chunks.push(text(""));
      }
      chunks.push(line("="));
      chunks.push(text(`${padRight("Subtotal:", 30)}${padLeft(formatCurrency(invoice.subtotal), 18)}`));
      if (invoice.discount > 0) {
        chunks.push(text(`${padRight("Discount:", 30)}${padLeft("-" + formatCurrency(invoice.discount), 18)}`));
      }
      chunks.push(cmd.boldOn);
      chunks.push(text(`${padRight("TOTAL:", 30)}${padLeft(formatCurrency(invoice.total), 18)}`));
      chunks.push(cmd.boldOff);
      if (invoice.type === "receipt") {
        chunks.push(text(""));
        chunks.push(line("="));
        chunks.push(text("PAYMENT DETAILS"));
        chunks.push(text(`${padRight("Amount Paid:", 30)}${padLeft(formatCurrency(invoice.amount_paid), 18)}`));
        const balance = invoice.total - invoice.amount_paid;
        if (balance > 0) {
          chunks.push(text(`${padRight("Balance Due:", 30)}${padLeft(formatCurrency(balance), 18)}`));
        }
        if (operation.customer_credit && operation.customer_credit > 0) {
          chunks.push(text(""));
          chunks.push(cmd.boldOn);
          chunks.push(text(`${padRight("Your Credit Balance:", 30)}${padLeft(formatCurrency(operation.customer_credit), 18)}`));
          chunks.push(cmd.boldOff);
        }
      }
      if (operation.promised_date) {
        chunks.push(text(""));
        chunks.push(cmd.alignCenter);
        chunks.push(text(`Pickup Date: ${new Date(operation.promised_date).toLocaleDateString()}`));
      }
      chunks.push(cmd.alignCenter);
      chunks.push(text(""));
      chunks.push(line("="));
      chunks.push(text("Thank you for your business!"));
      chunks.push(line("="));
      chunks.push(cmd.feed);
      chunks.push(cmd.cut);
      const printData = Buffer.concat(chunks);
      const tempFile = path2.join(os.tmpdir(), `receipt_${Date.now()}.bin`);
      fs.writeFileSync(tempFile, printData);
      const escapedTempFile = tempFile.replace(/\\/g, "\\\\");
      const psCommand = `[System.IO.File]::ReadAllBytes('${escapedTempFile}') | Set-Content -Path '\\\\.\\USB001' -Encoding Byte -PassThru | Out-Null; exit 0`;
      await new Promise((resolve, reject) => {
        const ps = spawn("powershell", [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          psCommand
        ], { windowsHide: true });
        ps.on("close", (code) => {
          try {
            fs.unlinkSync(tempFile);
          } catch {
          }
          if (code === 0) {
            console.log("Print successful via USB001");
            resolve();
          } else {
            reject(new Error(`Print command exited with code ${code}`));
          }
        });
        ps.on("error", (err) => {
          try {
            fs.unlinkSync(tempFile);
          } catch {
          }
          reject(err);
        });
      });
      res.json({ success: true, message: "Printed successfully" });
      return;
    } catch (error) {
      console.error("Print error:", error);
      return res.status(500).json({ error: `Print failed: ${error.message}` });
    }
  } catch (error) {
    console.error("Failed to print invoice:", error);
    res.status(500).json({ error: `Print failed: ${error.message}` });
  }
});
var invoices_default = router14;

// server/routes/analytics.ts
init_database();
import express15 from "express";
var router15 = express15.Router();
var getDateBoundaries = () => {
  const now = /* @__PURE__ */ new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { now, startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth };
};
router15.get("/discounts", async (req, res) => {
  try {
    const { startOfMonth, endOfMonth } = getDateBoundaries();
    const summaryResult = await database_default.prepare(`
      SELECT
        COUNT(*) as totalOperations,
        COALESCE(SUM(discount), 0) as totalDiscounts,
        COALESCE(AVG(CASE WHEN discount > 0 THEN (discount / NULLIF(total_amount, 0)) * 100 ELSE 0 END), 0) as averageDiscountPercent,
        COUNT(CASE WHEN discount > 0 THEN 1 END) as operationsWithDiscount
      FROM operations
      WHERE discount > 0
    `).get();
    const totalOperationsWithDiscount = summaryResult.operationsWithDiscount || 0;
    const totalDiscounts = summaryResult.totalDiscounts || 0;
    const averageDiscountPercent = summaryResult.averageDiscountPercent || 0;
    const byPeriodResult = await database_default.prepare(`
      SELECT
        DATE(created_at) as date,
        SUM(discount) as total,
        COUNT(*) as count
      FROM operations
      WHERE discount > 0
        AND created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();
    const byPeriod = byPeriodResult.map((row) => ({
      date: row.date,
      total: row.total,
      count: row.count
    }));
    const topDiscountedResult = await database_default.prepare(`
      SELECT
        o.id,
        c.name as customerName,
        o.total_amount,
        o.discount,
        o.created_at as date
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.discount > 0
      ORDER BY o.discount DESC
      LIMIT 10
    `).all();
    const topDiscounted = topDiscountedResult.map((row) => ({
      id: row.id,
      customerName: row.customerName || "Unknown",
      totalAmount: row.total_amount,
      discount: row.discount,
      date: row.date
    }));
    res.json({
      summary: {
        totalDiscounts,
        averageDiscountPercent: Math.round(averageDiscountPercent * 100) / 100,
        operationsWithDiscount: totalOperationsWithDiscount
      },
      byPeriod,
      topDiscounted
    });
  } catch (error) {
    console.error("Error fetching discount analytics:", error);
    res.status(500).json({ error: "Failed to fetch discount analytics" });
  }
});
router15.get("/new-customers", async (req, res) => {
  try {
    const { startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth } = getDateBoundaries();
    const totalResult = await database_default.prepare(`
      SELECT COUNT(*) as total FROM customers
    `).get();
    const thisMonthResult = await database_default.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfMonth, endOfMonth);
    const thisWeekResult = await database_default.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= ?
    `).get(startOfWeek);
    const todayResult = await database_default.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfToday, endOfToday);
    const trendResult = await database_default.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM customers
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();
    const trend = trendResult.map((row) => ({
      date: row.date,
      count: row.count
    }));
    const recentCustomersResult = await database_default.prepare(`
      SELECT
        id,
        name,
        phone,
        created_at as createdAt,
        total_orders
      FROM customers
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    const recentCustomers = recentCustomersResult.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      createdAt: row.createdAt,
      totalOrders: row.total_orders
    }));
    res.json({
      summary: {
        total: totalResult.total || 0,
        thisMonth: thisMonthResult?.count || 0,
        thisWeek: thisWeekResult?.count || 0,
        today: todayResult?.count || 0
      },
      trend,
      recentCustomers
    });
  } catch (error) {
    console.error("Error fetching new customer analytics:", error);
    res.status(500).json({ error: "Failed to fetch new customer analytics" });
  }
});
router15.get("/customer-rankings", async (req, res) => {
  try {
    const bySpentResult = await database_default.prepare(`
      SELECT
        id,
        name,
        phone,
        total_spent as totalSpent,
        total_orders as orderCount,
        last_visit as lastVisit
      FROM customers
      WHERE status = 'active'
      ORDER BY total_spent DESC
      LIMIT 20
    `).all();
    const bySpent = bySpentResult.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      totalSpent: row.totalSpent || 0,
      orderCount: row.orderCount || 0,
      lastVisit: row.lastVisit
    }));
    const byOrdersResult = await database_default.prepare(`
      SELECT
        id,
        name,
        phone,
        total_spent as totalSpent,
        total_orders as orderCount,
        last_visit as lastVisit
      FROM customers
      WHERE status = 'active'
      ORDER BY total_orders DESC
      LIMIT 20
    `).all();
    const byOrders = byOrdersResult.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      totalSpent: row.totalSpent || 0,
      orderCount: row.orderCount || 0,
      lastVisit: row.lastVisit
    }));
    const byLoyaltyResult = await database_default.prepare(`
      SELECT
        id,
        name,
        phone,
        loyalty_points as loyaltyPoints,
        total_spent as totalSpent
      FROM customers
      WHERE status = 'active'
      ORDER BY loyalty_points DESC
      LIMIT 20
    `).all();
    const byLoyalty = byLoyaltyResult.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      loyaltyPoints: row.loyaltyPoints || 0,
      totalSpent: row.totalSpent || 0
    }));
    res.json({
      bySpent,
      byOrders,
      byLoyalty
    });
  } catch (error) {
    console.error("Error fetching customer rankings:", error);
    res.status(500).json({ error: "Failed to fetch customer rankings" });
  }
});
router15.get("/service-performance", async (req, res) => {
  try {
    const byRevenueResult = await database_default.prepare(`
      SELECT
        s.id as serviceId,
        s.name as serviceName,
        s.category,
        COALESCE(SUM(os.price * os.quantity), 0) as totalRevenue,
        COUNT(DISTINCT os.operation_shoe_id) as orderCount
      FROM services s
      LEFT JOIN operation_services os ON s.id = os.service_id
      GROUP BY s.id, s.name, s.category
      ORDER BY totalRevenue DESC
    `).all();
    const byRevenue = byRevenueResult.map((row) => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      category: row.category || "Uncategorized",
      totalRevenue: row.totalRevenue || 0,
      orderCount: row.orderCount || 0
    }));
    const byOrdersResult = await database_default.prepare(`
      SELECT
        s.id as serviceId,
        s.name as serviceName,
        s.category,
        COALESCE(SUM(os.price * os.quantity), 0) as totalRevenue,
        COUNT(DISTINCT os.operation_shoe_id) as orderCount
      FROM services s
      LEFT JOIN operation_services os ON s.id = os.service_id
      GROUP BY s.id, s.name, s.category
      ORDER BY orderCount DESC
    `).all();
    const byOrders = byOrdersResult.map((row) => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      category: row.category || "Uncategorized",
      totalRevenue: row.totalRevenue || 0,
      orderCount: row.orderCount || 0
    }));
    const categoryBreakdownResult = await database_default.prepare(`
      SELECT
        COALESCE(s.category, 'Uncategorized') as category,
        COALESCE(SUM(os.price * os.quantity), 0) as totalRevenue,
        COUNT(DISTINCT os.operation_shoe_id) as orderCount
      FROM services s
      LEFT JOIN operation_services os ON s.id = os.service_id
      GROUP BY s.category
      ORDER BY totalRevenue DESC
    `).all();
    const categoryBreakdown = categoryBreakdownResult.map((row) => ({
      category: row.category || "Uncategorized",
      totalRevenue: row.totalRevenue || 0,
      orderCount: row.orderCount || 0
    }));
    res.json({
      byRevenue,
      byOrders,
      categoryBreakdown
    });
  } catch (error) {
    console.error("Error fetching service performance:", error);
    res.status(500).json({ error: "Failed to fetch service performance analytics" });
  }
});
router15.get("/unpaid-balances", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const summaryResult = await database_default.prepare(`
      SELECT
        COALESCE(SUM(total_amount - paid_amount), 0) as totalUnpaid,
        COUNT(CASE WHEN (total_amount - paid_amount) > 0 THEN 1 END) as partialPaymentCount,
        COUNT(CASE WHEN (total_amount - paid_amount) = total_amount
                   AND created_at < DATE('now', '-30 days') THEN 1 END) as overdueCount
      FROM operations
      WHERE total_amount > paid_amount
    `).get();
    const agingResult = await database_default.prepare(`
      SELECT
        COUNT(CASE WHEN created_at >= DATE('now', '-30 days') THEN 1 END) as currentCount,
        COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-30 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as currentBalance,
        COUNT(CASE WHEN created_at >= DATE('now', '-60 days')
                   AND created_at < DATE('now', '-30 days') THEN 1 END) as aging30Count,
        COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-60 days')
                          AND created_at < DATE('now', '-30 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as aging30Balance,
        COUNT(CASE WHEN created_at >= DATE('now', '-90 days')
                   AND created_at < DATE('now', '-60 days') THEN 1 END) as aging60Count,
        COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-90 days')
                          AND created_at < DATE('now', '-60 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as aging60Balance,
        COUNT(CASE WHEN created_at < DATE('now', '-90 days') THEN 1 END) as overdueCount,
        COALESCE(SUM(CASE WHEN created_at < DATE('now', '-90 days')
                          THEN total_amount - paid_amount ELSE 0 END), 0) as overdueBalance
      FROM operations
      WHERE total_amount > paid_amount
    `).get();
    const agingAnalysis = {
      current: {
        balance: agingResult.currentBalance || 0,
        count: agingResult.currentCount || 0
      },
      aging30: {
        balance: agingResult.aging30Balance || 0,
        count: agingResult.aging30Count || 0
      },
      aging60: {
        balance: agingResult.aging60Balance || 0,
        count: agingResult.aging60Count || 0
      },
      overdue: {
        balance: agingResult.overdueBalance || 0,
        count: agingResult.overdueCount || 0
      }
    };
    const unpaidOperationsResult = await database_default.prepare(`
      SELECT
        o.id,
        o.customer_id as customerId,
        c.name as customerName,
        c.phone as customerPhone,
        o.total_amount,
        o.paid_amount,
        o.total_amount - o.paid_amount as balance,
        o.created_at as createdAt,
        o.created_at as createdAtRaw
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.total_amount > o.paid_amount
      ORDER BY o.created_at ASC
      LIMIT 50
    `).all();
    const unpaidOperations = unpaidOperationsResult.map((row) => {
      const createdAtDate = new Date(row.createdAtRaw);
      const daysOutstanding = Math.floor((now.getTime() - createdAtDate.getTime()) / (1e3 * 60 * 60 * 24));
      return {
        id: row.id,
        customerId: row.customerId || "",
        customerName: row.customerName || "Unknown",
        customerPhone: row.customerPhone || "",
        totalAmount: row.total_amount,
        paidAmount: row.paid_amount,
        balance: row.balance,
        createdAt: row.createdAt,
        daysOutstanding
      };
    });
    res.json({
      summary: {
        totalUnpaid: summaryResult.totalUnpaid || 0,
        overdueCount: summaryResult.overdueCount || 0,
        partialPaymentCount: summaryResult.partialPaymentCount || 0
      },
      agingAnalysis,
      unpaidOperations
    });
  } catch (error) {
    console.error("Error fetching unpaid balances:", error);
    res.status(500).json({ error: "Failed to fetch unpaid balance analytics" });
  }
});
router15.get("/profit-summary", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const totalSalesResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM operations
    `).get();
    const totalExpensesResult = await database_default.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    `).get();
    const salesThisMonthResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ?
    `).get(startOfMonth.toISOString());
    const salesLastMonthResult = await database_default.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM operations
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfLastMonth.toISOString(), endOfLastMonth.toISOString());
    const expensesThisMonthResult = await database_default.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= ?
    `).get(startOfMonth.toISOString().split("T")[0]);
    const expensesLastMonthResult = await database_default.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= ? AND date <= ?
    `).get(startOfLastMonth.toISOString().split("T")[0], endOfLastMonth.toISOString().split("T")[0]);
    const totalSales = totalSalesResult?.total || 0;
    const totalExpenses = totalExpensesResult?.total || 0;
    const netProfit = totalSales - totalExpenses;
    const salesThisMonth = salesThisMonthResult?.total || 0;
    const expensesThisMonth = expensesThisMonthResult?.total || 0;
    const profitThisMonth = salesThisMonth - expensesThisMonth;
    const salesLastMonth = salesLastMonthResult?.total || 0;
    const expensesLastMonth = expensesLastMonthResult?.total || 0;
    const profitLastMonth = salesLastMonth - expensesLastMonth;
    const salesTrend = salesLastMonth > 0 ? (salesThisMonth - salesLastMonth) / salesLastMonth * 100 : 0;
    const expenseTrend = expensesLastMonth > 0 ? (expensesThisMonth - expensesLastMonth) / expensesLastMonth * 100 : 0;
    const profitTrend = profitLastMonth > 0 ? (profitThisMonth - profitLastMonth) / profitLastMonth * 100 : 0;
    const monthlyBreakdownResult = await database_default.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        SUM(total_amount) as sales
      FROM operations
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();
    const monthlyExpenseResult = await database_default.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(amount) as expenses
      FROM expenses
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all();
    const monthlyDataMap = /* @__PURE__ */ new Map();
    for (const row of monthlyBreakdownResult) {
      monthlyDataMap.set(row.month, { sales: row.sales || 0, expenses: 0, profit: 0 });
    }
    for (const row of monthlyExpenseResult) {
      const existing = monthlyDataMap.get(row.month) || { sales: 0, expenses: 0, profit: 0 };
      existing.expenses = row.expenses || 0;
      existing.profit = existing.sales - existing.expenses;
      monthlyDataMap.set(row.month, existing);
    }
    const monthlyBreakdown = Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
      month,
      sales: data.sales,
      expenses: data.expenses,
      profit: data.profit
    })).sort((a, b) => a.month.localeCompare(b.month));
    res.json({
      totalSales,
      totalExpenses,
      netProfit,
      salesThisMonth,
      expensesThisMonth,
      profitThisMonth,
      salesTrend: Math.round(salesTrend * 10) / 10,
      expenseTrend: Math.round(expenseTrend * 10) / 10,
      profitTrend: Math.round(profitTrend * 10) / 10,
      monthlyBreakdown
    });
  } catch (error) {
    console.error("Error fetching profit summary:", error);
    res.status(500).json({ error: "Failed to fetch profit summary" });
  }
});
router15.get("/daily-balance", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const startOfDay = `${targetDate} 00:00:00`;
    const endOfDay = `${targetDate} 23:59:59`;
    const salesResult = await database_default.prepare(`
      SELECT
        COALESCE(op.payment_method, 'Cash') as paymentMethod,
        COALESCE(SUM(op.amount), 0) as total
      FROM operation_payments op
      WHERE date(op.created_at) = date(?)
      GROUP BY op.payment_method
    `).all(targetDate);
    const expensesResult = await database_default.prepare(`
      SELECT
        COALESCE(payment_method, 'Cash') as paymentMethod,
        COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date = ?
      GROUP BY payment_method
    `).all(targetDate);
    const expenseDetailsResult = await database_default.prepare(`
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.date = ?
      ORDER BY e.created_at DESC
    `).all(targetDate);
    const expenseDetails = expenseDetailsResult.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      paymentMethod: e.payment_method || "Cash",
      vendor: e.vendor || "",
      createdByName: e.created_by_name || "Unknown",
      notes: e.notes || ""
    }));
    const salesByMethod = {
      "Cash": 0,
      "Mobile Money": 0,
      "Credit Card": 0,
      "Bank Transfer": 0,
      "Cheque": 0
    };
    for (const s of salesResult) {
      salesByMethod[s.paymentMethod] = s.total;
    }
    const expensesByMethod = {
      "Cash": 0,
      "Mobile Money": 0,
      "Credit Card": 0,
      "Bank Transfer": 0,
      "Cheque": 0
    };
    for (const e of expensesResult) {
      expensesByMethod[e.paymentMethod] = e.total;
    }
    const totalSales = Object.values(salesByMethod).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expensesByMethod).reduce((a, b) => a + b, 0);
    const cashAtHand = salesByMethod["Cash"] - expensesByMethod["Cash"];
    const mobileMoneyBalance = salesByMethod["Mobile Money"] - expensesByMethod["Mobile Money"];
    const cardBalance = salesByMethod["Credit Card"] - expensesByMethod["Credit Card"];
    const bankTransferBalance = salesByMethod["Bank Transfer"] - expensesByMethod["Bank Transfer"];
    const chequeBalance = salesByMethod["Cheque"] - expensesByMethod["Cheque"];
    res.json({
      date: targetDate,
      sales: {
        total: totalSales,
        byMethod: {
          cash: salesByMethod["Cash"],
          mobileMoney: salesByMethod["Mobile Money"],
          card: salesByMethod["Credit Card"],
          bankTransfer: salesByMethod["Bank Transfer"],
          cheque: salesByMethod["Cheque"]
        }
      },
      expenses: {
        total: totalExpenses,
        byMethod: {
          cash: expensesByMethod["Cash"],
          mobileMoney: expensesByMethod["Mobile Money"],
          card: expensesByMethod["Credit Card"],
          bankTransfer: expensesByMethod["Bank Transfer"],
          cheque: expensesByMethod["Cheque"]
        }
      },
      balance: {
        cashAtHand,
        mobileMoney: mobileMoneyBalance,
        card: cardBalance,
        bankTransfer: bankTransferBalance,
        cheque: chequeBalance
      },
      netBalance: totalSales - totalExpenses,
      expenseDetails
    });
  } catch (error) {
    console.error("Error fetching daily balance:", error);
    res.status(500).json({ error: "Failed to fetch daily balance" });
  }
});
router15.get("/daily-balance/archives", async (req, res) => {
  try {
    const archives = await database_default.prepare(`
      SELECT id, date, sales_total, expenses_total, cash_at_hand, net_balance, created_at
      FROM daily_balance_archives
      ORDER BY date DESC
      LIMIT 50
    `).all();
    res.json(archives.map((a) => ({
      id: a.id,
      date: a.date,
      salesTotal: a.sales_total,
      expensesTotal: a.expenses_total,
      cashAtHand: a.cash_at_hand,
      netBalance: a.net_balance,
      createdAt: a.created_at
    })));
  } catch (error) {
    console.error("Error fetching archives:", error);
    res.status(500).json({ error: "Failed to fetch archives" });
  }
});
router15.get("/daily-balance/archives/month/:year/:month", async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = `${year}-${month.padStart(2, "0")}-31`;
    const archives = await database_default.prepare(`
      SELECT id, date, sales_total, expenses_total, cash_at_hand, net_balance
      FROM daily_balance_archives
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `).all(startDate, endDate);
    res.json(archives.map((a) => ({
      date: a.date,
      hasArchive: true
    })));
  } catch (error) {
    console.error("Error fetching month archives:", error);
    res.status(500).json({ error: "Failed to fetch month archives" });
  }
});
router15.get("/daily-balance/archive/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const archive = await database_default.prepare(`
      SELECT * FROM daily_balance_archives WHERE date = ?
    `).get(date);
    if (!archive) {
      return res.status(404).json({ error: "Archive not found for this date" });
    }
    res.json(JSON.parse(archive.data_json));
  } catch (error) {
    console.error("Error fetching archive:", error);
    res.status(500).json({ error: "Failed to fetch archive" });
  }
});
router15.post("/daily-balance/archive", async (req, res) => {
  try {
    const { date, data } = req.body;
    const existing = await database_default.prepare(`
      SELECT id FROM daily_balance_archives WHERE date = ?
    `).get(date);
    const id = existing?.id || `archive_${date}_${Date.now()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (existing) {
      await database_default.prepare(`
        UPDATE daily_balance_archives
        SET sales_total = ?, expenses_total = ?, cash_at_hand = ?, net_balance = ?, data_json = ?, created_at = ?
        WHERE date = ?
      `).run(data.sales.total, data.expenses.total, data.balance.cashAtHand, data.netBalance, JSON.stringify(data), now, date);
    } else {
      await database_default.prepare(`
        INSERT INTO daily_balance_archives (id, date, sales_total, expenses_total, cash_at_hand, net_balance, data_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, date, data.sales.total, data.expenses.total, data.balance.cashAtHand, data.netBalance, JSON.stringify(data), now);
    }
    res.json({ success: true, id, date });
  } catch (error) {
    console.error("Error saving archive:", error);
    res.status(500).json({ error: "Failed to save archive" });
  }
});
router15.delete("/daily-balance/archive/:date", async (req, res) => {
  try {
    const { date } = req.params;
    await database_default.prepare(`
      DELETE FROM daily_balance_archives WHERE date = ?
    `).run(date);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting archive:", error);
    res.status(500).json({ error: "Failed to delete archive" });
  }
});
var analytics_default = router15;

// server/routes/retailProducts.ts
init_database();
import express16 from "express";
import { v4 as uuidv412 } from "uuid";
var router16 = express16.Router();
router16.get("/", async (req, res) => {
  try {
    const products = await database_default.prepare(`
      SELECT * FROM retail_products
      WHERE is_active = 1
      ORDER BY display_order ASC, name ASC
    `).all();
    res.json(products);
  } catch (error) {
    console.error("Error fetching retail products:", error);
    res.status(500).json({ error: "Failed to fetch retail products" });
  }
});
router16.get("/categories", async (req, res) => {
  try {
    const categories = await database_default.prepare(`
      SELECT DISTINCT category
      FROM retail_products
      WHERE is_active = 1
      ORDER BY category
    `).all();
    res.json(categories.map((c) => c.category));
  } catch (error) {
    console.error("Error fetching retail product categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
router16.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await database_default.prepare(`
      SELECT * FROM retail_products
      WHERE is_active = 1 AND category = ?
      ORDER BY display_order ASC, name ASC
    `).all(category);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
router16.post("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, category, description, default_price, icon, display_order, image_url } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: "Name and category are required" });
    }
    const id = uuidv412();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      INSERT INTO retail_products (
        id, name, category, description, default_price, icon, display_order, image_url,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      name,
      category,
      description || null,
      default_price || 0,
      icon || null,
      Number.isFinite(display_order) ? Number(display_order) : 999,
      image_url || null,
      now,
      now
    );
    const newProduct = await database_default.prepare("SELECT * FROM retail_products WHERE id = ?").get(id);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating retail product:", error);
    res.status(500).json({ error: "Failed to create retail product" });
  }
});
router16.put("/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const setClauses = [];
    const values = [];
    const fieldMap = {
      name: "name",
      category: "category",
      description: "description",
      default_price: "default_price",
      icon: "icon",
      display_order: "display_order",
      is_active: "is_active",
      image_url: "image_url"
    };
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in updates) {
        setClauses.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    }
    setClauses.push("updated_at = ?");
    values.push(now);
    values.push(id);
    const result = await database_default.prepare(`
      UPDATE retail_products
      SET ${setClauses.join(", ")}
      WHERE id = ?
    `).run(...values);
    if (result.changes > 0) {
      const updatedProduct = await database_default.prepare("SELECT * FROM retail_products WHERE id = ?").get(id);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating retail product:", error);
    res.status(500).json({ error: "Failed to update retail product" });
  }
});
router16.delete("/:id", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await database_default.prepare(`
      UPDATE retail_products
      SET is_active = 0, updated_at = ?
      WHERE id = ? AND is_active = 1
    `).run(now, id);
    if (result.changes > 0) {
      res.json({ message: "Product deactivated successfully" });
    } else {
      res.status(404).json({ error: "Product not found or already inactive" });
    }
  } catch (error) {
    console.error("Error deactivating retail product:", error);
    res.status(500).json({ error: "Failed to deactivate retail product" });
  }
});
var retailProducts_default = router16;

// server/routes/expenses.ts
init_database();
import express17 from "express";
import { v4 as uuidv413 } from "uuid";
var router17 = express17.Router();
var EXPENSE_CATEGORIES = [
  "Supplies & Materials",
  "Rent & Utilities",
  "Salaries & Wages",
  "Marketing & Advertising",
  "Equipment & Maintenance",
  "Transportation",
  "Insurance",
  "Taxes & Fees",
  "Office Supplies",
  "Miscellaneous"
];
var CATEGORY_COLORS = {
  "Supplies & Materials": "#6366f1",
  "Rent & Utilities": "#ec4899",
  "Salaries & Wages": "#f59e0b",
  "Marketing & Advertising": "#10b981",
  "Equipment & Maintenance": "#8b5cf6",
  "Transportation": "#3b82f6",
  "Insurance": "#ef4444",
  "Taxes & Fees": "#14b8a6",
  "Office Supplies": "#84cc16",
  "Miscellaneous": "#6b7280"
};
var getDateBoundaries2 = () => {
  const now = /* @__PURE__ */ new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { now, startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth };
};
var transformExpense = (expense) => ({
  id: expense.id,
  title: expense.title,
  category: expense.category,
  amount: expense.amount,
  date: expense.date,
  status: expense.status,
  paymentMethod: expense.payment_method,
  vendor: expense.vendor,
  notes: expense.notes,
  createdBy: expense.created_by,
  createdByName: expense.creator_name || "Unknown",
  createdAt: expense.created_at,
  updatedAt: expense.updated_at
});
router17.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, status, startDate, endDate, limit = 20, offset = 0 } = req.query;
    let query = `
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM expenses e
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];
    if (req.user.role === "staff") {
      query += " AND e.created_by = ?";
      countQuery += " AND e.created_by = ?";
      params.push(req.user.id);
      countParams.push(req.user.id);
    }
    if (category) {
      query += " AND e.category = ?";
      countQuery += " AND e.category = ?";
      params.push(category);
      countParams.push(category);
    }
    if (status) {
      query += " AND e.status = ?";
      countQuery += " AND e.status = ?";
      params.push(status);
      countParams.push(status);
    }
    if (startDate) {
      query += " AND e.date >= ?";
      countQuery += " AND e.date >= ?";
      params.push(startDate);
      countParams.push(startDate);
    }
    if (endDate) {
      query += " AND e.date <= ?";
      countQuery += " AND e.date <= ?";
      params.push(endDate);
      countParams.push(endDate);
    }
    query += " ORDER BY e.date DESC, e.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));
    const expenses = await database_default.prepare(query).all(...params);
    const countResult = await database_default.prepare(countQuery).get(...countParams);
    const total = countResult.total;
    res.json({
      expenses: expenses.map(transformExpense),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});
router17.get("/categories", authenticateToken, async (req, res) => {
  res.json(EXPENSE_CATEGORIES);
});
router17.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const { startOfToday, endOfToday, startOfWeek, startOfMonth, endOfMonth } = getDateBoundaries2();
    const isStaff = req.user.role === "staff";
    const userId = req.user.id;
    const staffWhere = isStaff ? " AND created_by = ?" : "";
    const staffParams = isStaff ? [userId] : [];
    const monthlyTotalResult = await database_default.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= ? AND date <= ?${staffWhere}
    `).get(startOfMonth.toISOString().split("T")[0], endOfMonth.toISOString().split("T")[0], ...staffParams);
    const weeklyTotalResult = await database_default.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date >= ?${staffWhere}
    `).get(startOfWeek.toISOString().split("T")[0], ...staffParams);
    const todayTotalResult = await database_default.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date = ?${staffWhere}
    `).get(startOfToday.toISOString().split("T")[0], ...staffParams);
    const categoryBreakdownResult = await database_default.prepare(`
      SELECT
        category,
        SUM(amount) as amount
      FROM expenses
      WHERE date >= ? AND date <= ?${staffWhere}
      GROUP BY category
      ORDER BY amount DESC
    `).all(startOfMonth.toISOString().split("T")[0], endOfMonth.toISOString().split("T")[0], ...staffParams);
    const totalByCategory = categoryBreakdownResult.reduce((sum, cat) => sum + cat.amount, 0);
    const categoryBreakdown = categoryBreakdownResult.map((cat) => ({
      category: cat.category,
      amount: cat.amount,
      percentage: totalByCategory > 0 ? Math.round(cat.amount / totalByCategory * 100 * 10) / 10 : 0,
      color: CATEGORY_COLORS[cat.category] || "#6b7280"
    }));
    const weeklyTrendsResult = await database_default.prepare(`
      SELECT
        strftime('%w', date) as dayNum,
        CASE strftime('%w', date)
          WHEN '0' THEN 'Sun'
          WHEN '1' THEN 'Mon'
          WHEN '2' THEN 'Tue'
          WHEN '3' THEN 'Wed'
          WHEN '4' THEN 'Thu'
          WHEN '5' THEN 'Fri'
          WHEN '6' THEN 'Sat'
        END as day,
        SUM(amount) as amount
      FROM expenses
      WHERE date >= date('now', '-7 days')${staffWhere}
      GROUP BY day
      ORDER BY dayNum ASC
    `).all(...staffParams);
    const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyTrends = dayOrder.map((day) => {
      const found = weeklyTrendsResult.find((w) => w.day === day);
      return { day, amount: found ? found.amount : 0 };
    });
    const monthlyTrendsResult = await database_default.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(amount) as amount
      FROM expenses
      WHERE date >= date('now', '-6 months')${staffWhere}
      GROUP BY month
      ORDER BY month ASC
    `).all(...staffParams);
    const recentExpenses = await database_default.prepare(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1${staffWhere}
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT 5
    `).all(...staffParams);
    const statusBreakdownResult = await database_default.prepare(`
      SELECT
        status,
        COUNT(*) as count,
        SUM(amount) as amount
      FROM expenses
      WHERE 1=1${staffWhere}
      GROUP BY status
    `).all(...staffParams);
    const statusBreakdown = statusBreakdownResult.map((s) => ({
      status: s.status,
      count: s.count,
      amount: s.amount
    }));
    const paymentMethodResult = await database_default.prepare(`
      SELECT
        payment_method,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM expenses
      WHERE payment_method IS NOT NULL${staffWhere}
      GROUP BY payment_method
    `).all(...staffParams);
    const paymentMethodBreakdown = paymentMethodResult.map((p) => ({
      method: p.payment_method,
      amount: p.amount,
      count: p.count
    }));
    const topCategories = categoryBreakdown.slice(0, 5);
    res.json({
      totalThisMonth: monthlyTotalResult?.total || 0,
      totalThisWeek: weeklyTotalResult?.total || 0,
      totalToday: todayTotalResult?.total || 0,
      categoryBreakdown,
      weeklyTrends,
      monthlyTrends: monthlyTrendsResult,
      recentExpenses: recentExpenses.map(transformExpense),
      statusBreakdown,
      paymentMethodBreakdown,
      topCategories
    });
  } catch (error) {
    console.error("Error fetching expense analytics:", error);
    res.status(500).json({ error: "Failed to fetch expense analytics" });
  }
});
router17.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await database_default.prepare(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    if (req.user.role === "staff" && expense.created_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(transformExpense(expense));
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
});
router17.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, category, amount, date, status, paymentMethod, vendor, notes } = req.body;
    if (!title || !category || !amount || !date) {
      return res.status(400).json({ error: "Title, category, amount, and date are required" });
    }
    const id = uuidv413();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const createdBy = req.user.id;
    await database_default.prepare(`
      INSERT INTO expenses (id, title, category, amount, date, status, payment_method, vendor, notes, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      category,
      amount,
      date,
      status || "pending",
      paymentMethod || null,
      vendor || null,
      notes || null,
      createdBy,
      now,
      now
    );
    const expense = await database_default.prepare(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id);
    res.status(201).json(transformExpense(expense));
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
});
router17.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, date, status, paymentMethod, vendor, notes } = req.body;
    const existing = await database_default.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }
    if (req.user.role === "staff" && existing.created_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      UPDATE expenses SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        amount = COALESCE(?, amount),
        date = COALESCE(?, date),
        status = COALESCE(?, status),
        payment_method = ?,
        vendor = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      title || null,
      category || null,
      amount || null,
      date || null,
      status || null,
      paymentMethod !== void 0 ? paymentMethod : existing.payment_method,
      vendor !== void 0 ? vendor : existing.vendor,
      notes !== void 0 ? notes : existing.notes,
      now,
      id
    );
    const expense = await database_default.prepare(`
      SELECT e.*, u.name as creator_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id);
    res.json(transformExpense(expense));
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});
router17.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await database_default.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }
    if (req.user.role === "staff" && existing.created_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    await database_default.prepare("DELETE FROM expenses WHERE id = ?").run(id);
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});
var expenses_default = router17;

// server/index.ts
var app = express18();
var port = 3e3;
app.use(cors());
app.use(express18.json());
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/operations", operations_default);
app.use("/api/inventory", inventory_default);
app.use("/api/printer", printer_default);
app.use("/api/sales", sales_default);
app.use("/api/qrcodes", qrcodes_default);
app.use("/api/supplies", supplies_default);
app.use("/api/categories", categories_default);
app.use("/api/products", products_default);
app.use("/api/customers", credits_default);
app.use("/api/business", business_default);
app.use("/api/auth", auth_default);
app.use("/api/staff-messages", staffMessages_default);
app.use("/api/colors", colors_default);
app.use("/api/invoices", invoices_default);
app.get("/api/ticket/next", async (req, res) => {
  try {
    const dbModule = await Promise.resolve().then(() => (init_database(), database_exports));
    const db2 = dbModule.default;
    const result = db2.prepare("SELECT ticket_number FROM operations ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (result && result.ticket_number) {
      const parts = result.ticket_number.split("-");
      if (parts.length === 2) {
        nextNum = parseInt(parts[1], 10) + 1;
      }
    }
    const ticket_number = `01-${String(nextNum).padStart(6, "0")}`;
    res.json({ ticket_number });
  } catch (err) {
    console.error("Error generating ticket number:", err);
    res.status(500).json({ error: "Failed to generate ticket number" });
  }
});
app.use("/api/analytics", analytics_default);
app.use("/api/retail-products", retailProducts_default);
app.use("/api/expenses", expenses_default);
app.get("/api/customers", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5e3, 1e4);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search;
    let query = `SELECT * FROM customers`;
    const params = [];
    if (search) {
      query += ` WHERE name LIKE ? OR phone LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const customers = await database_default.prepare(query).all(...params);
    const countQuery = search ? `SELECT COUNT(*) as total FROM customers WHERE name LIKE ? OR phone LIKE ?` : `SELECT COUNT(*) as total FROM customers`;
    const countParams = search ? [`%${search}%`, `%${search}%`] : [];
    const { total } = await database_default.prepare(countQuery).get(...countParams);
    res.json({
      data: customers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});
app.post("/api/customers", async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const id = uuidv414();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      INSERT INTO customers (id, name, phone, email, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, phone, email || null, address || null, now, now);
    res.json({ id, name, phone, email, address });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});
app.put("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const setClauses = Object.keys(updates).map((key) => {
      const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      return `${dbKey} = ?`;
    }).concat(["updated_at = ?"]).join(", ");
    const values = [...Object.values(updates), now, id];
    await database_default.prepare(`
      UPDATE customers
      SET ${setClauses}
      WHERE id = ?
    `).run(...values);
    const customer = await database_default.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    res.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});
app.delete("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      UPDATE customers 
      SET status = 'inactive', updated_at = ? 
      WHERE id = ?
    `).run(now, id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await database_default.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM operations o 
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `).all();
    const transformedOrders = orders.map(transformOperation);
    res.json(transformedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
app.post("/api/orders", async (req, res) => {
  const { customer_id, items, notes, promised_date } = req.body;
  try {
    const order_id = uuidv414();
    let total_amount = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.run("BEGIN TRANSACTION");
    try {
      await database_default.prepare(`
        INSERT INTO operations (id, customer_id, total_amount, notes, promised_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(order_id, customer_id, total_amount, notes || null, promised_date || null, now, now);
      for (const item of items) {
        const item_id = uuidv414();
        total_amount += item.price * item.quantity;
        await database_default.prepare(`
          INSERT INTO operation_services (id, operation_shoe_id, service_id, quantity, price, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(item_id, order_id, item.service_id, item.quantity, item.price, item.notes || null, now, now);
      }
      await database_default.prepare(`
        UPDATE operations SET total_amount = ? WHERE id = ?
      `).run(total_amount, order_id);
      await database_default.prepare(`
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + ?,
            last_visit = ?
        WHERE id = ?
      `).run(total_amount, now, customer_id);
      const order = await database_default.prepare(`
        SELECT o.*, c.name as customer_name 
        FROM operations o 
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).get(order_id);
      await database_default.run("COMMIT");
      res.status(201).json(transformOperation(order));
    } catch (error) {
      await database_default.run("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});
app.get("/api/services", async (req, res) => {
  try {
    const services = await database_default.prepare("SELECT * FROM services ORDER BY name ASC").all();
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});
app.post("/api/services", async (req, res) => {
  try {
    const { name, description, price, estimated_days, category } = req.body;
    const id = uuidv414();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await database_default.prepare(`
      INSERT INTO services (id, name, description, price, estimated_days, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || null, price, estimated_days || null, category || null, now, now);
    const service = await database_default.prepare("SELECT * FROM services WHERE id = ?").get(id);
    res.status(201).json(service);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});
app.patch("/api/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, estimated_days, category } = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await database_default.prepare(`
      UPDATE services
      SET name = ?, description = ?, price = ?, estimated_days = ?, category = ?, updated_at = ?
      WHERE id = ?
    `).run(name, description || null, price, estimated_days || null, category || null, now, id);
    const service = await database_default.prepare("SELECT * FROM services WHERE id = ?").get(id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});
app.delete("/api/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await database_default.prepare("DELETE FROM services WHERE id = ?").run(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});
app.get("/api/sales-categories", async (req, res) => {
  try {
    const categories = await database_default.prepare(`
      SELECT * FROM sales_categories 
      ORDER BY display_order ASC
    `).all();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching sales categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/sales-items", async (req, res) => {
  try {
    const items = await database_default.prepare(`
      SELECT 
        sales_items.*,
        sales_categories.name as category_name
      FROM sales_items
      JOIN sales_categories ON sales_items.category_id = sales_categories.id
      ORDER BY sales_categories.display_order ASC, sales_items.name ASC
    `).all();
    res.json(items);
  } catch (error) {
    console.error("Error fetching sales items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/sales-items/category/:categoryId", async (req, res) => {
  try {
    const items = await database_default.prepare(`
      SELECT * FROM sales_items 
      WHERE category_id = ?
      ORDER BY name ASC
    `).all(req.params.categoryId);
    res.json(items);
  } catch (error) {
    console.error("Error fetching sales items by category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log("Database file:", database_default.name);
  try {
    const customerCount = await database_default.prepare("SELECT COUNT(*) as count FROM customers").get();
    console.log("Connected to database. Customer count:", customerCount?.count || 0);
  } catch (error) {
    console.error("Database connection error:", error);
  }
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
