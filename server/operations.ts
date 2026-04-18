import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './database';
import { transformOperation } from './utils';
import { applyPaymentsToOperation, PaymentInput, PaymentSource } from './helpers/applyPayments';
import { authenticateToken } from './routes/auth';

const router = express.Router();

const mapRetailItem = (item: any) => ({
  id: item.id,
  productId: item.product_id || null,
  productName: item.product_name,
  unitPrice: item.unit_price,
  quantity: item.quantity,
  totalPrice: item.total_price,
});

const getRetailItemsByOperationIds = async (operationIds: string[]) => {
  const retailItemsMap = new Map<string, any[]>();

  if (operationIds.length === 0) {
    return retailItemsMap;
  }

  const placeholders = operationIds.map((_, i) => `$${i + 1}`).join(',');
  const retailItems = await db.all(`
    SELECT * FROM operation_retail_items
    WHERE operation_id IN (${placeholders})
    ORDER BY created_at ASC
  `, operationIds);

  for (const item of retailItems) {
    if (!retailItemsMap.has(item.operation_id)) {
      retailItemsMap.set(item.operation_id, []);
    }
    retailItemsMap.get(item.operation_id)!.push(mapRetailItem(item));
  }

  return retailItemsMap;
};

// Get all operations
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { created_by, status, limit = 1000, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 1000, 5000);
    const parsedOffset = parseInt(offset as string) || 0;

    let query = `
      SELECT o.*, c.id as customer_id, c.name as customer_name, c.phone as customer_phone, u.name as staff_name
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Role-based filtering: staff can only see their own operations
    if (req.user.role === 'staff') {
      conditions.push(`o.created_by = $${params.length + 1}`);
      params.push(req.user.id);
    } else if (created_by) {
      // Admin/manager can filter by created_by via query param
      conditions.push(`o.created_by = $${params.length + 1}`);
      params.push(created_by);
    }

    if (status) {
      conditions.push(`o.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parsedLimit, parsedOffset);

    const operations = await db.all(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM operations o`;
    let countParams: any[] = [];
    if (conditions.length > 0) {
      countQuery += ` WHERE ` + conditions.join(' AND ');
      countParams = params.slice(0, -2);
    }
    const { total } = await db.get(countQuery, countParams);

    // Optimization: Fetch all shoes in a single query instead of N+1 queries
    const operationIds = operations.map((op: any) => op.id);
    let shoesMap: Map<string, any[]> = new Map();
    const retailItemsMap = await getRetailItemsByOperationIds(operationIds);

    if (operationIds.length > 0) {
      const placeholders = operationIds.map((_, i) => `$${i + 1}`).join(',');
      const allShoes = await db.all(`
        SELECT os.*, s.name as service_name, s.price as service_base_price
        FROM operation_shoes os
        LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
        LEFT JOIN services s ON oss.service_id = s.id
        WHERE os.operation_id IN (${placeholders})
      `, operationIds);

      // Group shoes by operation_id
      for (const shoe of allShoes) {
        if (!shoesMap.has(shoe.operation_id)) {
          shoesMap.set(shoe.operation_id, []);
        }
        shoesMap.get(shoe.operation_id)!.push(shoe);
      }
    }

    // Build operations with shoes
    const operationsWithShoes = operations.map((operation: any) => ({
      ...operation,
      shoes: (shoesMap.get(operation.id) || []).map((shoe: any) => ({
        id: shoe.id,
        category: shoe.category,
        size: shoe.shoe_size || null,
        color: shoe.color,
        colorDescription: shoe.color_description || '',
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
    console.error('Failed to fetch operations:', error);
    res.status(500).json({ error: 'Failed to fetch operations' });
  }
});

// Get operation by ID
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const operation = await db.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, u.name as staff_name
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
    `, [id]);

    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    // Role-based access control: staff can only view their own operations
    if (req.user.role === 'staff' && operation.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get shoes and services for this operation
    const shoes = await db.all(`
      SELECT os.*, s.name as service_name, s.price as service_base_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = $1
    `, [id]);

    const operationWithShoes = {
      ...operation,
      shoes: shoes.map((shoe: any) => ({
        id: shoe.id,
        category: shoe.category,
        size: shoe.shoe_size || null,
        color: shoe.color,
        colorDescription: shoe.color_description || '',
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
    res.status(500).json({ error: 'Failed to fetch operation' });
  }
});

// Get payment history for an operation
router.get('/:id/payments', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check operation ownership for staff
    const operation = await db.get('SELECT created_by FROM operations WHERE id = $1', [id]);
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    if (req.user.role === 'staff' && operation.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payments = await db.all(`
      SELECT * FROM operation_payments
      WHERE operation_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Create new operation
router.post('/', authenticateToken, async (req: any, res) => {
  console.log('Received operation request:', JSON.stringify(req.body, null, 2));
  const {
    customer,
    shoes = [],
    retailItems = [],
    workflow_status = 'pending',
    totalAmount,
    discount,
    isNoCharge,
    isDoOver,
    isDelivery,
    isPickup,
    notes,
    promisedDate,
    ticket_number,
    payments = [],
  } = req.body;
  // Use authenticated user's ID as creator; fallback to body-created_by only for admin/manager
  const created_by = req.user.id;
  const now = new Date().toISOString();
  const normalizedShoes = Array.isArray(shoes) ? shoes : [];
  const normalizedRetailItems = Array.isArray(retailItems) ? retailItems : [];
  const finalTotalAmount = Number(totalAmount) || 0;
  const discountAmount = Number(discount) || 0;

  if (!customer || !customer.id) {
    console.error('Invalid customer data:', customer);
    return res.status(400).json({ error: 'Invalid customer data' });
  }

  if (normalizedShoes.length === 0 && normalizedRetailItems.length === 0) {
    console.error('Invalid operation items:', { shoes, retailItems });
    return res.status(400).json({ error: 'At least one repair or retail item is required' });
  }

  let operationId: string = '';

  try {
    // First transaction: Create the operation
    await db.withTransaction(async (client) => {
      // Insert the operation
      operationId = uuidv4();
      console.log('Creating operation with ID:', operationId);

      await client.run(`
        INSERT INTO operations (
          id, customer_id, status, workflow_status, payment_status, total_amount, discount, notes, promised_date,
          is_no_charge, is_do_over, is_delivery, is_pickup,
          created_by, created_at, updated_at, ticket_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        operationId,
        customer.id,
        'pending', // legacy status field - kept for compatibility
        workflow_status, // new workflow_status field
        'unpaid', // initial payment_status (will be updated if payments provided)
        finalTotalAmount,
        discountAmount,
        notes || null,
        promisedDate || null,
        isNoCharge ? 1 : 0,
        isDoOver ? 1 : 0,
        isDelivery ? 1 : 0,
        isPickup ? 1 : 0,
        created_by || null,
        now,
        now,
        ticket_number || null
      ]);

      // Insert each shoe
      for (let index = 0; index < normalizedShoes.length; index++) {
        const shoe = normalizedShoes[index];
        console.log(`Processing shoe ${index + 1}:`, JSON.stringify(shoe, null, 2));
        const shoeId = uuidv4();

        await client.run(`
          INSERT INTO operation_shoes (
            id, operation_id, category, shoe_size, color, color_description, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          shoeId,
          operationId,
          shoe.category,
          shoe.size || null,
          shoe.color || null,
          shoe.colorDescription || null,
          shoe.notes || null,
          now,
          now
        ]);

        // Insert services for each shoe
        if (Array.isArray(shoe.services)) {
          for (let sIndex = 0; sIndex < shoe.services.length; sIndex++) {
            const service = shoe.services[sIndex];
            console.log(`Processing service ${sIndex + 1} for shoe ${index + 1}:`, JSON.stringify(service, null, 2));

            if (!service.service_id) {
              throw new Error(`Missing service_id for service ${sIndex + 1} of shoe ${index + 1}`);
            }

            await client.run(`
              INSERT INTO operation_services (
                id, operation_shoe_id, service_id, quantity, price, notes,
                created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              uuidv4(),
              shoeId,
              service.service_id,
              service.quantity || 1,
              service.price || 0,
              service.notes || null,
              now,
              now
            ]);
          }
        }
      }

      // Insert retail items for this operation
      for (let index = 0; index < normalizedRetailItems.length; index++) {
        const item = normalizedRetailItems[index];
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const unitPrice = Number(item.unitPrice);
        const totalPrice = Number(item.totalPrice) || unitPrice * quantity;

        if (!item.productName || !Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw new Error(`Invalid retail item at position ${index + 1}`);
        }

        await client.run(`
          INSERT INTO operation_retail_items (
            id, operation_id, product_id, product_name, unit_price, quantity, total_price, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          uuidv4(),
          operationId,
          item.productId || null,
          item.productName,
          unitPrice,
          quantity,
          totalPrice,
          now
        ]);
      }

      // Update customer stats: increment total_orders and update last_visit
      await client.run(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            last_visit = $1
        WHERE id = $2
      `, [now, customer.id]);
    });

    // Transaction committed. Now handle payments or invoice generation.

    // If payments provided at creation, apply them using the shared helper
    if (payments && payments.length > 0) {
      console.log('[POST /] Applying payments at creation:', payments);
      const paymentResult = await applyPaymentsToOperation(operationId, payments as PaymentInput[], 'drop');
      if (!paymentResult.success) {
        console.error('[POST /] Payment application failed:', paymentResult.error);
        return res.status(400).json({ error: paymentResult.error });
      }
      console.log('[POST /] Payments applied successfully');
      return res.json(paymentResult.operation);
    }

    // No payments: auto-generate invoice
    const invoiceId = uuidv4();
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    try {
      await db.run(`
        INSERT INTO invoices (
          id, operation_id, type, invoice_number, customer_name, customer_phone,
          subtotal, discount, total, amount_paid, payment_method, notes,
          promised_date, generated_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        invoiceId, operationId, 'invoice', invoiceNumber,
        customer.name, customer.phone || '',
        finalTotalAmount + discountAmount, discountAmount, finalTotalAmount,
        0, null, notes || null, promisedDate || null, created_by || null, now, now
      ]);
    } catch (err) {
      console.error('Failed to auto-generate invoice:', err);
    }

    // Return the created operation
    const operation = await db.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [operationId]);

    const operationShoes = await db.all(`SELECT * FROM operation_shoes WHERE operation_id = $1`, [operationId]);
    const operationRetailItems = (await getRetailItemsByOperationIds([operationId])).get(operationId) || [];

    const shoesWithServices = [];
    for (const shoe of operationShoes) {
      const services = await db.all(`
        SELECT os.*, s.name as service_name, s.price as service_base_price
        FROM operation_services os
        LEFT JOIN services s ON os.service_id = s.id
        WHERE os.operation_shoe_id = $1
      `, [shoe.id]);

      shoesWithServices.push({
        ...shoe,
        size: shoe.shoe_size || null,
        services: services.map((s: any) => ({
          id: s.service_id,
          name: s.service_name,
          price: s.price,
          quantity: s.quantity,
          notes: s.notes
        }))
      });
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
      generatedDocumentId: invoiceId,
      generatedDocumentType: invoiceId ? 'invoice' : null,
    }));

  } catch (error) {
    console.error('Error creating operation:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create operation' });
  }
});

// Update operation status
router.patch('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    // Check operation ownership for staff
    const existingOp = await db.get('SELECT created_by FROM operations WHERE id = $1', [id]);
    if (!existingOp) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    if (req.user.role === 'staff' && existingOp.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const setClauses = Object.keys(updates)
      .map((key, i) => {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${dbKey} = $${i + 1}`;
      })
      .concat([`updated_at = $${Object.keys(updates).length + 1}`])
      .join(', ');

    const values = [...Object.values(updates), now, id];

    await db.run(`
      UPDATE operations
      SET ${setClauses}
      WHERE id = $${values.length}
    `, values);

    const operation = await db.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [id]);

    res.json(transformOperation(operation));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update operation' });
  }
});

// Process payment with multiple methods
router.post('/:id/payments', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { payments } = req.body;

    console.log('[PAYMENT] Received payment request for operation:', id);
    console.log('[PAYMENT] Payments data:', JSON.stringify(payments));

    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'Payments array is required' });
    }

    // Check operation ownership for staff
    const operation = await db.get('SELECT created_by FROM operations WHERE id = $1', [id]);
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }
    if (req.user.role === 'staff' && operation.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use the shared payment helper
    const result = await applyPaymentsToOperation(id, payments as PaymentInput[], 'pickup');

    if (!result.success) {
      console.log('[PAYMENT] Payment application failed:', result.error);
      return res.status(400).json({ error: result.error });
    }

    console.log('[PAYMENT] Payment applied successfully');
    res.json(result.operation);

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Update workflow status (for marking as picked up, delivered, etc.)
router.patch('/:id/workflow-status', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { workflow_status, picked_up_at, picked_up_by_name, picked_up_by_phone } = req.body;

    const validTransitions: Record<string, string[]> = {
      'pending': ['in_progress', 'cancelled'],
      'in_progress': ['ready', 'cancelled'],
      'ready': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    // Get current operation
    const operation = await db.get('SELECT workflow_status, created_by FROM operations WHERE id = $1', [id]);
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    // Role-based access control: staff can only update their own operations
    if (req.user.role === 'staff' && operation.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const currentStatus = operation.workflow_status || 'pending';

    // Validate transition
    if (!validTransitions[currentStatus]?.includes(workflow_status)) {
      return res.status(400).json({
        error: `Invalid transition from '${currentStatus}' to '${workflow_status}'`
      });
    }

    const now = new Date().toISOString();
    const updates: string[] = ['workflow_status = $1', 'updated_at = $2'];
    const values: any[] = [workflow_status, now];

    if (picked_up_at) {
      values.push(picked_up_at);
      updates.push(`picked_up_at = $${values.length}`);
    }

    if (picked_up_by_name) {
      values.push(picked_up_by_name);
      updates.push(`picked_up_by_name = $${values.length}`);
    }

    if (picked_up_by_phone) {
      values.push(picked_up_by_phone);
      updates.push(`picked_up_by_phone = $${values.length}`);
    }

    values.push(id);

    await db.run(
      `UPDATE operations SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    // Get updated operation with customer info
    const updatedOperation = await db.get(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `, [id]);

    res.json(transformOperation(updatedOperation));

  } catch (error) {
    console.error('Error updating workflow status:', error);
    res.status(500).json({ error: 'Failed to update workflow status' });
  }
});

export default router;
