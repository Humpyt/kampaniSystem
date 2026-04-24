import express from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create a new order
router.post('/orders', (req, res) => {
  try {
    const { items, total, paymentMethod, customerInfo } = req.body;
    const now = new Date().toISOString();
    
    // Create order
    const orderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (
        id, total_amount, payment_method, customer_name,
        customer_phone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, total, paymentMethod, 
      customerInfo?.name || null, 
      customerInfo?.phone || null,
      now, now
    );

    // Create order items
    const insertOrderItem = db.prepare(`
      INSERT INTO operation_services (
        id, order_id, item_id, quantity, price,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertOrderItem.run(
        uuidv4(), orderId, item.id, item.quantity,
        item.price, now, now
      );
    }

    res.status(201).json({ id: orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

export default router;
