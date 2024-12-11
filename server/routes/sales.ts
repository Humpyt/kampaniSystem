import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = express.Router();

// Get all sales with optional filters
router.get('/', (req, res) => {
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
      query += ' AND s.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND s.created_at <= ?';
      params.push(endDate);
    }
    if (saleType) {
      query += ' AND s.sale_type = ?';
      params.push(saleType);
    }

    query += ' ORDER BY s.created_at DESC';
    
    const sales = db.prepare(query).all(...params);

    // Get details for each sale
    const salesWithDetails = sales.map(sale => {
      let details = [];
      if (sale.sale_type === 'repair') {
        const repairDetails = db.prepare(`
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

        details = repairDetails;
      } else if (sale.sale_type === 'retail') {
        const retailDetails = db.prepare(`
          SELECT 
            si.name,
            si.price,
            oi.quantity
          FROM order_items oi
          JOIN sales_items si ON si.id = oi.item_id
          WHERE oi.order_id = ?
        `).all(sale.reference_id);

        details = retailDetails;
      }

      return {
        ...sale,
        details
      };
    });

    res.json(salesWithDetails);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Record a new sale
router.post('/', (req, res) => {
  try {
    const { customerId, saleType, referenceId, totalAmount, paymentMethod } = req.body;
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO sales (
        id, customer_id, sale_type, reference_id, 
        total_amount, payment_method, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      customerId,
      saleType,
      referenceId,
      totalAmount,
      paymentMethod,
      now,
      now
    );

    if (result.changes > 0) {
      res.status(201).json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to record sale' });
    }
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

export default router;
