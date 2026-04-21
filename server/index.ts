import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './database';
import operationsRouter from './operations';
import inventoryRouter from './routes/inventory';
import printerRouter from './routes/printer';
import salesRoutes from './routes/sales';
import qrCodesRouter from './routes/qrcodes';
import suppliesRouter from './routes/supplies';
import categoriesRouter from './routes/categories';
import productsRouter from './routes/products';
import creditRoutes from './routes/credits';
import businessRoutes from './routes/business';
import authRoutes from './routes/auth';
import staffMessagesRouter from './routes/staffMessages';
import colorsRouter from './routes/colors';
import invoicesRouter from './routes/invoices';
import analyticsRouter from './routes/analytics';
import retailProductsRouter from './routes/retailProducts';
import expensesRouter from './routes/expenses';
import { transformCustomer, transformOperation, transformService } from './utils';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Add error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Use routers
app.use('/api/operations', operationsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/printer', printerRouter);
app.use('/api/sales', salesRoutes);
app.use('/api/qrcodes', qrCodesRouter);
app.use('/api/supplies', suppliesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/customers', creditRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/staff-messages', staffMessagesRouter);
app.use('/api/colors', colorsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/retail-products', retailProductsRouter);
app.use('/api/expenses', expensesRouter);

// Customer endpoints
app.get('/api/customers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5000, 10000);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;

    let query = `SELECT * FROM customers`;
    const params: any[] = [];

    if (search) {
      query += ` WHERE name LIKE ? OR phone LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const customers = await db.prepare(query).all(...params);

    // Get total count for pagination
    const countQuery = search
      ? `SELECT COUNT(*) as total FROM customers WHERE name LIKE ? OR phone LIKE ?`
      : `SELECT COUNT(*) as total FROM customers`;
    const countParams = search ? [`%${search}%`, `%${search}%`] : [];
    const { total } = await db.prepare(countQuery).get(...countParams);

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
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO customers (id, name, phone, email, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, phone, email || null, address || null, now, now);

    res.json({ id, name, phone, email, address });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    const setClauses = Object.keys(updates)
      .map(key => {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${dbKey} = ?`;
      })
      .concat(['updated_at = ?'])
      .join(', ');

    const values = [...Object.values(updates), now, id];

    await db.prepare(`
      UPDATE customers
      SET ${setClauses}
      WHERE id = ?
    `).run(...values);

    const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE customers 
      SET status = 'inactive', updated_at = ? 
      WHERE id = ?
    `).run(now, id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Order routes
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM operations o 
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `).all();
    const transformedOrders = orders.map(transformOperation);
    res.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer_id, items, notes, promised_date } = req.body;

  try {
    const order_id = uuidv4();
    let total_amount = 0;
    const now = new Date().toISOString();

    await db.run('BEGIN TRANSACTION');

    try {
      await db.prepare(`
        INSERT INTO operations (id, customer_id, total_amount, notes, promised_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(order_id, customer_id, total_amount, notes || null, promised_date || null, now, now);

      for (const item of items) {
        const item_id = uuidv4();
        total_amount += item.price * item.quantity;

        await db.prepare(`
          INSERT INTO operation_services (id, operation_shoe_id, service_id, quantity, price, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(item_id, order_id, item.service_id, item.quantity, item.price, item.notes || null, now, now);
      }

      await db.prepare(`
        UPDATE operations SET total_amount = ? WHERE id = ?
      `).run(total_amount, order_id);

      await db.prepare(`
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + ?,
            last_visit = ?
        WHERE id = ?
      `).run(total_amount, now, customer_id);

      const order = await db.prepare(`
        SELECT o.*, c.name as customer_name 
        FROM operations o 
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).get(order_id);

      await db.run('COMMIT');
      res.status(201).json(transformOperation(order));
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Services endpoints
app.get('/api/services', async (req, res) => {
  try {
    const services = await db.prepare('SELECT * FROM services ORDER BY name ASC').all();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, description, price, estimated_days, category } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    const result = await db.prepare(`
      INSERT INTO services (id, name, description, price, estimated_days, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || null, price, estimated_days || null, category || null, now, now);

    const service = await db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.patch('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, estimated_days, category } = req.body;
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE services
      SET name = ?, description = ?, price = ?, estimated_days = ?, category = ?, updated_at = ?
      WHERE id = ?
    `).run(name, description || null, price, estimated_days || null, category || null, now, id);

    const service = await db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.prepare('DELETE FROM services WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Sales endpoints
app.get('/api/sales-categories', async (req, res) => {
  try {
    const categories = await db.prepare(`
      SELECT * FROM sales_categories 
      ORDER BY display_order ASC
    `).all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching sales categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sales-items', async (req, res) => {
  try {
    const items = await db.prepare(`
      SELECT 
        sales_items.*,
        sales_categories.name as category_name
      FROM sales_items
      JOIN sales_categories ON sales_items.category_id = sales_categories.id
      ORDER BY sales_categories.display_order ASC, sales_items.name ASC
    `).all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching sales items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sales-items/category/:categoryId', async (req, res) => {
  try {
    const items = await db.prepare(`
      SELECT * FROM sales_items 
      WHERE category_id = ?
      ORDER BY name ASC
    `).all(req.params.categoryId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching sales items by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Database file:', (db as any).name);

  // Test database connection
  try {
    const customerCount = await db.prepare('SELECT COUNT(*) as count FROM customers').get();
    console.log('Connected to database. Customer count:', customerCount?.count || 0);
  } catch (error) {
    console.error('Database connection error:', error);
  }
});

// Handle process errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
