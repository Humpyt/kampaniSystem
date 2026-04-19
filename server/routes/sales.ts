import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

// Get all sales with optional filters
router.get('/', async (req, res) => {
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
      query += ` AND s.created_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND s.created_at <= $${params.length + 1}`;
      params.push(endDate);
    }
    if (saleType) {
      query += ` AND s.sale_type = $${params.length + 1}`;
      params.push(saleType);
    }

    query += ' ORDER BY s.created_at DESC';
    
    const sales = await db.all(query, params);

    // Get details for each sale
    const salesWithDetails = [];
    for (const sale of sales) {
      let details: any[] = [];
      if (sale.sale_type === 'repair') {
        details = await db.all(`
          SELECT
            os.category,
            srv.name as service_name,
            osrv.price
          FROM operations o
          JOIN operation_shoes os ON o.id = os.operation_id
          JOIN operation_services osrv ON os.id = osrv.operation_shoe_id
          JOIN services srv ON srv.id = osrv.service_id
          WHERE o.id = $1
        `, [sale.reference_id]);
      } else if (sale.sale_type === 'retail') {
        details = await db.all(`
          SELECT
            ori.product_name as name,
            ori.unit_price as price,
            ori.quantity
          FROM operation_retail_items ori
          WHERE ori.operation_id = $1
        `, [sale.reference_id]);

        // Legacy retail orders may still use order_items/sales_items tables.
        // Some deployments do not have those tables, so only try the legacy lookup
        // when the operation-linked retail lookup returned nothing.
        if (details.length === 0) {
          try {
            details = await db.all(`
              SELECT
                si.name,
                si.price,
                oi.quantity
              FROM order_items oi
              JOIN sales_items si ON si.id = oi.item_id
              WHERE oi.order_id = $1
            `, [sale.reference_id]);
          } catch (legacyError) {
            console.warn('Skipping legacy retail sale detail lookup:', legacyError);
            details = [];
          }
        }
      }

      salesWithDetails.push({
        ...sale,
        details
      });
    }

    res.json(salesWithDetails);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Record a new sale
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customerId, saleType, referenceId, totalAmount, discount, paymentMethod } = req.body;
    const now = new Date().toISOString();
    const userId = req.user?.id || null;

    // If discount not provided explicitly, try to get it from the operation (for repair/retail sales)
    let finalDiscount = discount || 0;
    if (!discount && (saleType === 'repair' || saleType === 'retail') && referenceId) {
      const operation = await db.get(`
        SELECT discount FROM operations WHERE id = $1
      `, [referenceId]);
      if (operation) {
        finalDiscount = Number(operation.discount) || 0;
      }
    }

    const result = await db.run(`
      INSERT INTO sales (
        id, customer_id, sale_type, reference_id,
        total_amount, discount, payment_method, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      uuidv4(),
      customerId,
      saleType,
      referenceId,
      totalAmount,
      finalDiscount,
      paymentMethod,
      userId,
      now,
      now
    ]);

    if ((result as any).changes > 0) {
      res.status(201).json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to record sale' });
    }
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Mock user data
  const users = [
    { email: 'user1@example.com', password: '1234' },
    { email: 'user2@example.com', password: '1234' }
  ];

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

export default router;
