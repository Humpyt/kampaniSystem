import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './database';
import { allocateNextTicketNumber } from './helpers/tickets';
import { transformOperation } from './utils';

const router = express.Router();
const DEBUG_OPERATIONS = process.env.DEBUG_OPERATIONS === '1';

const mapRetailItem = (item: any) => ({
  id: item.id,
  productId: item.product_id || null,
  productName: item.product_name,
  unitPrice: item.unit_price,
  quantity: item.quantity,
  totalPrice: item.total_price,
});

const normalizeServiceKey = (value: string | null | undefined) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const findServiceByAlias = (servicesCache: Map<string, any>, serviceName: string) => {
  const normalizedName = normalizeServiceKey(serviceName);
  if (!normalizedName) {
    return null;
  }

  const aliasMap: Record<string, string[]> = {
    clean: ['deep cleaning', 'cleaning shoes'],
    dye: ['dyeing shoes', 'dyeing bags'],
    glue: ['gluing', 'gluing stitching'],
    stitch: ['shoe stitching', 'gluing stitching'],
    stretch: ['shoe size stretching'],
    heelfix: ['heel rescue'],
    'heel fix': ['heel rescue'],
    polish: ['polish service', 'shoe polishing', 'hand bag polishing'],
    shine: ['polish service', 'shoe polishing', 'hand bag polishing'],
    waterproof: ['shoe spraying'],
  };

  const aliasCandidates = aliasMap[normalizedName] || [];
  for (const candidate of aliasCandidates) {
    const match = servicesCache.get(normalizeServiceKey(candidate));
    if (match) {
      return match;
    }
  }

  for (const [key, value] of servicesCache.entries()) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return value;
    }
  }

  return null;
};

const resolvePaymentStatus = (paidAmount: number, totalAmount: number) => {
  if (paidAmount <= 0) {
    return 'unpaid';
  }
  if (paidAmount < totalAmount) {
    return 'partial';
  }
  if (paidAmount === totalAmount) {
    return 'paid';
  }
  return 'overpaid';
};

const getOrCreateServiceId = async (
  executor: any,
  servicesCache: Map<string, any>,
  service: any,
  now: string
) => {
  let resolvedServiceId = service.service_id;
  if (resolvedServiceId) {
    return resolvedServiceId;
  }

  const serviceName = String(service.service || '').trim();
  if (serviceName) {
    const normalizedName = normalizeServiceKey(serviceName);
    const directMatch = servicesCache.get(normalizedName);
    if (directMatch) {
      return directMatch.id;
    }

    const aliasMatch = findServiceByAlias(servicesCache, serviceName);
    if (aliasMatch) {
      return aliasMatch.id;
    }

    const existingService = await executor.prepare(`
      SELECT id, name
      FROM services
      WHERE LOWER(name) = LOWER(?)
      LIMIT 1
    `).get(serviceName);

    if (existingService?.id) {
      servicesCache.set(normalizedName, existingService);
      return existingService.id;
    }

    const customService = {
      id: uuidv4(),
      name: serviceName,
      price: Number(service.price) || 0,
      pricingMode: 'fixed',
      status: 'active',
    };

    await executor.prepare(`
      INSERT INTO services (
        id, name, price, pricing_mode, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      customService.id,
      customService.name,
      customService.price,
      customService.pricingMode,
      customService.status,
      now,
      now
    );

    servicesCache.set(normalizedName, customService);
    return customService.id;
  }

  return null;
};

const getRetailItemsByOperationIds = async (operationIds: string[], executor: any = db) => {
  const retailItemsMap = new Map<string, any[]>();

  if (operationIds.length === 0) {
    return retailItemsMap;
  }

  const placeholders = operationIds.map(() => '?').join(',');
  const retailItems = await executor.prepare(`
    SELECT * FROM operation_retail_items
    WHERE operation_id IN (${placeholders})
    ORDER BY created_at ASC
  `).all(...operationIds);

  for (const item of retailItems) {
    if (!retailItemsMap.has(item.operation_id)) {
      retailItemsMap.set(item.operation_id, []);
    }
    retailItemsMap.get(item.operation_id)!.push(mapRetailItem(item));
  }

  return retailItemsMap;
};

const getOperationWithDetails = async (operationId: string, executor: any = db) => {
  const operation = await executor.prepare(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, u.name as staff_name
    FROM operations o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN users u ON o.created_by = u.id
    WHERE o.id = ?
  `).get(operationId);

  if (!operation) {
    return null;
  }

  const shoes = await executor.prepare(`
    SELECT os.*, oss.price as service_price, oss.quantity as service_quantity, s.name as service_name, s.price as service_base_price
    FROM operation_shoes os
    LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
    LEFT JOIN services s ON oss.service_id = s.id
    WHERE os.operation_id = ?
  `).all(operationId);

  return {
    ...operation,
    shoes: shoes.map((shoe: any) => ({
      id: shoe.id,
      category: shoe.category,
      color: shoe.color,
      colorDescription: shoe.color_description || '',
      notes: shoe.notes,
      services: [{
        id: shoe.service_id,
        name: shoe.service_name,
        price: shoe.service_price ?? shoe.service_base_price,
        quantity: shoe.service_quantity || 1,
        basePrice: shoe.service_base_price
      }]
    })),
    retailItems: (await getRetailItemsByOperationIds([operationId], executor)).get(operationId) || []
  };
};

// Get all operations
router.get('/', async (req, res) => {
  try {
    const { created_by, status, limit = 1000, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 1000, 5000);
    const parsedOffset = parseInt(offset as string) || 0;

    let query = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, u.name as staff_name
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (created_by) {
      conditions.push(`o.created_by = ?`);
      params.push(created_by);
    }

    if (status) {
      conditions.push(`o.status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parsedLimit, parsedOffset);

    const countQuery = `SELECT COUNT(*) as total FROM operations o ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`;
    const countParams = conditions.length > 0 ? params.slice(0, -2) : [];
    const [operations, countResult] = await Promise.all([
      db.prepare(query).all(...params),
      db.prepare(countQuery).get(...countParams)
    ]);
    const total = Number(countResult?.total || 0);

    // Optimization: Fetch all shoes in a single query instead of N+1 queries
    const operationIds = operations.map((op: any) => op.id);
    let shoesMap: Map<string, any[]> = new Map();
    const placeholders = operationIds.map(() => '?').join(',');
    const retailItemsPromise = getRetailItemsByOperationIds(operationIds);
    const shoesPromise = operationIds.length > 0
      ? db.prepare(`
          SELECT os.*, oss.price as service_price, oss.quantity as service_quantity, s.name as service_name, s.price as service_base_price
          FROM operation_shoes os
          LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
          LEFT JOIN services s ON oss.service_id = s.id
          WHERE os.operation_id IN (${placeholders})
        `).all(...operationIds)
      : Promise.resolve([]);

    const [retailItemsMap, allShoes] = await Promise.all([retailItemsPromise, shoesPromise]);

    // Group shoes by operation_id
    for (const shoe of allShoes) {
      if (!shoesMap.has(shoe.operation_id)) {
        shoesMap.set(shoe.operation_id, []);
      }
      shoesMap.get(shoe.operation_id)!.push(shoe);
    }

    // Build operations with shoes
    const operationsWithShoes = operations.map((operation: any) => ({
      ...operation,
      shoes: (shoesMap.get(operation.id) || []).map((shoe: any) => ({
        id: shoe.id,
        category: shoe.category,
        color: shoe.color,
        colorDescription: shoe.color_description || '',
        notes: shoe.notes,
        services: [{
          id: shoe.service_id,
          name: shoe.service_name,
          price: shoe.service_price ?? shoe.service_base_price,
          quantity: shoe.service_quantity || 1,
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const operation = await getOperationWithDetails(id);
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
  if (DEBUG_OPERATIONS) {
    console.log('Received operation request:', JSON.stringify(req.body, null, 2));
  }
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
    ticket_number: clientTicketNumber,
  } = req.body;
  const now = new Date().toISOString();
  const normalizedShoes = Array.isArray(shoes) ? shoes : [];
  const normalizedRetailItems = Array.isArray(retailItems) ? retailItems : [];
  const finalTotalAmount = Number(totalAmount) || 0;
  const discountAmount = Number(discount) || 0;
  let generatedDocumentId: string | null = null;
  let customerRecord = customer;

  // Promise-based customer validation (db.get/db.run are promisified)
  const walkInId = 'w001';
  try {
    // Ensure walk-in customer exists
    const existingWalkIn = await (db.get as any)('SELECT id FROM customers WHERE id = ?', [walkInId]);
    if (!existingWalkIn) {
      await (db.run as any)(
        "INSERT INTO customers (id, name, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [walkInId, 'WALK-IN CUSTOMER', 'N/A', 'active', now, now]
      );
    }
    // Handle customer ID
    if (!customer || !customer.id || String(customer.id).trim() === '') {
      customerRecord = {
        ...customer,
        id: walkInId,
        name: customer?.name || 'WALK-IN CUSTOMER',
        phone: customer?.phone || 'N/A',
      };
    } else {
      const existingCustomer = await (db.get as any)('SELECT id FROM customers WHERE id = ?', [customer.id]);
      if (!existingCustomer) {
        try {
          await (db.run as any)(
            "INSERT INTO customers (id, name, phone, email, address, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [customer.id, (customer as any).name || 'Unknown', (customer as any).phone || 'N/A', (customer as any).email || null, (customer as any).address || null, 'active', now, now]
          );
        } catch (insertErr: any) {
          if (!String(insertErr).includes('UNIQUE')) throw insertErr;
        }
      }
      customerRecord = customer;
    }
  } catch (validationErr) {
    console.error('Customer validation error:', validationErr);
    if (!customer || !customer.id) {
      customerRecord = {
        ...customer,
        id: walkInId,
        name: customer?.name || 'WALK-IN CUSTOMER',
        phone: customer?.phone || 'N/A',
      };
    }
  }

  if (normalizedShoes.length === 0 && normalizedRetailItems.length === 0) {
    console.error('Invalid operation items:', { shoes, retailItems });
    return res.status(400).json({ error: 'At least one repair or retail item is required' });
  }

  try {
    const createdOperation = await db.withTransaction(async (tx: any) => {
      // Insert the operation
      const operationId = uuidv4();
      const ticketNumber = await allocateNextTicketNumber(tx);
      if (DEBUG_OPERATIONS) {
        console.log('Creating operation with ID:', operationId);
      }
      if (DEBUG_OPERATIONS && clientTicketNumber) {
        console.warn('Ignoring client-supplied ticket number during operation creation:', clientTicketNumber);
      }

      await tx.prepare(`
        INSERT INTO operations (
          id, customer_id, status, total_amount, discount, notes, promised_date,
          is_no_charge, is_do_over, is_delivery, is_pickup,
          ticket_number, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        operationId,
        customerRecord.id,
        status || 'pending',
        finalTotalAmount,
        discountAmount,
        notes || null,
        promisedDate || null,
        isNoCharge ? 1 : 0,
        isDoOver ? 1 : 0,
        isDelivery ? 1 : 0,
        isPickup ? 1 : 0,
        ticketNumber,
        created_by || null,
        now,
        now
      );

      // Load services cache for name-to-id lookup
      const allServices = await tx.prepare('SELECT id, name FROM services WHERE status = ?').all('active');
      const servicesCache = new Map();
      for (const svc of allServices) {
        const normalizedName = normalizeServiceKey(svc.name);
        servicesCache.set(normalizedName, svc);
        const firstWord = normalizedName.split(' ')[0];
        if (firstWord && firstWord !== normalizedName) {
          servicesCache.set(firstWord, svc);
        }
      }

      // Insert each shoe
      for (let index = 0; index < normalizedShoes.length; index++) {
        const shoe = normalizedShoes[index];
        if (DEBUG_OPERATIONS) {
          console.log(`Processing shoe ${index + 1}:`, JSON.stringify(shoe, null, 2));
        }
        const shoeId = uuidv4();

        await tx.prepare(`
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

        // Insert services for each shoe
        if (Array.isArray(shoe.services)) {
          for (let sIndex = 0; sIndex < shoe.services.length; sIndex++) {
            const service = shoe.services[sIndex];
            if (DEBUG_OPERATIONS) {
              console.log(`Processing service ${sIndex + 1} for shoe ${index + 1}:`, JSON.stringify(service, null, 2));
            }

            const resolvedServiceId = await getOrCreateServiceId(tx, servicesCache, service, now);
            if (!resolvedServiceId) {
              throw new Error(`Missing service_id for service ${sIndex + 1} of shoe ${index + 1}`);
            }

            await tx.prepare(`
              INSERT INTO operation_services (
                id, operation_shoe_id, service_id, quantity, price, notes,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              uuidv4(),
              shoeId,
              resolvedServiceId,
              service.quantity || 1,
              service.price || 0,
              service.notes || null,
              now,
              now
            );
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

        await tx.prepare(`
          INSERT INTO operation_retail_items (
            id, operation_id, product_id, product_name, unit_price, quantity, total_price, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(),
          operationId,
          item.productId || null,
          item.productName,
          unitPrice,
          quantity,
          totalPrice,
          now
        );
      }

      // Return the created operation with all related data
      const operation = await tx.prepare(`
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
      const operationShoes = await tx.prepare(`
        SELECT * FROM operation_shoes WHERE operation_id = ?
      `).all(operationId);
      const operationRetailItems = (await getRetailItemsByOperationIds([operationId], tx)).get(operationId) || [];

      // Get services for each shoe
      const shoesWithServices = [];
      for (const shoe of operationShoes) {
        const services = await tx.prepare(`
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
          services: services.map((s: any) => ({
            id: s.service_id,
            name: s.service_name,
            price: s.price,
            quantity: s.quantity,
            notes: s.notes
          }))
        });
      }

      // Update customer stats: increment total_orders and update last_visit
      await tx.prepare(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            last_visit = ?
        WHERE id = ?
      `).run(now, customerRecord.id);

      return {
        operation,
        operationId,
        operationRetailItems,
        shoesWithServices,
      };
    });

    // Auto-generate invoice since no payment was made yet
    try {
      const invoiceId = uuidv4();
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      await db.prepare(`
        INSERT INTO invoices (
          id, operation_id, type, invoice_number, customer_name, customer_phone,
          subtotal, discount, total, amount_paid, payment_method, notes,
          promised_date, generated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId, createdOperation.operationId, 'invoice', invoiceNumber,
        customerRecord?.name || 'WALK-IN CUSTOMER', customerRecord?.phone || '',
        finalTotalAmount + discountAmount, discountAmount, finalTotalAmount,
        0, null, notes || null, promisedDate || null, created_by || null, now, now
      );
      generatedDocumentId = invoiceId;
    } catch (err) {
      console.error('Failed to auto-generate invoice:', err);
    }

    res.json(transformOperation({
      ...createdOperation.operation,
      shoes: createdOperation.shoesWithServices,
      retailItems: createdOperation.operationRetailItems,
      isNoCharge: Boolean(createdOperation.operation.is_no_charge),
      isDoOver: Boolean(createdOperation.operation.is_do_over),
      isDelivery: Boolean(createdOperation.operation.is_delivery),
      isPickup: Boolean(createdOperation.operation.is_pickup),
      discount: createdOperation.operation.discount || 0,
      generatedDocumentId,
      generatedDocumentType: generatedDocumentId ? 'invoice' : null,
    }));
  } catch (error) {
    console.error('Error creating operation:', error);
    if ((error as any)?.code === '23505' && (error as any)?.constraint === 'operations_ticket_number_key') {
      return res.status(409).json({ error: 'Ticket number conflict. Please retry the operation.' });
    }
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

    const normalizedPayments = payments.map((payment: any) => ({
      ...payment,
      amount: Number(payment?.amount) || 0,
    }));

    if (normalizedPayments.some((payment: any) => payment.amount <= 0)) {
      return res.status(400).json({ error: 'Each payment amount must be greater than zero' });
    }

    const totalPaid = normalizedPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const now = new Date().toISOString();
    const paymentResult = await db.withTransaction(async (tx: any) => {
      const operation = await tx.get(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone
        FROM operations o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `, [id]);

      if (!operation) {
        throw new Error('Operation not found');
      }

      const currentPaidAmount = Number(operation.paid_amount) || 0;
      const totalAmount = Number(operation.total_amount) || 0;
      const discountAmount = Number(operation.discount) || 0;
      const newPaidAmount = currentPaidAmount + totalPaid;
      const paymentStatus = resolvePaymentStatus(newPaidAmount, totalAmount);

      for (const payment of normalizedPayments) {
        const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await tx.run(`
          INSERT INTO operation_payments (id, operation_id, payment_method, amount, transaction_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [paymentId, id, payment.method, payment.amount, payment.transaction_id || null, now]);
      }

      await tx.run(`
        UPDATE operations
        SET paid_amount = ?,
            payment_status = ?,
            status = CASE WHEN ? >= total_amount THEN 'completed' ELSE status END,
            updated_at = ?
        WHERE id = ?
      `, [newPaidAmount, paymentStatus, newPaidAmount, now, id]);

      await tx.prepare(`
        UPDATE customers
        SET total_spent = total_spent + ?,
            last_visit = ?
        WHERE id = ?
      `).run(totalPaid, now, operation.customer_id);

      const creditAmount = Math.round(totalPaid * 0.02);
      if (creditAmount > 0) {
        const customerId = operation.customer_id;
        const creditTransactionId = `credit_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentCustomer = await tx.get('SELECT account_balance FROM customers WHERE id = ?', [customerId]);
        const newCreditBalance = (Number(currentCustomer?.account_balance) || 0) + creditAmount;
        await tx.run(`
          INSERT INTO customer_credits (id, customer_id, amount, balance_after, type, description, created_by, created_at)
          VALUES (?, ?, ?, ?, 'credit', ?, ?, ?)
        `, [creditTransactionId, customerId, creditAmount, newCreditBalance, '2% transaction credit', null, now]);
        await tx.run('UPDATE customers SET account_balance = ? WHERE id = ?', [newCreditBalance, customerId]);
      }

      return {
        operation,
        newPaidAmount,
        totalAmount,
        discountAmount,
      };
    });

    let generatedDocumentId: string | null = null;
    let generatedDocumentType: 'invoice' | 'receipt' | null = null;
    const { operation, newPaidAmount, totalAmount, discountAmount } = paymentResult;

    // Auto-generate receipt if fully paid
    if (newPaidAmount >= totalAmount) {
      try {
        // Check if receipt already exists
        const existingReceipt = await db.get(
          'SELECT id FROM invoices WHERE operation_id = ? AND type = ?',
          [id, 'receipt']
        );
        if (!existingReceipt) {
          const invoiceId = uuidv4();
          const invoiceNumber = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
          await db.prepare(`
            INSERT INTO invoices (
              id, operation_id, type, invoice_number, customer_name, customer_phone,
              subtotal, discount, total, amount_paid, payment_method, notes,
              promised_date, generated_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            invoiceId, id, 'receipt', invoiceNumber,
            (operation as any).customer_name || '', (operation as any).customer_phone || '',
            totalAmount + discountAmount,
            discountAmount,
            totalAmount,
            newPaidAmount,
            normalizedPayments[0]?.method || null,
            (operation as any).notes,
            (operation as any).promised_date,
            null, now, now
          );
          generatedDocumentId = invoiceId;
        } else {
          generatedDocumentId = (existingReceipt as any).id;
        }
        generatedDocumentType = 'receipt';
      } catch (err) {
        console.error('Failed to auto-generate receipt:', err);
      }
    } else {
      const existingInvoice = await db.get(
        'SELECT id FROM invoices WHERE operation_id = ? AND type = ?',
        [id, 'invoice']
      );
      if (existingInvoice) {
        generatedDocumentId = (existingInvoice as any).id;
        generatedDocumentType = 'invoice';
      }
    }

    // Return updated operation
    const updatedOperation = await getOperationWithDetails(id);
    res.json(transformOperation({
      ...updatedOperation,
      generatedDocumentId,
      generatedDocumentType,
    }));

  } catch (error) {
    if ((error as any)?.message === 'Operation not found') {
      return res.status(404).json({ error: 'Operation not found' });
    }
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
