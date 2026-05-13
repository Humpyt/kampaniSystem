import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { formatCurrency } from '../utils/formatCurrency';

const router = express.Router();

// Store printer configuration in memory
let printerConfig = {
  type: 'EPSON',
  interface: 'printer:auto',
  characterSet: 'PC437_USA',
  removeSpecialCharacters: false,
  options: { timeout: 5000 },
  width: 42
};

// Lazily load printer modules
let _printerMod: any = null;
let _escposMod: any = null;

async function loadPrinterModules() {
  if (!_printerMod) {
    try { _printerMod = await import('node-thermal-printer'); }
    catch (err: any) { console.warn('node-thermal-printer unavailable:', err.message); }
  }
  if (!_escposMod) {
    try { _escposMod = await import('escpos-usb'); }
    catch (err: any) { console.warn('escpos-usb unavailable:', err.message); }
  }
  return {
    printerModule: _printerMod ?? { ThermalPrinter: null },
    escposModule: _escposMod ?? { USB: null },
  };
}

import bwipjs from 'bwip-js';

const compact = (value: string | null | undefined) => String(value || '').replace(/\s+/g, ' ').trim();

const joinSegments = (segments: Array<string | null | undefined>, separator = ' | ') =>
  segments.map(compact).filter(Boolean).join(separator);

const limitText = (value: string, max = 80) =>
  value.length > max ? value.slice(0, max - 3).trimEnd() + '...' : value;

const BRAND = {
  ink: '#000000',
  muted: '#000000',
  line: '#000000',
};

const STORE_INFO = {
  brand: 'KAMPANI',
  fullName: '',
  tagline: '',
  location: 'FORESTMALL LUGOGO GF06',
  phone: 'Mob: 0789 183 784 | 0704 830 016',
  footerLine1: 'Thank you for your business.',
  footerLine2: 'Items not collected after 30 days attract storage fees.',
  footerLine3: 'After 60 days, uncollected items may be disposed of.',
};

const RECEIPT_BRAND_IMAGE_CANDIDATES = [
  path.join(process.cwd(), 'public', 'kampani-receipt-logo.png'),
  path.join(process.cwd(), 'public', 'receipt-branding.png'),
  path.join(process.cwd(), 'public', 'ChatGPT Image Apr 23, 2026, 01_14_31 PM.png'),
];

function resolveReceiptBrandImage(): string | null {
  for (const candidate of RECEIPT_BRAND_IMAGE_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function generateReceiptArchiveNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

async function generateBarcodeDataUri(text: string): Promise<string | null> {
  const value = compact(text);
  if (!value) {
    return null;
  }

  const buffer = await bwipjs.toBuffer({
    bcid: 'code128',
    text: value,
    scale: 2,
    height: 10,
    includetext: true,
    textxalign: 'center',
    textsize: 9,
    backgroundcolor: 0xffffff,
  });

  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function getReceiptArchiveStorageDir(): string {
  return path.join(process.cwd(), 'storage', 'receipts');
}

function getReceiptArchiveFileName(invoiceNumber: string, invoiceId: string): string {
  const safeBase = String(invoiceNumber || invoiceId).replace(/[^a-zA-Z0-9._-]+/g, '_');
  return `${safeBase}.pdf`;
}

async function archiveIssuedReceipt(params: {
  operationId?: string | null;
  ticketNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal?: number;
  total?: number;
  amountPaid?: number;
  paymentMethod?: string | null;
  notes?: string | null;
  generatedAt?: string;
  pdfBuffer: Buffer;
}): Promise<string | null> {
  const reference = compact(params.operationId || params.ticketNumber);
  if (!reference) {
    return null;
  }

  const operation = params.operationId
    ? await db.get(`
        SELECT o.id, o.ticket_number, o.notes, o.promised_date, c.name AS customer_name, c.phone AS customer_phone
        FROM operations o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = $1
      `, [params.operationId])
    : await db.get(`
        SELECT o.id, o.ticket_number, o.notes, o.promised_date, c.name AS customer_name, c.phone AS customer_phone
        FROM operations o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.ticket_number = $1
      `, [reference]);

  if (!operation?.id) {
    return null;
  }

  const subtotal = Number(params.subtotal) || Number(params.total) || 0;
  const total = Number(params.total) || subtotal;
  const amountPaid = Number(params.amountPaid) || 0;
  const discount = Math.max(0, subtotal - total);
  const invoiceId = uuidv4();
  const invoiceNumber = generateReceiptArchiveNumber();
  const createdAt = params.generatedAt || new Date().toISOString();

  await db.prepare(`
    INSERT INTO invoices (
      id, operation_id, type, invoice_number, customer_name, customer_phone,
      subtotal, discount, total, amount_paid, payment_method, notes,
      promised_date, generated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoiceId,
    operation.id,
    'receipt',
    invoiceNumber,
    compact(params.customerName || operation.customer_name || 'Walk-in Customer'),
    compact(params.customerPhone || operation.customer_phone || ''),
    subtotal,
    discount,
    total,
    amountPaid,
    compact(params.paymentMethod || ''),
    compact(params.notes || operation.notes || ''),
    operation.promised_date || null,
    null,
    createdAt,
    createdAt
  );

  const storageDir = getReceiptArchiveStorageDir();
  fs.mkdirSync(storageDir, { recursive: true });
  const fileName = getReceiptArchiveFileName(invoiceNumber, invoiceId);
  const filePath = path.join(storageDir, fileName);
  fs.writeFileSync(filePath, params.pdfBuffer);

  return invoiceId;
}

async function generateReceiptPDF(data: {
  title?: string;
  ticketId?: string;
  ticketNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerAccount?: string;
  date?: string;
  time?: string;
  promisedDate?: string;
  promisedTime?: string;
  items: { description: string; price: number; quantity?: number }[];
  subtotal: number;
  discount?: number;
  total: number;
  amountPaid?: number;
  balance?: number;
  paymentMethod?: string;
  tax?: number;
  notes?: string;
  showBrandImage?: boolean;
  servedBy?: string;
}): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  const PW = 226.8;
  const ML = 4;
  const MR = 4;
  const CW = PW - ML - MR;
  const fmt = (n: number) => (n || 0).toLocaleString('en-US');
  const fmtUGX = (n: number) => 'UGX ' + fmt(n);
  const recNo = data.ticketNumber || data.ticketId || '';
  const receiptTitle = compact(data.title || 'Receipt').toUpperCase();
  const cname = (data.customerName || 'WALK-IN CUSTOMER').toUpperCase();
  const cphone = compact(data.customerPhone || 'N/A');
  const caddr = compact(data.customerAddress || '');
  const cacct = compact(data.customerAccount || '');
  const dateStr = compact(data.date || '');
  const timeStr = compact(data.time || '');
  const readyText = compact([data.promisedDate, data.promisedTime].filter(Boolean).join(' '));
  const servedBy = compact(data.servedBy || '');
  const totalQty = data.items.reduce((s, i) => s + (i.quantity || 1), 0);
  const brandImagePath = data.showBrandImage === false ? null : resolveReceiptBrandImage();
  const itemsForLayout = data.items.map(item => {
    const qty = item.quantity || 1;
    const amount = item.price * qty;
    const [mainLine, ...rest] = String(item.description || 'Service').split('\n');
    const detailLine = rest.join(' | ');
    return {
      qty,
      amount,
      line1: limitText(compact(mainLine || 'Service'), 30),
      line2: limitText(compact(detailLine || ''), 38),
    };
  });

  const totalRows: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: 'Subtotal', value: fmtUGX(data.subtotal) },
  ];
  const discountAmount = Math.max(
    0,
    Number(data.discount) || (Number(data.subtotal) - Number(data.total))
  );
  if (discountAmount > 0) {
    totalRows.push({ label: 'Discount', value: '-' + fmtUGX(discountAmount) });
  }
  if (data.tax) {
    totalRows.push({ label: 'Tax', value: fmtUGX(data.tax) });
  }
  totalRows.push({ label: 'Total', value: fmtUGX(data.total), strong: true });
  if (data.amountPaid !== undefined) {
    totalRows.push({ label: 'Paid', value: fmtUGX(data.amountPaid) });
    if (data.balance !== undefined && data.balance !== 0) {
      totalRows.push({
        label: data.balance > 0 ? 'Balance' : 'Change',
        value: fmtUGX(Math.abs(data.balance)),
        strong: true,
      });
    }
  }

  const itemHeights = itemsForLayout.map(item => (item.line2 ? 44 : 32));
  const metaRowCount = 2 + (data.paymentMethod ? 1 : 0) + (cacct ? 1 : 0) + (readyText ? 1 : 0) + (caddr ? 1 : 0);
  const metaHeight = 18 + metaRowCount * 16;
  const totalsHeight = 16 + totalRows.length * 14;
  const notesHeight = data.notes ? 30 : 0;
  const footerHeight = 42;
  const barcodeHeight = recNo ? 58 : 0;
  const pageHeight =
    18 +
    (brandImagePath ? 84 : 42) +
    30 +
    26 +
    metaHeight +
    20 +
    itemHeights.reduce((sum, height) => sum + height, 0) +
    8 +
    totalsHeight +
    notesHeight +
    footerHeight +
    barcodeHeight +
    18;

  const doc = new PDFDocument({ margin: 0, size: [PW, Math.max(pageHeight, 260)], layout: 'portrait' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const rule = (y: number, color = '#000000') => {
    doc.moveTo(ML, y).lineTo(PW - MR, y).strokeColor(color).lineWidth(0.8).stroke();
  };

  let y = 6;

  if (brandImagePath) {
    doc.image(brandImagePath, ML + CW / 2 - 28, y, { fit: [56, 56], align: 'center', valign: 'center' });
    y += 60;
  }

  if (!brandImagePath && STORE_INFO.fullName) {
    doc.fillColor(BRAND.ink).font('Helvetica-Bold').fontSize(13.5);
    const fullNameHeight = doc.heightOfString(STORE_INFO.fullName, { align: 'center', width: CW });
    doc.text(STORE_INFO.fullName, ML, y, { align: 'center', width: CW });
    y += Math.max(16, fullNameHeight + 2);
  }
  doc.font('Helvetica-Bold').fontSize(8.8);
  const locationHeight = doc.heightOfString(STORE_INFO.location, { align: 'center', width: CW });
  doc.text(STORE_INFO.location, ML, y, { align: 'center', width: CW });
  y += Math.max(10, locationHeight + 2);
  const phoneHeight = doc.heightOfString(STORE_INFO.phone, { align: 'center', width: CW });
  doc.text(STORE_INFO.phone, ML, y, { align: 'center', width: CW });
  y += Math.max(12, phoneHeight + 2);

  doc.roundedRect(ML + 28, y, CW - 56, 18, 3).lineWidth(1.1).strokeColor(BRAND.ink).stroke();
  doc.fillColor(BRAND.ink).font('Helvetica-Bold').fontSize(9.3);
  doc.text(receiptTitle, ML + 28, y + 5, { align: 'center', width: CW - 56 });
  y += 26;

  doc.font('Helvetica-Bold').fontSize(17);
  doc.text(recNo, ML, y, { align: 'center', width: CW });
  y += 20;
  rule(y);
  y += 8;

  const metaPairs: Array<[string, string]> = [
    ['Customer', cname],
    ['Phone', cphone],
    ['Date', [dateStr, timeStr].filter(Boolean).join(' ') || '-'],
    ['Pieces', String(totalQty || 0)],
  ];
  if (data.paymentMethod) metaPairs.push(['Payment', data.paymentMethod]);
  if (cacct) metaPairs.push(['Account', cacct]);
  if (readyText) metaPairs.push(['Ready', readyText]);
  if (caddr) metaPairs.push(['Address', limitText(caddr, 54)]);
  for (const [label, value] of metaPairs) {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BRAND.ink);
    doc.text(label.toUpperCase(), ML, y, { width: 58 });
    doc.text(value || '-', ML + 60, y, { width: CW - 60 });
    y += 15;
  }

  y += 2;
  rule(y);
  y += 8;

  doc.rect(ML, y, CW, 16).fill(BRAND.ink);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
  doc.text('QTY', ML + 4, y + 4, { width: 22 });
  doc.text('ITEM DETAILS', ML + 30, y + 4, { width: 124 });
  doc.text('AMOUNT', ML + 156, y + 4, { width: CW - 160, align: 'right' });
  y += 20;

  for (const item of itemsForLayout) {
    doc.font('Helvetica-Bold').fontSize(9.2).fillColor(BRAND.ink);
    doc.text(String(item.qty), ML + 5, y + 5, { width: 18, align: 'center' });
    doc.text(item.line1, ML + 30, y + 3, { width: 122 });
    if (item.line2) {
      doc.font('Helvetica-Bold').fontSize(7.8);
      doc.text(item.line2, ML + 30, y + 16, { width: 122 });
    }
    doc.font('Helvetica-Bold').fontSize(8.6);
    doc.text(fmtUGX(item.amount), ML + 156, y + 8, { width: CW - 160, align: 'right' });
    y += item.line2 ? 34 : 24;
  }

  y += 2;
  rule(y);
  y += 8;

  for (const row of totalRows) {
    doc.font('Helvetica-Bold').fontSize(row.strong ? 10.5 : 8.8).fillColor(BRAND.ink);
    doc.text(row.label.toUpperCase(), ML, y, { width: 80 });
    doc.text(row.value, ML + 82, y, { width: CW - 82, align: 'right' });
    y += row.strong ? 15 : 12;
  }

  if (data.notes) {
    y += 2;
    rule(y);
    y += 7;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BRAND.ink);
    doc.text('NOTES', ML, y, { width: CW });
    y += 10;
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text(limitText(compact(data.notes), 110), ML, y, { width: CW });
    y += 18;
  }

  rule(y);
  y += 8;

  // Pickup date - prominent display
  if (readyText) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.ink);
    doc.text('PICKUP DATE', ML, y, { align: 'center', width: CW });
    y += 12;
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(readyText, ML, y, { align: 'center', width: CW });
    y += 10;
  }

  // Thank you
  doc.font('Helvetica-Bold').fontSize(7.8).fillColor(BRAND.ink);
  doc.text('Thank you for your business.', ML, y, { align: 'center', width: CW });
  y += 10;

  // Served by
  if (servedBy) {
    doc.font('Helvetica').fontSize(7.5).fillColor(BRAND.ink);
    doc.text('Served by: ' + servedBy, ML, y, { align: 'center', width: CW });
    y += 10;
  }

  y += 2;
  doc.font('Helvetica-Bold').fontSize(7.8).fillColor(BRAND.ink);
  doc.text(STORE_INFO.footerLine2, ML, y, { align: 'center', width: CW });
  y += 10;
  doc.text(STORE_INFO.footerLine3, ML, y, { align: 'center', width: CW });
  y += 12;

  if (recNo) {
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: recNo,
      scale: 2,
      height: 9,
      includetext: true,
      textxalign: 'center',
      textsize: 8,
      backgroundcolor: 0xffffff,
    });
    doc.image(barcodeBuffer, ML + CW / 2 - 56, y, { width: 112 });
    y += 46;
  }

  await new Promise<void>((resolve) => { doc.on('end', resolve); doc.end(); });
  return Buffer.concat(chunks);
}

function escapeHtml(value: string | null | undefined): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function generateOrderPrintHtml(data: {
  orderId: string;
  ticketNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerAccount?: string;
  createdAt: string;
  promisedDate?: string;
  items: Array<{ description: string; price: number; quantity?: number }>;
  subtotal: number;
  discount?: number;
  total: number;
  paidAmount?: number;
  notes?: string;
  autoPrint?: boolean;
  servedBy?: string;
}): Promise<string> {
  const createdAt = new Date(data.createdAt);
  const createdLabel = createdAt.toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const promisedLabel = data.promisedDate
    ? new Date(data.promisedDate).toLocaleString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const paidAmount = Number(data.paidAmount) || 0;
  const discountAmount = Math.max(0, Number(data.discount) || (Number(data.subtotal) - Number(data.total)));
  const balance = Math.max(0, (Number(data.total) || 0) - paidAmount);
  const servedBy = data.servedBy || '';
  const barcodeDataUri = await generateBarcodeDataUri(data.ticketNumber || data.orderId);
  const itemRows = data.items.length > 0
    ? data.items.map((item) => {
        const [mainLine, ...rest] = String(item.description || '').split('\n');
        const detailLine = rest.join(' | ');
        return `
          <div class="line-item">
            <div class="item-desc">
              <div class="item-main">${escapeHtml(mainLine)}</div>
              ${detailLine ? `<div class="item-sub">${escapeHtml(detailLine)}</div>` : ''}
            </div>
            <div class="item-amount">${escapeHtml(formatCurrency(item.price || 0))}</div>
          </div>
        `;
      }).join('')
    : `
        <div class="line-item">
          <div class="item-desc">
            <div class="item-main">No line items</div>
          </div>
          <div class="item-amount">${escapeHtml(formatCurrency(0))}</div>
        </div>
      `;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order ${escapeHtml(data.ticketNumber)}</title>
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #000000;
        font-family: "Segoe UI", Arial, sans-serif;
      }
      body { padding: 6pt 4pt 4pt; }
      .receipt {
        width: 80mm;
        margin: 0 auto;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.32;
      }
      .center { text-align: center; }
      .brand-logo {
        display: block;
        width: 44mm;
        max-width: 100%;
        height: auto;
        margin: 0 auto 6px;
      }
      .subtle {
        font-size: 12px;
        font-weight: 700;
        color: #000000;
      }
      .title {
        border: 2px solid #000000;
        text-align: center;
        font-weight: 700;
        padding: 7px 8px;
        margin: 10px 18px;
      }
      .ticket {
        font-size: 21px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 8px;
      }
      .divider {
        border-top: 1px dashed #000000;
        margin: 10px 0;
      }
      .meta-row,
      .line-item,
      .total-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .meta-row { margin-bottom: 4px; }
      .meta-label {
        width: 82px;
        text-transform: uppercase;
        font-weight: 700;
        font-size: 11px;
      }
      .meta-value {
        flex: 1;
        text-align: right;
        font-weight: 700;
      }
      .table-head {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        border-top: 1px solid #000000;
        border-bottom: 1px solid #000000;
        padding: 5px 0;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .items { margin-top: 6px; }
      .line-item { margin-bottom: 8px; }
      .item-desc { flex: 1; }
      .item-main { font-weight: 600; }
      .item-sub { font-size: 11px; color: #000000; font-weight: 700; margin-top: 2px; }
      .item-amount { min-width: 78px; text-align: right; white-space: nowrap; }
      .total-row { margin-bottom: 4px; }
      .total-row.strong { font-size: 14px; font-weight: 700; }
      .footer {
        text-align: center;
        font-size: 11px;
        font-weight: 700;
        margin-top: 12px;
      }
      .barcode {
        margin-top: 12px;
        text-align: center;
        page-break-inside: avoid;
      }
      .barcode img {
        display: block;
        width: 58mm;
        max-width: 100%;
        height: auto;
        margin: 0 auto;
      }
      @page {
        size: 80mm auto;
        margin: 6pt 4pt 4pt;
      }
      @media print {
        body { padding: 0; }
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <div class="center">
        <img class="brand-logo" src="/kampani-receipt-logo.png" alt="Kampani" />
        <div class="subtle">${escapeHtml(STORE_INFO.location)}</div>
        <div class="subtle">${escapeHtml(STORE_INFO.phone)}</div>
      </div>
      <div class="title">ORDER TICKET</div>
      <div class="ticket">${escapeHtml(data.ticketNumber)}</div>
      <div class="divider"></div>
      <div class="meta-row"><div class="meta-label">Customer</div><div class="meta-value">${escapeHtml(data.customerName || 'Walk-in Customer')}</div></div>
      <div class="meta-row"><div class="meta-label">Phone</div><div class="meta-value">${escapeHtml(data.customerPhone || '-')}</div></div>
      ${data.customerAccount ? `<div class="meta-row"><div class="meta-label">Store Credit</div><div class="meta-value">${escapeHtml(data.customerAccount)}</div></div>` : ''}
      <div class="meta-row"><div class="meta-label">Date</div><div class="meta-value">${escapeHtml(createdLabel)}</div></div>
      ${promisedLabel ? `<div class="meta-row"><div class="meta-label">Ready</div><div class="meta-value">${escapeHtml(promisedLabel)}</div></div>` : ''}
      <div class="divider"></div>
      <div class="table-head"><span>Item</span><span>Amount</span></div>
      <section class="items">${itemRows}</section>
      <div class="divider"></div>
      <div class="total-row"><span>Subtotal</span><span>${escapeHtml(formatCurrency(data.subtotal || 0))}</span></div>
      ${discountAmount > 0 ? `<div class="total-row"><span>Discount</span><span>-${escapeHtml(formatCurrency(discountAmount))}</span></div>` : ''}
      <div class="total-row strong"><span>Total</span><span>${escapeHtml(formatCurrency(data.total || 0))}</span></div>
      ${paidAmount > 0 ? `<div class="total-row"><span>Paid</span><span>${escapeHtml(formatCurrency(paidAmount))}</span></div>` : ''}
      ${balance > 0 ? `<div class="total-row strong"><span>Balance</span><span>${escapeHtml(formatCurrency(balance))}</span></div>` : ''}
      ${data.notes ? `<div class="divider"></div><div>${escapeHtml(data.notes)}</div>` : ''}
      ${promisedLabel ? `
        <div class="center" style="margin-top: 16px;">
          <div style="font-size: 13px;">PICKUP DATE</div>
          <div style="font-size: 18px; font-weight: 700;">${escapeHtml(promisedLabel)}</div>
        </div>
      ` : ''}
      <div class="footer">
        <div>Thank you for your business.</div>
        ${servedBy ? `<div>Served by: ${escapeHtml(servedBy)}</div>` : ''}
        <div>${escapeHtml(STORE_INFO.footerLine2)}</div>
        <div>${escapeHtml(STORE_INFO.footerLine3)}</div>
      </div>
      ${barcodeDataUri ? `
        <div class="barcode">
          <img src="${barcodeDataUri}" alt="Barcode ${escapeHtml(data.ticketNumber || data.orderId)}" />
        </div>
      ` : ''}
    </main>
    ${data.autoPrint ? `
      <script>
        window.addEventListener('load', () => {
          window.setTimeout(() => window.print(), 250);
        });
        window.addEventListener('afterprint', () => {
          window.setTimeout(() => window.close(), 250);
        });
      </script>
    ` : ''}
  </body>
</html>`;
}


// ─────────────────────────────────────────────────────────────────────────────
// Try to send ZPL to Zebra printer (silent — failures are non-fatal)
// ─────────────────────────────────────────────────────────────────────────────
async function tryPrintZPL(zpl: string): Promise<void> {
  try {
    const usb = await import('usb');
    let device = usb.findByIds(0x0a5f, 0x0009) || null;
    if (!device) {
      const all = usb.getDeviceList();
      device = all.find((d: any) => d.deviceDescriptor.idVendor === 0x0a5f && d.deviceDescriptor.idProduct === 0x0009) || null;
    }
    if (!device) return;
    device.open();
    try {
      const iface = device.interfaces[0];
      if (iface.isKernelDriverActive()) iface.detachKernelDriver();
      iface.claim();
      const ep = iface.endpoints.find((e: any) => e.direction === 'out');
      if (!ep) return;
      const buf = Buffer.from(zpl + '\n', 'utf8');
      for (let i = 0; i < buf.length; i += 64) {
        await new Promise<void>((resolve, reject) => {
          ep.transfer(buf.subarray(i, i + 64), (err: Error | undefined) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    } finally { device.close(); }
  } catch (_) { /* non-fatal */ }
}

// Get printer configuration
router.get('/config', (req, res) => {
  res.json(printerConfig);
});

// Update printer configuration
router.put('/config', (req, res) => {
  try {
    printerConfig = { ...printerConfig, ...req.body };
    res.json(printerConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update printer configuration' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Print receipt for an order — returns PDF to browser, optionally prints USB
// ─────────────────────────────────────────────────────────────────────────────
router.get("/print/order/:id", async (req, res) => {
  const { id } = req.params;

  const order = await db.get(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.account_balance
    FROM operations o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = $1 OR o.ticket_number = $1
  `, [id]);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const shoeRows = await db.all(`
    SELECT
      os.id,
      os.category,
      os.shoe_size,
      os.color,
      os.notes as shoe_notes,
      os_s.price,
      os_s.quantity,
      os_s.notes as service_notes,
      s.name as service_name
    FROM operation_shoes os
    LEFT JOIN operation_services os_s ON os.id = os_s.operation_shoe_id
    LEFT JOIN services s ON os_s.service_id = s.id
    WHERE os.operation_id = $1
    ORDER BY os.created_at
  `, [order.id]);

  const shoeMap: Record<string, any> = {};
  for (const row of shoeRows) {
    if (!shoeMap[row.id]) {
      shoeMap[row.id] = {
        category: row.category,
        shoe_size: row.shoe_size,
        color: row.color,
        notes: row.shoe_notes,
        services: [],
      };
    }
    if (row.service_name) {
      shoeMap[row.id].services.push({
        name: row.service_name,
        price: Number(row.price) || 0,
        quantity: Number(row.quantity) || 1,
        notes: row.service_notes || '',
      });
    }
  }

  const retailRows = await db.all(`
    SELECT product_name, unit_price, quantity, total_price
    FROM operation_retail_items
    WHERE operation_id = $1
    ORDER BY created_at
  `, [order.id]);

  const lineItems: Array<{ description: string; price: number; quantity?: number }> = [];
  let subtotal = 0;
  let pieceCount = 0;
  let shoeIndex = 1;

  for (const [, shoe] of Object.entries(shoeMap)) {
    const svcs = (shoe as any).services;
    if (svcs.length > 0) {
      for (const svc of svcs) {
        const header = joinSegments([
          `#${shoeIndex}`,
          (shoe as any).category,
          (shoe as any).shoe_size ? `Sz ${(shoe as any).shoe_size}` : '',
          (shoe as any).color,
        ]);
        const detail = joinSegments([
          svc.name,
          svc.notes,
          (shoe as any).notes,
        ]);
        const amount = (Number(svc.price) || 0) * (Number(svc.quantity) || 1);
        lineItems.push({
          description: limitText([header, detail].filter(Boolean).join('\n')),
          price: amount,
          quantity: Number(svc.quantity) || 1,
        } as any);
        subtotal += amount;
      }
    } else {
      const header = joinSegments([
        `#${shoeIndex}`,
        (shoe as any).category,
        (shoe as any).shoe_size ? `Sz ${(shoe as any).shoe_size}` : '',
        (shoe as any).color,
      ]);
      const detail = joinSegments([(shoe as any).notes, 'No service']);
      lineItems.push({ description: [header, detail].filter(Boolean).join('\n'), price: 0, quantity: 1 } as any);
    }
    pieceCount += 1;
    shoeIndex += 1;
  }

  for (const item of retailRows) {
    const qty = Number(item.quantity) || 1;
    const amount = Number(item.total_price) || (Number(item.unit_price) || 0) * qty;
    const header = joinSegments(['Product', item.product_name]);
    const detail = joinSegments([
      qty > 1 ? `Qty ${qty}` : '',
      Number(item.unit_price) ? `@ UGX ${Number(item.unit_price).toLocaleString('en-US')}` : '',
    ]);
    lineItems.push({
      description: [limitText(header, 72), detail].filter(Boolean).join('\n'),
      price: amount,
      quantity: qty,
    });
    subtotal += amount;
    pieceCount += qty;
  }

  const orderTotal = Number(order.total_amount) || subtotal;
  const storeCreditAmount = Number(order.account_balance) || 0;
  const storeCreditLabel = storeCreditAmount > 0 ? formatCurrency(storeCreditAmount) : '';

  // Build minimal ZPL for USB printer (silent)
  const safe = (s: string) => String(s || '').replace(/\\/g, '\\\\').replace(/\^/g, '\\^').replace(/_/g, '\\_');
  const W = 812, LM = 20, RX = 620, LH = 20;
  let y = 6;
  const fo = (x: number, yn: number) => '^FO' + x + ',' + yn;
  const fd = (t: string) => '^FD' + safe(t) + '^FS';
  const fb = (w: number, l: number, m: number, t: number, j: string) => '^FB' + w + ',' + l + ',' + m + ',' + t + ',' + j;
  const font = (h: number, w: number) => '^A0N,' + h + ',' + w;
  const vl = (yy: number, th: number) => fo(LM, yy) + '^GB' + (W - 2*LM) + ',' + th + ',' + th + '^FS';
  const fmt = (n: number) => 'UGX ' + (n || 0).toLocaleString('en-US');
  const rl = (label: string, amt: number, yy: number) =>
    fo(LM, yy) + font(23,23) + ' ' + fd(label) + ':' + fo(RX, yy) + font(23,23) + ' ' + fd(fmt(amt));

  const zl: string[] = [];
  zl.push('^XA','^CI28');
  // Header
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(52,52)+' '+fd(STORE_INFO.brand)); y+=58;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(24,24)+' '+fd(STORE_INFO.location)); y+=30;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(24,24)+' '+fd(STORE_INFO.phone)); y+=30;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(21,21)+' '+fd(' CUSTOMER COPY ')); y+=27;
  zl.push(vl(y,3)); y+=12;
  // Receipt number (large centered)
  const orderCode = order.ticket_number || order.id;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(50,50)+' '+fd(orderCode)); y+=55;
  zl.push(vl(y,2)); y+=15;
  // Customer block
  const cname = (order.customer_name || 'WALK-IN CUSTOMER').toUpperCase();
  const cphone = order.customer_phone || '';
  const caddr = order.customer_address || 'Kampala';
  zl.push(fo(LM,y)+font(22,22)+' '+fd(cname)); y+=LH+4;
  zl.push(fo(LM,y)+font(18,18)+' '+fd(caddr)); y+=LH+2;
  if (cphone) { zl.push(fo(LM,y)+font(18,18)+' '+fd(cphone)); y+=LH+2; }
  y+=4; zl.push(vl(y,2)); y+=12;
  // Date and time
  const orderDate = new Date(order.created_at);
  const dateStr = orderDate.toLocaleDateString('en-UG', {day:'2-digit',month:'2-digit',year:'numeric'});
  const timeStr = orderDate.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',hour12:false});
  zl.push(fo(LM,y)+font(20,20)+' '+fd(dateStr)); zl.push(fo(RX,y)+font(20,20)+' '+fd(timeStr)); y+=LH+6;
  zl.push(vl(y,2)); y+=12;
  const col1X = LM, col2X = LM + 150;
  const ip: [string, string][] = [
    ['Order No', order.ticket_number || order.id],
    ['Date', new Date(order.created_at).toLocaleDateString('en-UG', { day:'2-digit', month:'short', year:'numeric' })],
    ['Customer', order.customer_name || 'N/A'],
  ];
  if (order.customer_phone) ip.push(['Phone', order.customer_phone]);
  if (storeCreditAmount > 0) ip.push(['Store Credit', fmt(storeCreditAmount)]);
  for (const [l, v] of ip) { zl.push(fo(col1X,y)+font(22,22)+'^B1 '+fd(l+' :')); zl.push(fo(col2X,y)+font(22,22)+'^B0 '+fd(v)); y+=LH+4; }
  if (order.promised_date) { const pd = new Date(order.promised_date); const pdStr = pd.toLocaleDateString('en-UG', {weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}); const ptStr = pd.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}); zl.push(fo(LM,y)+font(20,20)+' '+fd('Ready:')); y+=LH+4; zl.push(fo(LM,y)+font(24,24)+' '+fd(pdStr)); y+=LH+6; zl.push(fo(LM,y)+font(24,24)+' '+fd(ptStr)); y+=LH+8; zl.push(vl(y,2)); y+=10; }
  y+=5; zl.push(vl(y,2)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(22,22)+' ^B1 '+fd('ITEMS TO WORK ON')); y+=8;
  zl.push(vl(y,2)); y+=12;
  zl.push(fo(LM,y)+font(18,18)+' '+fd('Q ')); zl.push(fo(LM+30,y)+font(18,18)+' '+fd('Details')); zl.push(fo(RX,y)+font(18,18)+' '+fd('Amt')); y+=8;
  zl.push(vl(y,1)); y+=10;
  if (lineItems.length > 0) {
    for (const item of lineItems) {
      const qty = (item as any).quantity || 1;
      const lines = String(item.description || '').split('\n').slice(0, 2);
      zl.push(fo(LM,y)+font(23,23)+' '+fd(String(qty)));
      zl.push(fo(LM + 30,y)+font(23,23)+' '+fd(limitText(lines[0] || '', 31)));
      zl.push(fo(RX,y)+font(23,23)+' '+fd(fmt(item.price)));
      y+=LH+1;
      if (lines[1]) {
        zl.push(fo(LM + 30,y)+font(19,19)+' '+fd(limitText(lines[1], 38)));
        y+=LH;
      }
      y+=3;
    }
  } else { zl.push(fo(LM,y)+font(20,20)+' '+fd('No charge')); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(0))); y+=LH+3; }
  y+=5; zl.push(vl(y,1)); y+=10;
  const totalQty = pieceCount || lineItems.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(22,22)+' '+fd(totalQty+' PIECE'+(totalQty!==1?'S':''))); y+=28;
  zl.push(vl(y,2)); y+=10;
  zl.push(rl('Subtotal', subtotal, y)); y+=LH+2;
  if (order.discount > 0) { zl.push(rl('Discount', Number(order.discount), y)); y+=LH+2; }
  zl.push(vl(y,2)); y+=8;
  zl.push(fo(col1X,y)+font(24,24)+'^B1 '+fd('TOTAL:')+fo(RX,y)+font(24,24)+'^B1 '+fd(fmt(orderTotal))); y+=LH+6;
  if (order.notes) {
    y+=4; zl.push(vl(y,2)); y+=8; zl.push(fo(col1X,y)+font(20,20)+'^B1 '+fd('Notes:')); y+=LH+2;
    const words = String(order.notes).split(' '); let nl = '';
    for (const w of words) { if ((nl+' '+w).trim().length>40) { zl.push(fo(LM,y)+font(18,18)+' '+fd(nl.trim())); y+=LH; nl=w; } else nl+=' '+w; }
    if (nl.trim()) { zl.push(fo(LM,y)+font(18,18)+' '+fd(nl.trim())); y+=LH; }
    y+=5;
  }
  zl.push(vl(y,3)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(18,18)+' '+fd(STORE_INFO.footerLine1)); y+=25;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd(STORE_INFO.footerLine2)); y+=20;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd(STORE_INFO.footerLine3)); y+=20;
  zl.push('^FO236,' + y + '^BY2,2,50^BCN,50,Y,N,N^FD' + safe(orderCode) + '^FS'); y+=72;
  zl.push('^XZ');

  // Fire-and-forget USB print (non-blocking)
  tryPrintZPL(zl.join('\n')).catch(() => {});

  if (req.query.format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(await generateOrderPrintHtml({
      orderId: order.id,
      ticketNumber: order.ticket_number || order.id,
      customerName: order.customer_name || undefined,
      customerPhone: order.customer_phone || undefined,
      customerAccount: storeCreditLabel || undefined,
      createdAt: order.created_at,
      promisedDate: order.promised_date || undefined,
      items: lineItems.map((item) => ({
        description: item.description,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      subtotal,
      discount: Number(order.discount) || Math.max(0, subtotal - orderTotal),
      total: orderTotal,
      paidAmount: Number(order.paid_amount) || 0,
      notes: order.notes || undefined,
      autoPrint: req.query.autoprint === '1',
      servedBy: (req.query.servedBy as string) || undefined,
    }));
    return;
  }

  // Always return PDF to browser
  try {
    const pdfBuf = await generateReceiptPDF({
      title: 'ORDER TICKET',
      ticketId: order.id,
      ticketNumber: order.ticket_number || order.id,
      customerName: order.customer_name || undefined,
      customerPhone: order.customer_phone || undefined,
      customerAccount: storeCreditLabel || undefined,
      date: new Date(order.created_at).toLocaleDateString('en-UG', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      promisedDate: order.promised_date ? new Date(order.promised_date).toLocaleDateString('en-UG', {day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short'}) : undefined,
      promisedTime: order.promised_date ? new Date(order.promised_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false}) : undefined,
      customerAddress: order.customer_address || undefined,
      items: lineItems.map(i => ({ ...i, quantity: i.quantity || 1 })),
      subtotal,
      discount: Number(order.discount) || Math.max(0, subtotal - orderTotal),
      total: orderTotal,
      amountPaid: Number(order.paid_amount) || undefined,
      balance: (Number(order.paid_amount) || 0) !== orderTotal ? (orderTotal - (Number(order.paid_amount) || 0)) : undefined,
      notes: order.notes || undefined,
      servedBy: (req.query.servedBy as string) || undefined,
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="order-' + (order.ticket_number || order.id) + '.pdf"');
    res.setHeader('Content-Length', pdfBuf.length);
    res.end(pdfBuf);
  } catch (err: any) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF receipt' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Store policy — PDF generator (no thermal printer required)
// ─────────────────────────────────────────────────────────────────────────────

interface PolicyPrintData {
  ticketNumber: string;
  date: string;
  customerNumber: string;
  customerName: string;
}

function estimateH(text: string, cpl: number = 50): number {
  return 11 + (Math.max(1, Math.ceil(text.length / cpl)) - 1) * 10;
}

async function generatePolicyPDF(data: PolicyPrintData): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;

  const PAGE_W = 226;
  const W = 194;
  const boxX = 16;
  const showReferenceBlock = Boolean(
    compact(data.ticketNumber && data.ticketNumber !== 'STORE-POLICY' ? data.ticketNumber : '') ||
    compact(data.date) ||
    compact(data.customerNumber) ||
    compact(data.customerName)
  );
  let totalH = 0;
  const add = (h: number) => { totalH += h; };

  add(18 + 10 + 10 + 16);          // title + clinic info
  add(18 + 18);                    // policies badge + intro
  if (showReferenceBlock) {
    add(18 + 4 * 11 + 12);         // reference card
  }

  const cleaningBullets = [
    'May cause all material types to become tender, stiff, brittle and may cause some buckling and peeling.',
    'Shrinkage of all material types is unpredictable and may happen.',
    'Slight changes in shades or top finish may occur on all material types.',
    'Insect bites and scars on leather skins, which were covered over by the manufacture, could show afterward.',
    'Breaks and skin lines may show to be more apparent.',
    'Unevenly matched skins are common and may show more uneven.',
    'May cause bleeding on all material types, which in turn, causes change of color.',
    'May cause hardware pieces to bleed onto all material types and may stain material.',
  ];
  add(18);
  for (const b of cleaningBullets) add(estimateH(b));
  add(8 + 16);

  const dyeingBullets = [
    'We cannot guarantee that the color will match the given swatch 100%.',
    'Certain imperfections in the construction of the item may become visible after the item is dyed.',
    'The dyed color will look different when viewed in different types of lighting.',
    'If shoes are worn in the rain or come in contact with water the color may come off and/or bleed onto a material.',
  ];
  add(18);
  for (const b of dyeingBullets) add(estimateH(b));
  add(8);

  add(18);
  add(estimateH("We cannot guarantee that all shoe repair/handbag repair/alterations requests will meet the product's original condition but we will do our best."));
  add(8);

  const stretchBullets = [
    'May cause some wrinkling, buckling and peeling.',
    'Slight changes in shades or top finish may occur on all material types.',
    'Stretching the width may or may not give you more room in the length.',
    'Stretching may cause some finished imperfections on the innersole and/or lining.',
  ];
  add(18);
  for (const b of stretchBullets) add(estimateH(b));
  add(8);

  const storageBullets = [
    'After one month from the date received items are sent to storage, fee of $5 per month.',
    'After six months from the date received items are disposed of at our own discretion.',
  ];
  add(18);
  for (const b of storageBullets) add(estimateH(b));
  add(8);

  add(12 + 24 + 22 + 18);

  const PAGE_H = Math.ceil(totalH) + 24;

  const doc = new PDFDocument({ margin: 0, size: [PAGE_W, PAGE_H], layout: 'portrait' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  let y = 12;

  const rule = (yy: number, color = '#d1d5db', width = 0.8) => {
    doc.moveTo(boxX, yy).lineTo(boxX + W, yy).strokeColor(color).lineWidth(width).stroke();
  };

  const sectionHeader = (title: string) => {
    doc.roundedRect(boxX, y, W, 15, 3).fill('#111111');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text(title.toUpperCase(), boxX + 8, y + 5, { width: W - 16 });
    y += 20;
  };

  doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
  doc.text('Kampanis Shoes & Bags Clinic', 0, y, { align: 'center', width: PAGE_W });
  y += 16;
  doc.fontSize(7.5).font('Helvetica').fillColor('#4b5563');
  doc.text('Forest Mall, Kampala', 0, y, { align: 'center', width: PAGE_W });
  y += 10;
  doc.text('+256 789 183784', 0, y, { align: 'center', width: PAGE_W });
  y += 16;

  doc.roundedRect(boxX + 42, y, W - 84, 17, 4).lineWidth(1).strokeColor('#111111').stroke();
  doc.fillColor('#000000').fontSize(8.5).font('Helvetica-Bold');
  doc.text('COMPANY POLICIES', boxX + 42, y + 5, { align: 'center', width: W - 84 });
  y += 24;

  doc.fontSize(7.2).font('Helvetica').fillColor('#4b5563');
  doc.text(
    'Please review these terms before cleaning, dyeing, repairing, stretching, or storing items with us.',
    boxX,
    y,
    { align: 'center', width: W }
  );
  y += 18;

  const infoRow = (label: string, value: string) => {
    doc.fontSize(7.4).font('Helvetica').fillColor('#6b7280');
    doc.text(label, boxX + 8, y, { width: 60 });
    doc.fillColor('#000000').font('Helvetica-Bold');
    doc.text(value, boxX + 68, y, { width: W - 76 });
    y += 11;
  };

  if (showReferenceBlock) {
    doc.roundedRect(boxX, y, W, 60, 6).lineWidth(0.8).strokeColor('#d1d5db').stroke();
    y += 8;
    infoRow('Ticket', compact(data.ticketNumber || 'STORE-POLICY'));
    infoRow('Date', compact(data.date || ''));
    infoRow('Customer No', compact(data.customerNumber || '-'));
    infoRow('Name', compact((data.customerName || 'Walk-in').toUpperCase()));
    y += 4;
  }

  const policySection = (title: string, items: string[]) => {
    sectionHeader(title);
    doc.fontSize(7.4).font('Helvetica').fillColor('#222222');
    for (const item of items) {
      doc.text('\u2022  ' + item, boxX + 6, y, { width: W - 12 });
      y += estimateH(item);
    }
    y += 6;
  };

  policySection('Cleaning:', cleaningBullets);
  doc.fontSize(7.2).font('Helvetica-Oblique').fillColor('#4b5563');
  doc.text("We cannot guarantee that all cleaning requests will meet the product's original condition, but we will do our best.", boxX + 6, y, { width: W - 12 });
  y += 16;

  policySection('Dyeing:', dyeingBullets);
  policySection('Repairs/Alterations:', [
    "We cannot guarantee that all shoe repair/handbag repair/alterations requests will meet the product's original condition but we will do our best.",
  ]);
  policySection('Shoe Stretching:', stretchBullets);
  policySection('Storage:', storageBullets);

  rule(y); y += 12;
  doc.fontSize(7.2).font('Helvetica-Oblique').fillColor('#4b5563');
  doc.text(
    'I have read and understood these policies. Kampanis Shoes & Bags Clinic will handle my item(s) with due care and professional attention.',
    boxX,
    y,
    { align: 'center', width: W }
  );
  y += 24;
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Signature', boxX, y, { width: 52 });
  doc.moveTo(boxX + 52, y + 10).lineTo(boxX + W, y + 10).strokeColor('#9ca3af').lineWidth(0.8).stroke();
  y += 18;
  doc.fontSize(6.8).font('Helvetica').fillColor('#6b7280');
  doc.text('Thank you for choosing Kampanis Shoes & Bags Clinic.', boxX, y, { align: 'center', width: W });

  await new Promise<void>((resolve) => { doc.on('end', resolve); doc.end(); });
  return Buffer.concat(chunks);
}

router.get('/print/policy', async (req, res) => {
  try {
    const { ticketNumber, date, customerNumber, customerName } = req.query as any;
    const resolvedTicketNumber = compact(ticketNumber || 'STORE-POLICY');
    const pdfBuf = await generatePolicyPDF({
      ticketNumber: resolvedTicketNumber,
      date: date || '',
      customerNumber: customerNumber || '',
      customerName: customerName || '',
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="policies-' + resolvedTicketNumber + '.pdf"');
    res.setHeader('Content-Length', pdfBuf.length);
    res.end(pdfBuf);
  } catch (err: any) {
    console.error('Policy PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate policy slip: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Quotation — returns 501 (not implemented)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/print/quotation/:id', async (req: Request, res: Response) => {
  const { printerModule } = await loadPrinterModules();
  if (!printerModule?.ThermalPrinter) {
    return res.status(501).json({ error: 'Quotation printing requires a thermal printer driver (not installed)' });
  }
  res.status(501).json({ error: 'Quotation printing not supported via PDF yet' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment receipt — returns PDF to browser, optionally prints USB
// ─────────────────────────────────────────────────────────────────────────────
router.post('/print/payment-receipt', async (req, res) => {
  const { ticketId, ticketNumber, customerName, customerPhone, items, subtotal, discount, tax, total, amountPaid, balance, paymentMethod, date, servedBy } = req.body;
  let storeCreditAmount = 0;

  try {
    const operationReference = compact(ticketId || ticketNumber);
    if (operationReference) {
      const operation = await db.get(`
        SELECT c.account_balance
        FROM operations o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = $1 OR o.ticket_number = $1
      `, [operationReference]);
      storeCreditAmount = Number(operation?.account_balance) || 0;
    }
  } catch (error) {
    console.error('Failed to fetch customer store credit for receipt:', error);
  }

  const storeCreditLabel = storeCreditAmount > 0 ? formatCurrency(storeCreditAmount) : '';

  const flatRows: { description: string; price: number }[] = [];
  if (items && items.length > 0) {
    for (const item of items) {
      const brand = compact(item.brand || '');
      const color = compact(item.color || '');
      const variation = compact(item.variation || '');
      const service = compact(item.service || '');
      const notes = compact(item.notes || '');
      const summary = compact(item.description || 'Service Item');
      const detailParts = [
        brand ? `Brand: ${brand}` : '',
        color ? `Color: ${color}` : '',
        variation ? `Variation: ${variation}` : '',
      ].filter(Boolean);

      if (item.services && item.services.length > 0) {
        const serviceNames = (service || item.services
          .map((svc: any) => compact(svc.name || 'Service'))
          .filter(Boolean)
          .join(', '));
        const totalServicePrice = item.services.reduce(
          (sum: number, svc: any) => sum + (Number(svc.price) || 0),
          0
        );
        const lines = [
          summary,
          detailParts.join(' | '),
          serviceNames ? `Service: ${serviceNames}` : '',
          notes ? `Description: ${notes}` : '',
        ].filter(Boolean);
        flatRows.push({
          description: lines.join('\n'),
          price: totalServicePrice,
        });
      } else {
        const lines = [
          summary,
          detailParts.join(' | '),
          service ? `Service: ${service}` : '',
          notes ? `Description: ${notes}` : '',
        ].filter(Boolean);
        flatRows.push({
          description: lines.join('\n'),
          price: Number(item.price || item.amount) || 0,
        });
      }
    }
  }

  const remaining = (balance !== undefined && balance !== null) ? balance : ((total || 0) - (amountPaid || 0));
  const discountAmount = Math.max(0, Number(discount) || (Number(subtotal || 0) - Number(total || 0)));

  // Fire-and-forget ZPL to USB printer
  const safe = (s: string) => String(s || '').replace(/\\/g, '\\\\').replace(/\^/g, '\\^').replace(/_/g, '\\_');
  const W = 812, LM = 20, RX = 620, LH = 20;
  let y = 6;
  const fo = (x: number, yn: number) => '^FO' + x + ',' + yn;
  const fd = (t: string) => '^FD' + safe(t) + '^FS';
  const fb = (w: number, l: number, m: number, t: number, j: string) => '^FB' + w + ',' + l + ',' + m + ',' + t + ',' + j;
  const font = (h: number, w: number) => '^A0N,' + h + ',' + w;
  const vl = (yy: number, th: number) => fo(LM, yy) + '^GB' + (W - 2*LM) + ',' + th + ',' + th + '^FS';
  const fmt = (n: number) => 'UGX ' + (n || 0).toLocaleString('en-US');
  const rl = (label: string, amt: number, yy: number) =>
    fo(LM, yy) + font(23,23) + ' ' + fd(label) + ':' + fo(RX, yy) + font(23,23) + ' ' + fd(fmt(amt));
  const col1X = LM, col2X = LM + 120;

  const zl: string[] = [];
  zl.push('^XA','^CI28');
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(66,66)+' '+fd(STORE_INFO.brand)); y+=70;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(24,24)+' '+fd(STORE_INFO.location)); y+=32;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(24,24)+' '+fd(STORE_INFO.phone)); y+=30;
  zl.push(vl(y,3)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(30,30)+' '+fd('PAYMENT RECEIPT')); y+=10;
  zl.push(vl(y,2)); y+=15;
  const ip: [string, string][] = [
    ['Ticket No', ticketNumber || ('TKT-' + (ticketId || '').slice(-6).toUpperCase())],
    ['Date', date || new Date().toLocaleDateString('en-UG', { day:'2-digit', month:'short', year:'numeric' })],
    ['Customer', customerName || 'N/A'],
  ];
  if (customerPhone) ip.push(['Phone', customerPhone]);
  if (storeCreditAmount > 0) ip.push(['Store Credit', fmt(storeCreditAmount)]);
  for (const [l, v] of ip) { zl.push(fo(col1X,y)+font(22,22)+'^B1 '+fd(l+' :')); zl.push(fo(col2X,y)+font(22,22)+'^B0 '+fd(v)); y+=LH+4; }
  y+=5; zl.push(vl(y,2)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(22,22)+' ^B1 '+fd('SERVICE DETAILS')); y+=8;
  zl.push(vl(y,2)); y+=12;
  zl.push(fo(LM,y)+font(18,18)+' '+fd('Service')); zl.push(fo(RX,y)+font(18,18)+' '+fd('Amount')); y+=8;
  zl.push(vl(y,1)); y+=10;
  if (flatRows.length > 0) {
    for (const row of flatRows) {
      const zplDescription = row.description.replace(/\s*\n\s*/g, ' / ');
      zl.push(fo(LM,y)+font(23,23)+' '+fd(zplDescription.substring(0,31)));
      zl.push(fo(RX,y)+font(23,23)+' '+fd(fmt(row.price)));
      y+=LH+3;
    }
  } else { zl.push(fo(LM,y)+font(20,20)+' '+fd('Payment')); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(total||0))); y+=LH+3; }
  y+=5; zl.push(vl(y,1)); y+=10;
  zl.push(rl('Subtotal', subtotal||total||0, y)); y+=LH+2;
  if (discountAmount > 0) { zl.push(rl('Discount', -discountAmount, y)); y+=LH+2; }
  if (tax) { zl.push(rl('Tax', tax, y)); y+=LH+2; }
  zl.push(vl(y,2)); y+=8;
  zl.push(fo(col1X,y)+font(24,24)+'^B1 '+fd('TOTAL')+':'+fo(RX,y)+font(24,24)+'^B1 '+fd(fmt(total||0))); y+=LH+6;
  zl.push(fo(col1X,y)+font(20,20)+'^B0 '+fd('Paid ('+(paymentMethod||'Cash')+'):')+fo(RX,y)+font(20,20)+' '+fd(fmt(amountPaid||0))); y+=LH+2;
  if (remaining > 0) { zl.push(fo(col1X,y)+font(20,20)+' '+fd('Balance:')+fo(RX,y)+font(20,20)+' '+fd(fmt(remaining))); }
  else { zl.push(fo(col1X,y)+font(20,20)+' '+fd('Change:')+fo(RX,y)+font(20,20)+' '+fd(fmt(Math.abs(remaining)))); }
  y+=15; zl.push(vl(y,3)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(18,18)+' '+fd(STORE_INFO.footerLine1)); y+=25;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd(STORE_INFO.footerLine2)); y+=20;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd(STORE_INFO.footerLine3)); y+=20;
  const paymentCode = ticketNumber || ('TKT-' + (ticketId || '').slice(-6).toUpperCase());
  zl.push('^FO236,' + y + '^BY2,2,50^BCN,50,Y,N,N^FD' + safe(paymentCode) + '^FS'); y+=72;
  zl.push('^XZ');

  tryPrintZPL(zl.join('\n')).catch(() => {});

  // Always return PDF
  try {
    const pdfBuf = await generateReceiptPDF({
      title: 'PAYMENT RECEIPT',
      ticketId, ticketNumber, customerName, customerPhone, date,
      customerAccount: storeCreditLabel || undefined,
      items: flatRows,
      subtotal: subtotal || total || 0,
      discount: discountAmount,
      tax: tax || undefined,
      total: total || 0,
      amountPaid: amountPaid || 0,
      balance: remaining,
      paymentMethod: paymentMethod || 'Cash',
      servedBy: servedBy || undefined,
    });

    try {
      await archiveIssuedReceipt({
        operationId: ticketId || null,
        ticketNumber: ticketNumber || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        subtotal: subtotal || total || 0,
        total: total || 0,
        amountPaid: amountPaid || 0,
        paymentMethod: paymentMethod || 'Cash',
        generatedAt: new Date().toISOString(),
        pdfBuffer: pdfBuf,
      });
    } catch (archiveError) {
      console.error('Failed to archive payment receipt:', archiveError);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="receipt-' + (ticketNumber || ticketId || 'payment') + '.pdf"');
    res.setHeader('Content-Length', pdfBuf.length);
    res.end(pdfBuf);
  } catch (err: any) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF receipt' });
  }
});

export default router;
