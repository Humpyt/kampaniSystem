import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import db from '../database';

const router = express.Router();

function generateInvoiceNumber(type: 'invoice' | 'receipt'): string {
  const prefix = type === 'invoice' ? 'INV' : 'RCP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const compact = (value: string | null | undefined) => String(value || '').replace(/\s+/g, ' ').trim();
const formatCurrency = (amount: number) => `UGX ${(Number(amount) || 0).toLocaleString('en-US')}`;
const limitText = (value: string, max = 80) =>
  value.length > max ? value.slice(0, max - 3).trimEnd() + '...' : value;

const getRetailItems = async (operationId: string) => {
  return db.prepare(`
    SELECT * FROM operation_retail_items
    WHERE operation_id = ?
    ORDER BY created_at ASC
  `).all(operationId);
};

const getReceiptStorageDir = () => path.join(process.cwd(), 'storage', 'receipts');

const getReceiptFileName = (invoice: any) => {
  const safeBase = String(invoice.invoice_number || invoice.id).replace(/[^a-zA-Z0-9._-]+/g, '_');
  return `${safeBase}.pdf`;
};

const getInvoiceById = async (id: string) =>
  db.prepare(`
    SELECT i.*, o.ticket_number
    FROM invoices i
    LEFT JOIN operations o ON i.operation_id = o.id
    WHERE i.id = ?
  `).get(id);

const getInvoiceContext = async (invoice: any) => {
  const operation = await db.prepare(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM operations o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(invoice.operation_id);

  const shoes = await db.prepare(`
    SELECT os.*, s.name as service_name, oss.price as service_price, oss.quantity as service_quantity
    FROM operation_shoes os
    LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
    LEFT JOIN services s ON oss.service_id = s.id
    WHERE os.operation_id = ?
    ORDER BY os.created_at ASC
  `).all(invoice.operation_id);

  const retailItems = await getRetailItems(invoice.operation_id);
  const payments = invoice.type === 'receipt'
    ? await db.prepare(`
        SELECT * FROM operation_payments
        WHERE operation_id = ?
        ORDER BY created_at ASC
      `).all(invoice.operation_id)
    : [];

  return { operation, shoes, retailItems, payments };
};

const generateReceiptPdfBuffer = async (invoice: any, context: any): Promise<Buffer> => {
  const PDFDocument = (await import('pdfkit')).default;
  const PW = 226.8;
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  const ticketNumber = compact(context.operation?.ticket_number || invoice.invoice_number || invoice.id);
  const customerName = compact(invoice.customer_name || context.operation?.customer_name || 'Walk-in Customer').toUpperCase();
  const customerPhone = compact(invoice.customer_phone || context.operation?.customer_phone || '');
  const createdDate = new Date(invoice.created_at || new Date().toISOString());
  const receiptDate = createdDate.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const receiptTime = createdDate.toLocaleTimeString('en-UG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemRows = [
    ...context.shoes.map((shoe: any) => {
      const itemLabel = [
        compact(shoe.category || 'Repair Item'),
        compact(shoe.color || ''),
      ].filter(Boolean).join(' | ');
      const serviceLabel = [
        compact(shoe.service_name || 'Service'),
        compact(shoe.notes || ''),
      ].filter(Boolean).join(' | ');
      return {
        line1: limitText(itemLabel || 'Repair Item', 36),
        line2: limitText(serviceLabel, 42),
        amount: Number(shoe.service_price) || 0,
      };
    }),
    ...context.retailItems.map((item: any) => ({
      line1: limitText(`Product | ${compact(item.product_name || 'Retail Item')}`, 36),
      line2: limitText(`Qty ${Number(item.quantity) || 1} | @ ${formatCurrency(Number(item.unit_price) || 0)}`, 42),
      amount: Number(item.total_price) || 0,
    })),
  ];

  const pageHeight =
    220 +
    itemRows.reduce((sum, row) => sum + (row.line2 ? 32 : 24), 0) +
    (context.payments.length > 0 ? 20 + context.payments.length * 12 : 0);

  const doc = new PDFDocument({ margin: 0, size: [PW, Math.max(pageHeight, 320)] });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const rule = (y: number) => {
    doc.moveTo(ML, y).lineTo(PW - MR, y).strokeColor('#000000').lineWidth(0.8).stroke();
  };

  let y = 14;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000');
  doc.text('KAMPANIS SHOES & BAGS CLINIC', ML, y, { align: 'center', width: CW });
  y += 13;
  doc.font('Helvetica').fontSize(7);
  doc.text('Forest Mall, Kampala', ML, y, { align: 'center', width: CW });
  y += 9;
  doc.text('+256 789 183784', ML, y, { align: 'center', width: CW });
  y += 14;

  doc.roundedRect(ML + 36, y, CW - 72, 16, 3).lineWidth(1).strokeColor('#000000').stroke();
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('RECEIPT PDF ARCHIVE', ML + 36, y + 5, { align: 'center', width: CW - 72 });
  y += 24;

  doc.font('Helvetica-Bold').fontSize(15);
  doc.text(ticketNumber, ML, y, { align: 'center', width: CW });
  y += 18;
  rule(y);
  y += 8;

  const metaPairs: Array<[string, string]> = [
    ['Receipt #', compact(invoice.invoice_number)],
    ['Customer', customerName],
    ['Phone', customerPhone || '-'],
    ['Date', `${receiptDate} ${receiptTime}`],
  ];

  for (const [label, value] of metaPairs) {
    doc.font('Helvetica-Bold').fontSize(7.2);
    doc.text(label.toUpperCase(), ML, y, { width: 58 });
    doc.font('Helvetica').fontSize(7.2);
    doc.text(value, ML + 60, y, { width: CW - 60 });
    y += 12;
  }

  y += 2;
  rule(y);
  y += 8;

  doc.rect(ML, y, CW, 14).fill('#000000');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.2);
  doc.text('ITEM DETAILS', ML + 4, y + 4, { width: 128 });
  doc.text('AMOUNT', ML + 138, y + 4, { width: 52, align: 'right' });
  y += 18;

  for (const row of itemRows) {
    const rowHeight = row.line2 ? 30 : 22;
    doc.roundedRect(ML, y, CW, rowHeight, 2).lineWidth(0.8).strokeColor('#000000').stroke();
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.8);
    doc.text(row.line1, ML + 6, y + 5, { width: 124 });
    if (row.line2) {
      doc.font('Helvetica').fontSize(6.6);
      doc.text(row.line2, ML + 6, y + 15, { width: 124 });
    }
    doc.font('Helvetica-Bold').fontSize(7.8);
    doc.text(formatCurrency(row.amount), ML + 138, y + 10, { width: 52, align: 'right' });
    y += rowHeight + 4;
  }

  rule(y);
  y += 8;
  doc.font('Helvetica').fontSize(7.4);
  doc.text('SUBTOTAL', ML, y, { width: 80 });
  doc.text(formatCurrency(Number(invoice.subtotal) || 0), ML + 82, y, { width: CW - 82, align: 'right' });
  y += 10;
  if (Number(invoice.discount) > 0) {
    doc.text('DISCOUNT', ML, y, { width: 80 });
    doc.text(`-${formatCurrency(Number(invoice.discount) || 0)}`, ML + 82, y, { width: CW - 82, align: 'right' });
    y += 10;
  }
  doc.font('Helvetica-Bold').fontSize(9.2);
  doc.text('TOTAL', ML, y, { width: 80 });
  doc.text(formatCurrency(Number(invoice.total) || 0), ML + 82, y, { width: CW - 82, align: 'right' });
  y += 13;
  doc.font('Helvetica').fontSize(7.4);
  doc.text('AMOUNT PAID', ML, y, { width: 80 });
  doc.text(formatCurrency(Number(invoice.amount_paid) || 0), ML + 82, y, { width: CW - 82, align: 'right' });
  y += 10;
  const balance = Math.max(0, (Number(invoice.total) || 0) - (Number(invoice.amount_paid) || 0));
  if (balance > 0) {
    doc.text('BALANCE', ML, y, { width: 80 });
    doc.text(formatCurrency(balance), ML + 82, y, { width: CW - 82, align: 'right' });
    y += 10;
  }

  if (context.payments.length > 0) {
    y += 2;
    rule(y);
    y += 7;
    doc.font('Helvetica-Bold').fontSize(7.2);
    doc.text('PAYMENT BREAKDOWN', ML, y, { width: CW });
    y += 10;
    for (const payment of context.payments) {
      doc.font('Helvetica').fontSize(7);
      doc.text(compact(String(payment.payment_method || payment.method || 'Payment')).replace(/_/g, ' ').toUpperCase(), ML, y, { width: 90 });
      doc.text(formatCurrency(Number(payment.amount) || 0), ML + 92, y, { width: CW - 92, align: 'right' });
      y += 10;
    }
  }

  y += 6;
  rule(y);
  y += 8;
  doc.font('Helvetica').fontSize(6.8);
  doc.text('Stored in the Kampanis receipts archive.', ML, y, { align: 'center', width: CW });
  y += 8;
  doc.text('Pickup after 30 days may attract storage fees.', ML, y, { align: 'center', width: CW });

  await new Promise<void>((resolve) => {
    doc.on('end', resolve);
    doc.end();
  });

  return Buffer.concat(chunks);
};

const ensureReceiptPdf = async (invoice: any, context?: any) => {
  if (invoice.type !== 'receipt') {
    return null;
  }

  const storageDir = getReceiptStorageDir();
  fs.mkdirSync(storageDir, { recursive: true });

  const fileName = getReceiptFileName(invoice);
  const filePath = path.join(storageDir, fileName);

  if (!fs.existsSync(filePath)) {
    const invoiceContext = context || await getInvoiceContext(invoice);
    const pdfBuffer = await generateReceiptPdfBuffer(invoice, invoiceContext);
    fs.writeFileSync(filePath, pdfBuffer);
  }

  const stats = fs.statSync(filePath);
  return {
    fileName,
    filePath,
    pdfUrl: `/api/invoices/${invoice.id}/pdf`,
    downloadUrl: `/api/invoices/${invoice.id}/pdf?download=1`,
    pdfStoredAt: stats.mtime.toISOString(),
  };
};

router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate, customer } = req.query;

    let query = `
      SELECT i.*, o.id as operation_id, o.ticket_number
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

    const results = await Promise.all(
      invoices.map(async (inv: any) => {
        const pdfMeta = inv.type === 'receipt' ? await ensureReceiptPdf(inv) : null;
        return {
          id: inv.id,
          operationId: inv.operation_id,
          ticketNumber: inv.ticket_number || null,
          type: inv.type,
          invoiceNumber: inv.invoice_number,
          customerName: inv.customer_name,
          customerPhone: inv.customer_phone,
          subtotal: Number(inv.subtotal) || 0,
          discount: Number(inv.discount) || 0,
          total: Number(inv.total) || 0,
          amountPaid: Number(inv.amount_paid) || 0,
          paymentMethod: inv.payment_method,
          promisedDate: inv.promised_date,
          generatedBy: inv.generated_by,
          createdAt: inv.created_at,
          pdfFileName: pdfMeta?.fileName || null,
          pdfUrl: pdfMeta?.pdfUrl || null,
          downloadUrl: pdfMeta?.downloadUrl || null,
          pdfStoredAt: pdfMeta?.pdfStoredAt || null,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const context = await getInvoiceContext(invoice);
    const pdfMeta = invoice.type === 'receipt' ? await ensureReceiptPdf(invoice, context) : null;

    res.json({
      id: invoice.id,
      operationId: invoice.operation_id,
      ticketNumber: invoice.ticket_number || null,
      type: invoice.type,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone,
      subtotal: Number(invoice.subtotal) || 0,
      discount: Number(invoice.discount) || 0,
      total: Number(invoice.total) || 0,
      amountPaid: Number(invoice.amount_paid) || 0,
      paymentMethod: invoice.payment_method,
      promisedDate: invoice.promised_date,
      notes: invoice.notes,
      generatedBy: invoice.generated_by,
      createdAt: invoice.created_at,
      items: [
        ...context.shoes.map((shoe: any) => ({
          id: shoe.id,
          type: 'repair',
          category: shoe.category,
          color: shoe.color,
          colorDescription: shoe.color_description || '',
          notes: shoe.notes,
          serviceName: shoe.service_name,
          price: Number(shoe.service_price) || 0,
          quantity: Number(shoe.service_quantity) || 1,
        })),
        ...context.retailItems.map((item: any) => ({
          id: item.id,
          type: 'retail',
          productId: item.product_id || null,
          productName: item.product_name,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unit_price) || 0,
          price: Number(item.total_price) || 0,
        })),
      ],
      payments: context.payments.map((payment: any) => ({
        id: payment.id,
        method: payment.payment_method,
        amount: Number(payment.amount) || 0,
        createdAt: payment.created_at,
      })),
      pdfFileName: pdfMeta?.fileName || null,
      pdfUrl: pdfMeta?.pdfUrl || null,
      downloadUrl: pdfMeta?.downloadUrl || null,
      pdfStoredAt: pdfMeta?.pdfStoredAt || null,
    });
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (invoice.type !== 'receipt') {
      return res.status(400).json({ error: 'Only receipt PDFs are stored in this archive' });
    }

    const pdfMeta = await ensureReceiptPdf(invoice);
    if (!pdfMeta) {
      return res.status(500).json({ error: 'Failed to prepare receipt PDF' });
    }

    const disposition = req.query.download ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${pdfMeta.fileName}"`);
    res.sendFile(pdfMeta.filePath);
  } catch (error) {
    console.error('Failed to load receipt PDF:', error);
    res.status(500).json({ error: 'Failed to load receipt PDF' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { operationId, type, generatedBy } = req.body;

    if (!operationId) {
      return res.status(400).json({ error: 'Operation ID is required' });
    }

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
    let documentType = type;
    if (!documentType) {
      documentType = Number(op.paid_amount) >= Number(op.total_amount) ? 'receipt' : 'invoice';
    }

    const existing = await db.prepare(`
      SELECT id FROM invoices WHERE operation_id = ? AND type = ?
    `).get(operationId, documentType);

    if (existing) {
      return res.status(400).json({ error: `This ${documentType} already exists`, invoiceId: (existing as any).id });
    }

    const subtotal = (Number(op.total_amount) || 0) + (Number(op.discount) || 0);
    const total = Number(op.total_amount) || 0;
    const discount = Number(op.discount) || 0;
    const amountPaid = Number(op.paid_amount) || 0;

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

    const invoice = await getInvoiceById(invoiceId);
    const pdfMeta = invoice && invoice.type === 'receipt' ? await ensureReceiptPdf(invoice) : null;

    res.json({
      ...(invoice as any),
      pdfFileName: pdfMeta?.fileName || null,
      pdfUrl: pdfMeta?.pdfUrl || null,
      downloadUrl: pdfMeta?.downloadUrl || null,
      pdfStoredAt: pdfMeta?.pdfStoredAt || null,
    });
  } catch (error) {
    console.error('Failed to generate invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

router.post('/:id/print', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (invoice.type !== 'receipt') {
      return res.status(400).json({ error: 'Only receipt PDFs are stored in this archive' });
    }

    const pdfMeta = await ensureReceiptPdf(invoice);
    res.json({
      success: true,
      stored: true,
      pdfUrl: pdfMeta?.pdfUrl || null,
      downloadUrl: pdfMeta?.downloadUrl || null,
    });
  } catch (error: any) {
    console.error('Failed to prepare receipt PDF:', error);
    res.status(500).json({ error: error.message || 'Failed to prepare receipt PDF' });
  }
});

export default router;
