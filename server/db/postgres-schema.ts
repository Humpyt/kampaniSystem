import { Pool } from 'pg';

export async function createSchema(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    // ============================================
    // CUSTOMERS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active',
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0,
        account_balance DECIMAL(12,2) DEFAULT 0,
        last_visit TIMESTAMPTZ,
        loyalty_points INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // USERS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by TEXT
      )
    `);

    // ============================================
    // USER_PERMISSIONS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        permission TEXT NOT NULL,
        granted BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, permission)
      )
    `);

    // ============================================
    // STAFF_TARGETS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_targets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        daily_target DECIMAL(12,2) DEFAULT 1000000,
        monthly_target DECIMAL(12,2) DEFAULT 26000000,
        effective_date DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // SERVICES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(12,2) NOT NULL,
        pricing_mode TEXT NOT NULL DEFAULT 'fixed',
        min_price DECIMAL(12,2),
        max_price DECIMAL(12,2),
        unit_label TEXT,
        price_note TEXT,
        estimated_days INTEGER,
        category TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // COLORS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS colors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hex_code TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // OPERATIONS TABLE (Repair Orders)
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS operations (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        status TEXT DEFAULT 'pending',
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        payment_method TEXT,
        ticket_number TEXT UNIQUE,  -- Format: YYYY-MM-XXXX
        notes TEXT,
        promised_date DATE,
        is_no_charge BOOLEAN DEFAULT false,
        is_do_over BOOLEAN DEFAULT false,
        is_delivery BOOLEAN DEFAULT false,
        is_pickup BOOLEAN DEFAULT false,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        -- New payment flow fields (2024-04-17)
        workflow_status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        picked_up_at TIMESTAMPTZ,
        picked_up_by_name VARCHAR(255),
        picked_up_by_phone VARCHAR(50),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_sequences (
        prefix TEXT PRIMARY KEY,
        current_value INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add new columns if they don't exist (for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'workflow_status') THEN
          ALTER TABLE operations ADD COLUMN workflow_status TEXT DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'payment_status') THEN
          ALTER TABLE operations ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'picked_up_at') THEN
          ALTER TABLE operations ADD COLUMN picked_up_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'picked_up_by_name') THEN
          ALTER TABLE operations ADD COLUMN picked_up_by_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'picked_up_by_phone') THEN
          ALTER TABLE operations ADD COLUMN picked_up_by_phone VARCHAR(50);
        END IF;
      END $$
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'pricing_mode') THEN
          ALTER TABLE services ADD COLUMN pricing_mode TEXT NOT NULL DEFAULT 'fixed';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'min_price') THEN
          ALTER TABLE services ADD COLUMN min_price DECIMAL(12,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'max_price') THEN
          ALTER TABLE services ADD COLUMN max_price DECIMAL(12,2);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'unit_label') THEN
          ALTER TABLE services ADD COLUMN unit_label TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'price_note') THEN
          ALTER TABLE services ADD COLUMN price_note TEXT;
        END IF;
        UPDATE services
        SET pricing_mode = COALESCE(pricing_mode, 'fixed')
        WHERE pricing_mode IS NULL OR pricing_mode = '';
      END $$
    `);

    // ============================================
    // OPERATION_SHOES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_shoes (
        id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        category TEXT NOT NULL,
        shoe_size TEXT,
        color TEXT,
        color_description TEXT,
        notes TEXT,
        pickup_status TEXT NOT NULL DEFAULT 'pending',
        picked_up_at TIMESTAMPTZ,
        pickup_event_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_pickup_events (
        id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        collector_name VARCHAR(255),
        collector_phone VARCHAR(50),
        picked_up_at TIMESTAMPTZ NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_shoes' AND column_name = 'pickup_status') THEN
          ALTER TABLE operation_shoes ADD COLUMN pickup_status TEXT NOT NULL DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_shoes' AND column_name = 'picked_up_at') THEN
          ALTER TABLE operation_shoes ADD COLUMN picked_up_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_shoes' AND column_name = 'pickup_event_id') THEN
          ALTER TABLE operation_shoes ADD COLUMN pickup_event_id TEXT;
        END IF;
      END $$
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'operation_shoes' AND constraint_name = 'operation_shoes_pickup_event_id_fkey'
        ) THEN
          ALTER TABLE operation_shoes
          ADD CONSTRAINT operation_shoes_pickup_event_id_fkey
          FOREIGN KEY (pickup_event_id) REFERENCES operation_pickup_events(id) ON DELETE SET NULL;
        END IF;
      END $$
    `);

    // ============================================
    // OPERATION_SERVICES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_services (
        id TEXT PRIMARY KEY,
        operation_shoe_id TEXT NOT NULL,
        service_id TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (operation_shoe_id) REFERENCES operation_shoes(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id)
      )
    `);

    // ============================================
    // OPERATION_PAYMENTS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_payments (
        id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        transaction_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // OPERATION_RETAIL_ITEMS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_retail_items (
        id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        product_id TEXT,
        product_name TEXT NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        quantity INTEGER DEFAULT 1,
        total_price DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // STAFF_CONVERSATIONS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_conversations (
        id TEXT PRIMARY KEY,
        participant1_id TEXT NOT NULL,
        participant2_id TEXT NOT NULL,
        last_message_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(participant1_id, participant2_id)
      )
    `);

    // ============================================
    // STAFF_MESSAGES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (conversation_id) REFERENCES staff_conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // CATEGORIES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // PRODUCTS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        description TEXT,
        image_url TEXT,
        category_id TEXT NOT NULL,
        in_stock BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // ============================================
    // SALES_CATEGORIES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // SALES_ITEMS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        quantity INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (category_id) REFERENCES sales_categories(id)
      )
    `);

    // ============================================
    // RETAIL_PRODUCTS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS retail_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        default_price DECIMAL(12,2) DEFAULT 0,
        icon TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // SALES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        sale_type TEXT NOT NULL CHECK(sale_type IN ('repair', 'retail', 'pickup')),
        reference_id TEXT NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        payment_method TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Add discount column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount') THEN
          ALTER TABLE sales ADD COLUMN discount DECIMAL(12,2) DEFAULT 0;
        END IF;
      END $$
    `);

    // ============================================
    // QRCOODES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS qrcodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // INVOICES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        type TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        subtotal DECIMAL(12,2) NOT NULL,
        discount DECIMAL(12,2) DEFAULT 0,
        total DECIMAL(12,2) NOT NULL,
        amount_paid DECIMAL(12,2) DEFAULT 0,
        payment_method TEXT,
        notes TEXT,
        promised_date DATE,
        generated_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (operation_id) REFERENCES operations(id)
      )
    `);

    // ============================================
    // CUSTOMER_CREDITS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_credits (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        balance_after DECIMAL(12,2) NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // SUPPLIES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        on_hand INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        cost DECIMAL(12,2) NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // INVENTORY_ITEMS TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        item_no TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        vendor TEXT NOT NULL,
        upc_sku TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        cost DECIMAL(12,2) NOT NULL DEFAULT 0,
        on_hand INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // EXPENSES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        date DATE NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        vendor TEXT,
        notes TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_items (
        id TEXT PRIMARY KEY,
        expense_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        notes TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
      )
    `);

    // ============================================
    // DAILY_BALANCE_ARCHIVES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_balance_archives (
        id TEXT PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        sales_total DECIMAL(12,2) NOT NULL,
        expenses_total DECIMAL(12,2) NOT NULL,
        cash_at_hand DECIMAL(12,2) NOT NULL,
        net_balance DECIMAL(12,2) NOT NULL,
        data_json JSONB NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ============================================
    // COMMISSION_ARCHIVES TABLE
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS commission_archives (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
        archived_at TIMESTAMPTZ DEFAULT NOW(),
        paid_at TIMESTAMPTZ,
        created_by TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, year, month)
      )
    `);

    // ============================================
    // INDEXES (30+ indexes on foreign keys and frequent query columns)
    // ============================================

    // Customers indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_name_order ON customers(name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (LOWER(name) gin_trgm_ops)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm ON customers USING gin (phone gin_trgm_ops)`);

    // Operations indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_customer ON operations(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_created_by ON operations(created_by)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_created_at ON operations(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_created_at_desc ON operations(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_status_created_at_desc ON operations(status, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_created_by_created_at_desc ON operations(created_by, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_promised_date ON operations(promised_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_is_no_charge ON operations(is_no_charge) WHERE is_no_charge = true`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_is_do_over ON operations(is_do_over) WHERE is_do_over = true`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_is_delivery ON operations(is_delivery) WHERE is_delivery = true`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_is_pickup ON operations(is_pickup) WHERE is_pickup = true`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_workflow_status ON operations(workflow_status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_payment_status ON operations(payment_status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operations_picked_up_at ON operations(picked_up_at)`);

    // Operation shoes indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operation_shoes_operation ON operation_shoes(operation_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operation_shoes_category ON operation_shoes(category)`);

    // Operation services indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operation_services_operation_shoe ON operation_services(operation_shoe_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operation_services_service ON operation_services(service_id)`);

    // Operation payments indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operation_payments_operation ON operation_payments(operation_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operation_payments_created_at ON operation_payments(created_at)`);

    // Operation retail items indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_operation_retail_items_operation ON operation_retail_items(operation_id)`);

    // Staff conversations indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_conversations_participants ON staff_conversations(participant1_id, participant2_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_conversations_last_message ON staff_conversations(last_message_at)`);

    // Staff messages indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_messages_conversation ON staff_messages(conversation_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_messages_sender ON staff_messages(sender_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_messages_is_read ON staff_messages(is_read) WHERE is_read = false`);

    // Services indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_services_category ON services(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_services_name_order ON services(name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_services_active_name ON services(status, name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON services USING gin (LOWER(name) gin_trgm_ops)`);

    // Products indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock) WHERE in_stock = true`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true`);

    // Sales categories indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_categories_display_order ON sales_categories(display_order)`);

    // Sales items indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_items_category ON sales_items(category_id)`);

    // Retail products indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_retail_products_active_order ON retail_products(is_active, display_order) WHERE is_active = true`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_retail_products_category ON retail_products(category)`);

    // Sales indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)`);

    // QR codes indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_qrcodes_type ON qrcodes(type)`);

    // Invoices indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_operation ON invoices(operation_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number)`);

    // Customer credits indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customer_credits_customer ON customer_credits(customer_id)`);

    // Expenses indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expense_items_category ON expense_items(category)`);

    // Commission archives indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commission_archives_user ON commission_archives(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commission_archives_year_month ON commission_archives(year, month)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_commission_archives_status ON commission_archives(status)`);

    // Daily balance archives indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_daily_balance_archives_date ON daily_balance_archives(date)`);

    // Supplies indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category)`);

    // Inventory items indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_items_vendor ON inventory_items(vendor)`);

    // Users indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);

    // Staff targets indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_targets_user ON staff_targets(user_id)`);

    // User permissions indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id)`);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
