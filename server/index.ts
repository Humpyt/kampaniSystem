import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './database';
import operationsRouter from './operations';
import inventoryRouter from './routes/inventory';
import printerRouter from './routes/printer';
import salesRoutes from './routes/sales';
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
app.use('/api', inventoryRouter);
app.use('/api/sales', salesRoutes);
// Temporarily disable printer routes
// app.use('/api/printer', printerRouter);

// Customer endpoints
app.get('/api/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT * FROM customers
      ORDER BY name ASC
    `).all();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const id = uuidv4();
    
    const result = db.prepare(`
      INSERT INTO customers (id, name, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, phone, email, address);
    
    res.json({ id, name, phone, email, address });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', (req, res) => {
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
    
    db.prepare(`
      UPDATE customers
      SET ${setClauses}
      WHERE id = ?
    `).run(...values);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    
    db.prepare(`
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
app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o 
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

app.post('/api/orders', (req, res) => {
  const { customer_id, items, notes, promised_date } = req.body;
  
  try {
    const order_id = uuidv4();
    let total_amount = 0;

    // Start transaction
    const transaction = db.transaction(() => {
      // Create order
      db.prepare(`
        INSERT INTO orders (id, customer_id, total_amount, notes, promised_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(order_id, customer_id, total_amount, notes, promised_date);

      // Add order items
      items.forEach((item: any) => {
        const item_id = uuidv4();
        total_amount += item.price * item.quantity;
        
        db.prepare(`
          INSERT INTO order_items (id, order_id, service_id, quantity, price, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(item_id, order_id, item.service_id, item.quantity, item.price, item.notes);
      });

      // Update order total
      db.prepare(`
        UPDATE orders SET total_amount = ? WHERE id = ?
      `).run(total_amount, order_id);

      // Update customer stats
      db.prepare(`
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + ?,
            last_visit = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(total_amount, customer_id);

      return db.prepare(`
        SELECT o.*, c.name as customer_name 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).get(order_id);
    });

    const order = transaction();
    res.status(201).json(transformOperation(order));
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Operations endpoints
app.get('/api/operations', (req, res) => {
  try {
    const operations = db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `).all();

    const operationsWithDetails = operations.map(operation => {
      const shoes = db.prepare(`
        SELECT 
          s.*,
          GROUP_CONCAT(srv.name) as services
        FROM operation_shoes s
        LEFT JOIN operation_services os ON s.id = os.operation_shoe_id
        LEFT JOIN services srv ON os.service_id = srv.id
        WHERE s.operation_id = ?
        GROUP BY s.id
      `).all(operation.id);

      return {
        ...operation,
        shoes: shoes.map(shoe => ({
          ...shoe,
          services: shoe.services ? shoe.services.split(',') : []
        }))
      };
    });

    res.json(operationsWithDetails);
  } catch (error) {
    console.error('Error fetching operations:', error);
    res.status(500).json({ error: 'Failed to fetch operations' });
  }
});

// Services endpoints
app.get('/api/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY name ASC').all();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', (req, res) => {
  try {
    const { name, description, price, estimated_days, category } = req.body;
    const id = uuidv4();
    
    const result = db.prepare(`
      INSERT INTO services (id, name, description, price, estimated_days, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, description, price, estimated_days, category);

    if (result.changes > 0) {
      const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
      res.status(201).json(service);
    } else {
      res.status(400).json({ error: 'Failed to create service' });
    }
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Sales endpoints
app.get('/api/sales-categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT * FROM sales_categories 
      ORDER BY display_order ASC
    `).all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching sales categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sales-items', (req, res) => {
  try {
    const items = db.prepare(`
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

app.get('/api/sales-items/category/:categoryId', (req, res) => {
  try {
    const items = db.prepare(`
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
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Database file:', db.name);
  
  // Test database connection
  try {
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();
    console.log('Connected to database. Customer count:', customerCount.count);
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
