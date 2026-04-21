import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import db from '../database';

const router = express.Router();

// Generate invoice number
function generateInvoiceNumber(type: 'invoice' | 'receipt'): string {
  const prefix = type === 'invoice' ? 'INV' : 'RCP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const getRetailItems = async (operationId: string) => {
  return db.prepare(`
    SELECT * FROM operation_retail_items
    WHERE operation_id = ?
    ORDER BY created_at ASC
  `).all(operationId);
};

// Get all invoices with filters
router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate, customer } = req.query;

    let query = `
      SELECT i.*, o.id as operation_id
      FROM invoices i
      LEFT JOIN operations o ON i.operation_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && type !== 'all') {
      query += ` AND i.type = ?`;
      params.push(type);
    }

    if (startDate) {
      query += ` AND DATE(i.created_at) >= DATE(?)`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(i.created_at) <= DATE(?)`;
      params.push(endDate);
    }

    if (customer) {
      query += ` AND i.customer_name LIKE ?`;
      params.push(`%${customer}%`);
    }

    query += ` ORDER BY i.created_at DESC`;

    const invoices = await db.prepare(query).all(...params);

    res.json(invoices.map((inv: any) => ({
      id: inv.id,
      operationId: inv.operation_id,
      type: inv.type,
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name,
      customerPhone: inv.customer_phone,
      subtotal: inv.subtotal,
      discount: inv.discount,
      total: inv.total,
      amountPaid: inv.amount_paid,
      paymentMethod: inv.payment_method,
      promisedDate: inv.promised_date,
      generatedBy: inv.generated_by,
      createdAt: inv.created_at
    })));
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await db.prepare(`
      SELECT * FROM invoices WHERE id = ?
    `).get(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const inv = invoice as any;

    // Get operation details
    const operation = await db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(inv.operation_id);

    // Get shoes and services
    const shoes = await db.prepare(`
      SELECT os.*, s.name as service_name, oss.price as service_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = ?
    `).all(inv.operation_id);
    const retailItems = await getRetailItems(inv.operation_id);

    // Get payments if receipt
    const payments = inv.type === 'receipt'
      ? await db.prepare(`SELECT * FROM operation_payments WHERE operation_id = ?`).all(inv.operation_id)
      : [];

    res.json({
      id: inv.id,
      operationId: inv.operation_id,
      type: inv.type,
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name,
      customerPhone: inv.customer_phone,
      subtotal: inv.subtotal,
      discount: inv.discount,
      total: inv.total,
      amountPaid: inv.amount_paid,
      paymentMethod: inv.payment_method,
      promisedDate: inv.promised_date,
      notes: inv.notes,
      generatedBy: inv.generated_by,
      createdAt: inv.created_at,
      operation: operation ? {
        id: (operation as any).id,
        status: (operation as any).status,
        notes: (operation as any).notes,
        isNoCharge: Boolean((operation as any).is_no_charge),
        isDoOver: Boolean((operation as any).is_do_over),
        isDelivery: Boolean((operation as any).is_delivery),
        isPickup: Boolean((operation as any).is_pickup)
      } : null,
      items: [
        ...shoes.map((shoe: any) => ({
          id: shoe.id,
          type: 'repair',
          category: shoe.category,
          color: shoe.color,
          colorDescription: shoe.color_description || '',
          notes: shoe.notes,
          serviceName: shoe.service_name,
          price: shoe.service_price
        })),
        ...retailItems.map((item: any) => ({
          id: item.id,
          type: 'retail',
          productId: item.product_id || null,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          price: item.total_price
        }))
      ],
      payments: payments.map((p: any) => ({
        id: p.id,
        method: p.payment_method,
        amount: p.amount,
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Generate invoice/receipt from operation
router.post('/', async (req, res) => {
  try {
    const { operationId, type, generatedBy } = req.body;

    if (!operationId) {
      return res.status(400).json({ error: 'Operation ID is required' });
    }

    // Get operation with customer
    const operation = await db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(operationId);

    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    const op = operation as any;

    // Determine type based on payment status if not specified
    let documentType = type;
    if (!documentType) {
      documentType = op.paid_amount >= op.total_amount ? 'receipt' : 'invoice';
    }

    // Check if invoice already exists for this operation
    const existing = await db.prepare(`
      SELECT id FROM invoices WHERE operation_id = ? AND type = ?
    `).get(operationId, documentType);

    if (existing) {
      return res.status(400).json({ error: `This ${documentType} already exists`, invoiceId: (existing as any).id });
    }

    const subtotal = (op.total_amount || 0) + (op.discount || 0);
    const total = op.total_amount;
    const discount = op.discount || 0;
    const amountPaid = op.paid_amount || 0;

    // Get payment method if any payments exist
    let paymentMethod = null;
    if (amountPaid > 0) {
      const lastPayment = await db.prepare(`
        SELECT payment_method FROM operation_payments WHERE operation_id = ? ORDER BY created_at DESC LIMIT 1
      `).get(operationId);
      paymentMethod = lastPayment ? (lastPayment as any).payment_method : null;
    }

    const invoiceId = uuidv4();
    const invoiceNumber = generateInvoiceNumber(documentType);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO invoices (
        id, operation_id, type, invoice_number, customer_name, customer_phone,
        subtotal, discount, total, amount_paid, payment_method, notes,
        promised_date, generated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId,
      operationId,
      documentType,
      invoiceNumber,
      op.customer_name,
      op.customer_phone,
      subtotal,
      discount,
      total,
      amountPaid,
      paymentMethod,
      op.notes,
      op.promised_date,
      generatedBy || null,
      now,
      now
    );

    const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    res.json(invoice);
  } catch (error) {
    console.error('Failed to generate invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Print invoice/receipt
router.post('/:id/print', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any;

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get operation details
    const operation = await db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.account_balance as customer_credit
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(invoice.operation_id) as any;

    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    // Get shoes and services
    const shoes = await db.prepare(`
      SELECT os.*, s.name as service_name, oss.price as service_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = ?
    `).all(invoice.operation_id);
    const retailItems = await getRetailItems(invoice.operation_id);

    // Get payments
    const payments = invoice.type === 'receipt'
      ? await db.prepare('SELECT * FROM operation_payments WHERE operation_id = ?').all(invoice.operation_id)
      : [];

    // Format currency helper
    const formatCurrency = (amount: number) => {
      return `UGX ${amount.toLocaleString()}`;
    };

    // ESC/POS command helpers
    const ESC = 0x1B;
    const GS = 0x1D;

    const cmd = {
      init: Buffer.from([ESC, 0x40]),
      alignCenter: Buffer.from([ESC, 0x61, 0x01]),
      alignLeft: Buffer.from([ESC, 0x61, 0x00]),
      boldOn: Buffer.from([ESC, 0x45, 0x01]),
      boldOff: Buffer.from([ESC, 0x45, 0x00]),
      normalSize: Buffer.from([ESC, 0x21, 0x00]),
      doubleSize: Buffer.from([ESC, 0x21, 0x11]),
      cut: Buffer.from([GS, 0x56, 0x00]),
      feed: Buffer.from([ESC, 0x64, 0x03]),
    };

    const text = (str: string) => Buffer.from(str + '\n', 'ascii');
    const line = (char: string, width: number = 48) => Buffer.from(char.repeat(width) + '\n', 'ascii');
    const padRight = (str: string, len: number) => str.padEnd(len).slice(0, len);
    const padLeft = (str: string, len: number) => str.padStart(len).slice(0, len);

    try {
      // Build print data
      const chunks: Buffer[] = [];

      // Initialize
      chunks.push(cmd.init);

      // Header
      chunks.push(cmd.alignCenter, cmd.boldOn, cmd.doubleSize);
      chunks.push(text(invoice.type === 'receipt' ? 'RECEIPT' : 'INVOICE'));
      chunks.push(cmd.boldOff, cmd.normalSize);
      chunks.push(text('SHOE REPAIR POS'));
      chunks.push(line('='));

      // Document info
      chunks.push(cmd.alignLeft);
      chunks.push(cmd.boldOn);
      chunks.push(text(`Doc #: ${invoice.invoice_number}`));
      chunks.push(cmd.boldOff);
      chunks.push(text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`));
      chunks.push(text(`Customer: ${invoice.customer_name}`));
      if (invoice.customer_phone) {
        chunks.push(text(`Phone: ${invoice.customer_phone}`));
      }
      chunks.push(line('-'));

      // Items header
      chunks.push(cmd.boldOn);
      chunks.push(text(invoice.type === 'receipt' ? 'PAYMENT RECEIVED' : 'SERVICES / PRODUCTS'));
      chunks.push(cmd.boldOff);
      chunks.push(text(''));

      // Print repair items
      if (shoes.length > 0) {
        for (const shoe of shoes) {
          chunks.push(text(`[${shoe.category}]`));
          if (shoe.color) chunks.push(text(`  Color: ${shoe.color}`));
          if (shoe.service_name) {
            const priceStr = formatCurrency(shoe.service_price);
            const lineStr = `${padRight(shoe.service_name, 30)}${padLeft(priceStr, 18)}`;
            chunks.push(text(lineStr));
          }
          chunks.push(text(''));
        }
      }

      // Print retail items
      if (retailItems.length > 0) {
        chunks.push(line('-'));
        for (const item of retailItems) {
          chunks.push(text(item.product_name));
          const priceStr = formatCurrency(item.total_price);
          const qtyStr = `  Qty: ${item.quantity} x ${formatCurrency(item.unit_price)}`;
          chunks.push(text(qtyStr));
          const totalLine = `${padRight('', 30)}${padLeft(priceStr, 18)}`;
          chunks.push(text(totalLine));
        }
        chunks.push(text(''));
      }

      // Totals
      chunks.push(line('='));
      chunks.push(text(`${padRight('Subtotal:', 30)}${padLeft(formatCurrency(invoice.subtotal), 18)}`));
      if (invoice.discount > 0) {
        chunks.push(text(`${padRight('Discount:', 30)}${padLeft('-' + formatCurrency(invoice.discount), 18)}`));
      }
      chunks.push(cmd.boldOn);
      chunks.push(text(`${padRight('TOTAL:', 30)}${padLeft(formatCurrency(invoice.total), 18)}`));
      chunks.push(cmd.boldOff);

      // Payment info for receipts
      if (invoice.type === 'receipt') {
        chunks.push(text(''));
        chunks.push(line('='));
        chunks.push(text('PAYMENT DETAILS'));
        chunks.push(text(`${padRight('Amount Paid:', 30)}${padLeft(formatCurrency(invoice.amount_paid), 18)}`));
        const balance = invoice.total - invoice.amount_paid;
        if (balance > 0) {
          chunks.push(text(`${padRight('Balance Due:', 30)}${padLeft(formatCurrency(balance), 18)}`));
        }
        // Show credit balance if available
        if (operation.customer_credit && operation.customer_credit > 0) {
          chunks.push(text(''));
          chunks.push(cmd.boldOn);
          chunks.push(text(`${padRight('Your Credit Balance:', 30)}${padLeft(formatCurrency(operation.customer_credit), 18)}`));
          chunks.push(cmd.boldOff);
        }
      }

      // Pickup date
      if (operation.promised_date) {
        chunks.push(text(''));
        chunks.push(cmd.alignCenter);
        chunks.push(text(`Pickup Date: ${new Date(operation.promised_date).toLocaleDateString()}`));
      }

      // Footer
      chunks.push(cmd.alignCenter);
      chunks.push(text(''));
      chunks.push(line('='));
      chunks.push(text('Thank you for your business!'));
      chunks.push(line('='));
      chunks.push(cmd.feed);
      chunks.push(cmd.cut);

      // Combine all buffers
      const printData = Buffer.concat(chunks);

      // Write to temp file and print via PowerShell
      const tempFile = path.join(os.tmpdir(), `receipt_${Date.now()}.bin`);
      fs.writeFileSync(tempFile, printData);

      // Use PowerShell to copy binary data to USB001
      const escapedTempFile = tempFile.replace(/\\/g, '\\\\');
      const psCommand = `[System.IO.File]::ReadAllBytes('${escapedTempFile}') | Set-Content -Path '\\\\.\\USB001' -Encoding Byte -PassThru | Out-Null; exit 0`;

      await new Promise<void>((resolve, reject) => {
        const ps = spawn('powershell', [
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy', 'Bypass',
          '-Command', psCommand
        ], { windowsHide: true });

        ps.on('close', (code) => {
          try { fs.unlinkSync(tempFile); } catch {}
          if (code === 0) {
            console.log('Print successful via USB001');
            resolve();
          } else {
            reject(new Error(`Print command exited with code ${code}`));
          }
        });
        ps.on('error', (err) => {
          try { fs.unlinkSync(tempFile); } catch {}
          reject(err);
        });
      });

      res.json({ success: true, message: 'Printed successfully' });
      return;
    } catch (error: any) {
      console.error('Print error:', error);
      return res.status(500).json({ error: `Print failed: ${error.message}` });
    }
  } catch (error: any) {
    console.error('Failed to print invoice:', error);
    res.status(500).json({ error: `Print failed: ${error.message}` });
  }
});

export default router;
