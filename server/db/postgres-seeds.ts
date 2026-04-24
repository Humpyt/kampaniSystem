import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// RETAIL_PRODUCT_CATALOG - 34 products from the existing codebase
const RETAIL_PRODUCT_CATALOG = [
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

// Helper function to normalize retail product names for matching
const normalizeRetailProductName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Seed 4 default sales categories (Polish, Laces, Insoles, Accessories)
 */
export async function seedSalesCategories(pool: Pool): Promise<void> {
  const result = await pool.query('SELECT COUNT(*) FROM sales_categories');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('Sales categories already seeded');
    return;
  }

  const defaults = [
    { id: 'cat_polish', name: 'Polish', description: 'Shoe polish products' },
    { id: 'cat_laces', name: 'Laces', description: 'Shoe laces' },
    { id: 'cat_insoles', name: 'Insoles', description: 'Shoe insoles' },
    { id: 'cat_accessories', name: 'Accessories', description: 'Other shoe accessories' }
  ];

  for (const cat of defaults) {
    await pool.query(
      `INSERT INTO sales_categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [cat.id, cat.name, cat.description]
    );
  }

  console.log('Sales categories seeded successfully');
}

/**
 * Seed 3 default services (Basic Repair, Polish Service, Deep Cleaning)
 */
export async function seedServices(pool: Pool): Promise<void> {
  const result = await pool.query('SELECT COUNT(*) FROM services');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('Services already seeded');
    return;
  }

  const defaults = [
    { id: 'srv_repair', name: 'Basic Repair', price: 30000, estimated_days: 3, category: 'repair' },
    { id: 'srv_polish', name: 'Polish Service', price: 15000, estimated_days: 1, category: 'polish' },
    { id: 'srv_clean', name: 'Deep Cleaning', price: 25000, estimated_days: 2, category: 'cleaning' }
  ];

  for (const s of defaults) {
    await pool.query(
      `INSERT INTO services (id, name, price, estimated_days, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [s.id, s.name, s.price, s.estimated_days, s.category]
    );
  }

  console.log('Services seeded successfully');
}

/**
 * Seed 14 colors (beige, black, blue, brown, burgundy, gray, green, multi, navy, orange, pink, red, white, yellow)
 */
export async function seedColors(pool: Pool): Promise<void> {
  const result = await pool.query('SELECT COUNT(*) FROM colors');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('Colors already seeded');
    return;
  }

  const colors = [
    { id: 'beige', name: 'Beige', hex_code: '#F5F5DC', display_order: 1 },
    { id: 'black', name: 'Black', hex_code: '#000000', display_order: 2 },
    { id: 'blue', name: 'Blue', hex_code: '#0000FF', display_order: 3 },
    { id: 'brown', name: 'Brown', hex_code: '#8B4513', display_order: 4 },
    { id: 'burgundy', name: 'Burgundy', hex_code: '#800000', display_order: 5 },
    { id: 'gray', name: 'Gray', hex_code: '#808080', display_order: 6 },
    { id: 'green', name: 'Green', hex_code: '#008000', display_order: 7 },
    { id: 'multi', name: 'Multi', hex_code: '#RAINBOW', display_order: 8 },
    { id: 'navy', name: 'Navy', hex_code: '#000080', display_order: 9 },
    { id: 'orange', name: 'Orange', hex_code: '#FFA500', display_order: 10 },
    { id: 'pink', name: 'Pink', hex_code: '#FFC0CB', display_order: 11 },
    { id: 'red', name: 'Red', hex_code: '#FF0000', display_order: 12 },
    { id: 'white', name: 'White', hex_code: '#FFFFFF', display_order: 13 },
    { id: 'yellow', name: 'Yellow', hex_code: '#FFFF00', display_order: 14 },
  ];

  for (const c of colors) {
    await pool.query(
      `INSERT INTO colors (id, name, hex_code, display_order, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [c.id, c.name, c.hex_code, c.display_order]
    );
  }

  console.log('Colors seeded successfully');
}

/**
 * Create 8 users with bcrypt-hashed passwords.
 * Also seeds user_permissions and staff_targets.
 */
export async function seedUsers(pool: Pool): Promise<void> {
  const result = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('Users already seeded');
    return;
  }

  const now = new Date().toISOString();

  const users = [
    { id: 'admin-001', name: 'Admin User', email: 'admin@repairpro.com', password: 'admin123', role: 'admin' },
    { id: 'manager-001', name: 'Manager User', email: 'manager@repairpro.com', password: 'manager123', role: 'manager' },
    { id: 'staff-001', name: 'Staff User', email: 'staff1@repairpro.com', password: 'staff123', role: 'staff' },
    { id: 'staff-002', name: 'Stella', email: 'stella@repairpro.com', password: 'stella123', role: 'admin' },
    { id: 'staff-003', name: 'Esther', email: 'esther@repairpro.com', password: 'esther123', role: 'staff' },
    { id: 'staff-004', name: 'Ritah', email: 'ritah@repairpro.com', password: 'ritah123', role: 'staff' },
    { id: 'staff-005', name: 'Noelah', email: 'noelah@repairpro.com', password: 'noelah123', role: 'staff' },
    { id: 'staff-006', name: 'Danielah', email: 'danielah@repairpro.com', password: 'danielah123', role: 'staff' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $6)`,
      [u.id, u.name, u.email, hash, u.role, now]
    );
  }

  // Seed permissions
  const adminPerms = [
    'view_customers', 'create_drop', 'create_pickup', 'send_messages',
    'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
    'view_business_targets', 'view_all_targets', 'manage_staff', 'manage_users',
    'manage_settings', 'manage_inventory', 'manage_supplies'
  ];
  const managerPerms = [
    'view_customers', 'create_drop', 'create_pickup', 'send_messages',
    'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
    'view_business_targets', 'view_all_targets', 'manage_staff', 'view_reports'
  ];
  const staffPerms = [
    'view_customers', 'create_drop', 'create_pickup', 'send_messages',
    'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
    'view_business_targets'
  ];

  const permMap: Record<string, string[]> = {
    'admin-001': adminPerms,
    'manager-001': managerPerms,
    'staff-001': staffPerms,
    'staff-002': adminPerms,
    'staff-003': staffPerms,
    'staff-004': staffPerms,
    'staff-005': staffPerms,
    'staff-006': staffPerms,
  };

  for (const [userId, perms] of Object.entries(permMap)) {
    for (const perm of perms) {
      await pool.query(
        `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
         VALUES ($1, $2, $3, true, $4)
         ON CONFLICT (user_id, permission) DO NOTHING`,
        [`perm-${userId}-${perm}`, userId, perm, now]
      );
    }
  }

  // Seed staff targets
  const targets = [
    { userId: 'admin-001', daily: 1000000, monthly: 26000000 },
    { userId: 'manager-001', daily: 1000000, monthly: 26000000 },
    { userId: 'staff-001', daily: 1000000, monthly: 26000000 },
    { userId: 'staff-002', daily: 1200000, monthly: 31200000 },
    { userId: 'staff-003', daily: 1000000, monthly: 26000000 },
    { userId: 'staff-004', daily: 1000000, monthly: 26000000 },
    { userId: 'staff-005', daily: 1000000, monthly: 26000000 },
    { userId: 'staff-006', daily: 1000000, monthly: 26000000 },
  ];

  for (const t of targets) {
    await pool.query(
      `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5, $5)
       ON CONFLICT (user_id) DO NOTHING`,
      [`target-${t.userId}`, t.userId, t.daily, t.monthly, now]
    );
  }

  console.log('Users seeded successfully');
  console.log('Created default users with hashed passwords');
}

/**
 * Sync 34 retail products from RETAIL_PRODUCT_CATALOG.
 * Uses upsert logic: UPDATE if exists, INSERT if new.
 * Normalizes names for matching.
 */
export async function syncRetailProducts(pool: Pool): Promise<void> {
  const existing = await pool.query('SELECT * FROM retail_products');
  const consumedIds = new Set<string>();
  let inserted = 0;
  let updated = 0;

  for (const product of RETAIL_PRODUCT_CATALOG) {
    const aliases = new Set(
      [product.name, ...(product.aliases || [])].map(normalizeRetailProductName)
    );

    const match = existing.rows.find((row: any) => {
      if (consumedIds.has(row.id)) return false;
      return aliases.has(normalizeRetailProductName(row.name));
    });

    if (match) {
      consumedIds.add(match.id);
      const hasChanges =
        match.name !== product.name ||
        match.category !== product.category ||
        (match.description || '') !== product.description ||
        Number(match.default_price) !== Number(product.default_price) ||
        Number(match.display_order) !== Number(product.display_order) ||
        match.is_active !== true;

      if (hasChanges) {
        await pool.query(
          `UPDATE retail_products
           SET name=$1, category=$2, description=$3, default_price=$4, display_order=$5, is_active=true, updated_at=CURRENT_TIMESTAMP
           WHERE id=$6`,
          [product.name, product.category, product.description, product.default_price, product.display_order, match.id]
        );
        updated++;
      }
    } else {
      await pool.query(
        `INSERT INTO retail_products (id, name, category, description, default_price, display_order, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [uuidv4(), product.name, product.category, product.description, product.default_price, product.display_order]
      );
      inserted++;
    }
  }

  console.log(`Retail catalog synced (${RETAIL_PRODUCT_CATALOG.length} canonical products, ${inserted} inserted, ${updated} updated)`);
}

/**
 * Seed 3 categories and 3 products
 */
export async function seedProductsAndCategories(pool: Pool): Promise<void> {
  const result = await pool.query('SELECT COUNT(*) FROM categories');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('Products and categories already seeded');
    return;
  }

  const now = new Date().toISOString();

  const cats = [
    { id: uuidv4(), name: 'Shoe Care', description: 'Shoe polish, cleaners, and care products' },
    { id: uuidv4(), name: 'Repair Services', description: 'Professional shoe repair services' },
    { id: uuidv4(), name: 'Accessories', description: 'Shoe laces, insoles, and accessories' },
  ];

  for (const c of cats) {
    await pool.query(
      `INSERT INTO categories (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)`,
      [c.id, c.name, c.description, now]
    );
  }

  const products = [
    { name: 'Premium Shoe Polish Kit', price: 95000, description: 'Complete shoe care kit with polish, brushes, and cloths', categoryId: cats[0].id },
    { name: 'Heel Replacement', price: 140000, description: 'Professional heel replacement service', categoryId: cats[1].id },
    { name: 'Premium Shoe Laces', price: 35000, description: 'High-quality wax cotton shoe laces', categoryId: cats[2].id },
  ];

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (id, name, price, description, category_id, in_stock, featured, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, false, $6, $6)`,
      [uuidv4(), p.name, p.price, p.description, p.categoryId, now]
    );
  }

  console.log('Products and categories seeded successfully');
}

/**
 * Call all seed functions in order
 */
export async function seedAll(pool: Pool): Promise<void> {
  try {
    await seedSalesCategories(pool);
    await seedServices(pool);
    await seedColors(pool);
    await seedUsers(pool);
    await syncRetailProducts(pool);
    await seedProductsAndCategories(pool);
    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}
