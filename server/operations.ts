import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './database';
import { transformOperation } from './utils';

const router = express.Router();

// Create operation table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    status TEXT DEFAULT 'pending',
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    notes TEXT,
    promised_date TEXT,
    created_at TEXT,
    updated_at TEXT,
    is_no_charge INTEGER DEFAULT 0,
    is_do_over INTEGER DEFAULT 0,
    is_delivery INTEGER DEFAULT 0,
    is_pickup INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )
`);

// Create operation_shoes table for the many-to-many relationship
db.exec(`
  CREATE TABLE IF NOT EXISTS operation_shoes (
    id TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (operation_id) REFERENCES operations (id)
  )
`);

// Create operation_services table for the many-to-many relationship
db.exec(`
  CREATE TABLE IF NOT EXISTS operation_services (
    id TEXT PRIMARY KEY,
    operation_shoe_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price REAL NOT NULL,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (operation_shoe_id) REFERENCES operation_shoes (id),
    FOREIGN KEY (service_id) REFERENCES services (id)
  )
`);

// Get all operations
router.get('/', async (req, res) => {
  try {
    const operations = await db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `).all();

    // Get shoes and services for each operation
    const operationsWithShoes = [];
    for (const operation of operations) {
      const shoes = await db.prepare(`
        SELECT os.*, s.name as service_name, s.price as service_base_price
        FROM operation_shoes os
        LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
        LEFT JOIN services s ON oss.service_id = s.id
        WHERE os.operation_id = ?
      `).all(operation.id);

      operationsWithShoes.push({
        ...operation,
        shoes: shoes.map(shoe => ({
          id: shoe.id,
          category: shoe.category,
          color: shoe.color,
          notes: shoe.notes,
          services: [{
            id: shoe.service_id,
            name: shoe.service_name,
            price: shoe.price,
            basePrice: shoe.service_base_price
          }]
        }))
      });
    }

    res.json(operationsWithShoes.map(transformOperation));
  } catch (error) {
    console.error('Failed to fetch operations:', error);
    res.status(500).json({ error: 'Failed to fetch operations' });
  }
});

// Get operation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const operation = await db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);
    
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    
    res.json(transformOperation(operation));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch operation' });
  }
});

// Get payment history for an operation
router.get('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;

    const payments = await db.prepare(`
      SELECT * FROM operation_payments
      WHERE operation_id = ?
      ORDER BY created_at DESC
    `).all(id);

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Create new operation
router.post('/', async (req, res) => {
  console.log('Received operation request:', JSON.stringify(req.body, null, 2));
  const { customer, shoes, status, totalAmount, discount, isNoCharge, isDoOver, isDelivery, isPickup, notes } = req.body;
  const now = new Date().toISOString();

  if (!customer || !customer.id) {
    console.error('Invalid customer data:', customer);
    return res.status(400).json({ error: 'Invalid customer data' });
  }

  if (!Array.isArray(shoes) || shoes.length === 0) {
    console.error('Invalid shoes data:', shoes);
    return res.status(400).json({ error: 'Invalid shoes data' });
  }

  try {
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Insert the operation
      const operationId = uuidv4();
      console.log('Creating operation with ID:', operationId);

      await db.prepare(`
        INSERT INTO operations (
          id, customer_id, status, total_amount, discount, notes,
          is_no_charge, is_do_over, is_delivery, is_pickup,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        operationId,
        customer.id,
        status || 'pending',
        totalAmount || 0,
        discount || 0,
        notes || null,
        isNoCharge ? 1 : 0,
        isDoOver ? 1 : 0,
        isDelivery ? 1 : 0,
        isPickup ? 1 : 0,
        now,
        now
      );

      // Insert each shoe
      for (let index = 0; index < shoes.length; index++) {
        const shoe = shoes[index];
        console.log(`Processing shoe ${index + 1}:`, JSON.stringify(shoe, null, 2));
        const shoeId = uuidv4();
        
        await db.prepare(`
          INSERT INTO operation_shoes (
            id, operation_id, category, color, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          shoeId,
          operationId,
          shoe.category,
          shoe.color || null,
          shoe.notes || null,
          now,
          now
        );

        // Insert services for each shoe
        if (Array.isArray(shoe.services)) {
          for (let sIndex = 0; sIndex < shoe.services.length; sIndex++) {
            const service = shoe.services[sIndex];
            console.log(`Processing service ${sIndex + 1} for shoe ${index + 1}:`, JSON.stringify(service, null, 2));
            
            if (!service.service_id) {
              throw new Error(`Missing service_id for service ${sIndex + 1} of shoe ${index + 1}`);
            }

            await db.prepare(`
              INSERT INTO operation_services (
                id, operation_shoe_id, service_id, quantity, price, notes,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              uuidv4(),
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

      // Return the created operation with all related data
      const operation = await db.prepare(`
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email
        FROM operations o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).get(operationId);

      // Get shoes for this operation
      const operationShoes = await db.prepare(`
        SELECT * FROM operation_shoes WHERE operation_id = ?
      `).all(operationId);

      // Get services for each shoe
      const shoesWithServices = [];
      for (const shoe of operationShoes) {
        const services = await db.prepare(`
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
          services: services.map(s => ({
            id: s.service_id,
            name: s.service_name,
            price: s.price,
            quantity: s.quantity,
            notes: s.notes
          }))
        });
      }

      await db.run('COMMIT');
      
      res.json({
        ...operation,
        shoes: shoesWithServices,
        isNoCharge: Boolean(operation.is_no_charge),
        isDoOver: Boolean(operation.is_do_over),
        isDelivery: Boolean(operation.is_delivery),
        isPickup: Boolean(operation.is_pickup),
        discount: operation.discount || 0
      });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating operation:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create operation' });
  }
});

// Update operation status
router.patch('/:id', async (req, res) => {
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
      UPDATE operations
      SET ${setClauses}
      WHERE id = ?
    `).run(...values);
    
    const operation = await db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);
    
    res.json(transformOperation(operation));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update operation' });
  }
});

// Process payment with multiple methods
router.post('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { payments } = req.body; // Array of { method, amount, transaction_id }

    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'Payments array is required' });
    }

    // Get operation
    const operation = await db.get('SELECT * FROM operations WHERE id = ?', [id]);
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const now = new Date().toISOString();

    await db.run('BEGIN TRANSACTION');

    // Add each payment
    for (const payment of payments) {
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.run(`
        INSERT INTO operation_payments (id, operation_id, payment_method, amount, transaction_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [paymentId, id, payment.method, payment.amount, payment.transaction_id || null, now]);
    }

    // Update operation paid_amount
    const newPaidAmount = (operation.paid_amount || 0) + totalPaid;
    await db.run(`
      UPDATE operations
      SET paid_amount = ?,
          status = CASE WHEN ? >= total_amount THEN 'completed' ELSE status END,
          updated_at = ?
      WHERE id = ?
    `, [newPaidAmount, newPaidAmount, now, id]);

    await db.run('COMMIT');

    // Return updated operation
    const updatedOperation = await db.get('SELECT * FROM operations WHERE id = ?', [id]);
    res.json(transformOperation(updatedOperation));

  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
