import express from 'express';
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
  total: number;
  amountPaid?: number;
  balance?: number;
  paymentMethod?: string;
  notes?: string;
}): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  // 8cm wide receipt (226.8pt)
  const PW = 226.8;
  const ML = 12; const MR = 12;
  const CW = PW - ML - MR;  // content width = 202.8
  const doc = new PDFDocument({ margin: 0, size: [PW, 700], layout: 'portrait' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const fmt = (n: number) => (n || 0).toLocaleString('en-US');
  const fmtUGX = (n: number) => 'UGX ' + fmt(n);

  // Helper: draw a horizontal rule
  const rule = (y: number, color = '#cccccc') => {
    doc.moveTo(ML, y).lineTo(PW - MR, y).strokeColor(color).stroke();
  };

  let y = 12;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
  doc.text('Kampanis Shoes and Bags Clinic', ML, y, { align: 'center', width: CW });
  y += 15;
  doc.fontSize(8).font('Helvetica').fillColor('#555555');
  doc.text('Forest Mall, Kampala', ML, y, { align: 'center', width: CW });
  y += 10;
  doc.text('+256 789 183784', ML, y, { align: 'center', width: CW });
  y += 8;
  // CUSTOMER COPY badge
  doc.setFillColor('#000000').roundedRect(ML + CW / 2 - 35, y, 70, 14, 4).fill();
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
  doc.text('CUSTOMER COPY', ML + CW / 2 - 35, y + 3, { align: 'center', width: 70 });
  y += 20;

  rule(y, '#bbbbbb'); y += 8;

  // ── Receipt No (large centered) ─────────────────────────────────────────
  const recNo = data.ticketNumber || data.ticketId || '';
  doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold');
  doc.text(recNo, ML, y, { align: 'center', width: CW });
  y += 22;

  rule(y, '#dddddd'); y += 8;

  // ── Customer block ─────────────────────────────────────────────────────
  const cname = (data.customerName || 'WALK-IN CUSTOMER').toUpperCase();
  const cphone = data.customerPhone || '';
  const caddr = data.customerAddress || '';
  const cacct = data.customerAccount || '';

  doc.setFillColor('#f5f5f5').roundedRect(ML, y, CW, 42, 4).fill();
  const cbY = y + 6;
  doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
  doc.text(cname, ML + 6, cbY, { width: CW - 12 });
  doc.fontSize(8).font('Helvetica').fillColor('#555555');
  doc.text(caddr || 'Kampala', ML + 6, cbY + 12, { width: CW - 12 });
  doc.text(cphone, ML + 6, cbY + 23, { width: CW - 12 });
  // Acct line
  if (cacct) {
    doc.text('Acct: ' + cacct, ML + 6, cbY + 34, { width: 80 });
  }
  y += 48;

  rule(y, '#cccccc'); y += 8;

  // ── Date / Time ─────────────────────────────────────────────────────────
  const dateStr = data.date || '';
  const timeStr = data.time || '';
  doc.fontSize(9).font('Helvetica').fillColor('#333333');
  doc.text(dateStr, ML, y, { width: CW / 2 });
  doc.text(timeStr, ML + CW / 2, y, { align: 'right', width: CW / 2 });
  y += 14;

  rule(y); y += 8;

  // ── Items table header ──────────────────────────────────────────────────
  doc.setFillColor('#000000');
  doc.rect(ML, y, CW, 16).fill();
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  doc.text('Q', ML + 2, y + 4, { width: 14 });
  doc.text('Item', ML + 18, y + 4, { width: 100 });
  doc.text('P', ML + 120, y + 4, { width: 36, align: 'right' });
  doc.text('T', ML + 158, y + 4, { width: 36, align: 'right' });
  y += 16;

  // ── Line items ──────────────────────────────────────────────────────────
  const itemLines: string[] = [];
  for (const item of data.items) {
    const lines = (item.description || 'Service').split('\n');
    for (const ln of lines) itemLines.push(ln);
  }

  const DESC_X = ML + 18;
  const AMT_X = ML + 158;
  const LINE_H = 12;

  for (const item of data.items) {
    const qty = item.quantity || 1;
    const total = item.price * qty;
    const descLines = (item.description || 'Service').split('\n');
    const maxLines = Math.max(descLines.length, 1);

    // Draw qty
    doc.fontSize(8).font('Helvetica').fillColor('#222222');
    doc.text(String(qty), ML + 2, y + 2, { width: 14 });
    doc.text('P', ML + 122, y + 2, { width: 34, align: 'right' });
    doc.text('T', ML + 158, y + 2, { width: 34, align: 'right' });

    // Draw description lines
    let dy = y + 2;
    for (const ln of descLines) {
      doc.text(ln, DESC_X, dy, { width: 100 });
      dy += LINE_H;
    }

    // Draw prices on first desc line only
    doc.text(fmtUGX(item.price), ML + 122, y + 2, { width: 34, align: 'right' });
    doc.text(fmtUGX(total), ML + 158, y + 2, { width: 34, align: 'right' });

    // Separator
    rule(y + maxLines * LINE_H + 2, '#cccccc');
    y += maxLines * LINE_H + 4;
  }

  y += 4;

  // ── Piece count summary ────────────────────────────────────────────────
  const totalQty = data.items.reduce((s, i) => s + (i.quantity || 1), 0);
  doc.setFillColor('#f5f5f5').roundedRect(ML + CW / 2 - 40, y, 80, 18, 4).fill();
  doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
  doc.text(totalQty + ' PIECE' + (totalQty !== 1 ? 'S' : ''), ML, y + 4, { align: 'center', width: CW });
  y += 26;

  // ── Totals ──────────────────────────────────────────────────────────────
  const totals: [string, string, boolean][] = [
    ['Sub:', fmtUGX(data.subtotal), false],
    ['Total:', fmtUGX(data.total), true],
  ];
  if (data.amountPaid !== undefined) {
    totals.push(['Paid:', fmtUGX(data.amountPaid), false]);
    if (data.balance !== undefined && data.balance !== 0) {
      totals.push([data.balance > 0 ? 'Bal:' : 'Change:', fmtUGX(Math.abs(data.balance)), true]);
    }
  }

  for (const [label, value, bold] of totals) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9);
    doc.fillColor(bold ? '#000000' : '#555555');
    doc.text(label, ML, y, { width: 100 });
    doc.fillColor('#000000');
    doc.text(value, ML + 100, y, { align: 'right', width: 94 });
    y += bold ? 14 : 12;
  }

  y += 6;
  rule(y); y += 8;

  // ── Ready by ────────────────────────────────────────────────────────────
  if (data.promisedDate || data.promisedTime) {
    doc.fillColor('#555555').fontSize(9).font('Helvetica');
    doc.text('Ready:', ML, y);
    y += 12;
    if (data.promisedDate) {
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text(data.promisedDate, ML, y, { width: CW });
      y += 14;
    }
    if (data.promisedTime) {
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
      doc.text(data.promisedTime, ML, y, { width: CW });
      y += 14;
    }
    y += 4;
    rule(y); y += 8;
  }

  // ── Barcode & REG/PICKUP ─────────────────────────────────────────────
  if (data.ticketNumber || data.ticketId) {
    try {
      const https = await import('https');
      const barcodeData = data.ticketNumber || data.ticketId || '';
      const url = 'https://barcode.tec-it.com/barcode.ashx?data=' + encodeURIComponent(barcodeData) + '&code=Code128&dpi=96';
      const imgBuf = await new Promise<Buffer>((resolve, reject) => {
        https.get(url, (res: any) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
      if (imgBuf && imgBuf.length > 0) {
        const bW = 160; const bH = 44;
        const bX = ML + (CW - bW) / 2;
        doc.image(imgBuf, bX, y, { width: bW, height: bH });
        y += bH + 4;
      }
    } catch (_e) { /* barcode unavailable */ }
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text('REG/PICKUP', ML, y, { align: 'center', width: CW });
    y += 14;
  }

  // ── Footer ─────────────────────────────────────────────────────────────
  if (y < 580) {
    rule(y, '#bbbbbb'); y += 8;
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
    doc.text('Thank You!', ML, y, { align: 'center', width: CW });
    y += 11;
    doc.fontSize(7.5).font('Helvetica').fillColor('#888888');
    doc.text('Mon–Fri: 8AM–6:30PM', ML, y, { align: 'center', width: CW });
    y += 9;
    doc.text('Sat: 8:30AM–5PM', ML, y, { align: 'center', width: CW });
  }

  await new Promise<void>((resolve) => { doc.on('end', resolve); doc.end(); });
  return Buffer.concat(chunks);
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
      for (let i = 0; i < buf.length; i += 64) ep.transfer(buf.subarray(i, i + 64));
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
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM operations o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = $1 OR o.ticket_number = $1
  `, [id]);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const shoeRows = await db.all(`
    SELECT os.id, os.category, os.shoe_size, os.color, os.notes, os_s.price, s.name as service_name
    FROM operation_shoes os
    LEFT JOIN operation_services os_s ON os.id = os_s.operation_shoe_id
    LEFT JOIN services s ON os_s.service_id = s.id
    WHERE os.operation_id = $1
    ORDER BY os.created_at
  `, [order.id]);

  const shoeMap: Record<string, any> = {};
  for (const row of shoeRows) {
    if (!shoeMap[row.id]) shoeMap[row.id] = { category: row.category, services: [] };
    if (row.service_name) shoeMap[row.id].services.push({ name: row.service_name, price: Number(row.price) || 0 });
  }

  // Build multiline detail description for each line item:
  //   Women's High Heel          ← category (repeated per shoe)
  //   Women's High Heel          ← repeat for visual emphasis
  //   Size 36                    ← shoe size
  //   Green                      ← color
  //   New Right                  ← service name
  const lineItems: { description: string; price: number }[] = [];
  let subtotal = 0;
  for (const [, shoe] of Object.entries(shoeMap)) {
    const svcs = (shoe as any).services;
    if (svcs.length > 0) {
      for (const svc of svcs) {
        const cat  = (shoe as any).category   || '';
        const size = (shoe as any).shoe_size ? 'Size ' + (shoe as any).shoe_size : '';
        const col  = (shoe as any).color     || '';
        const detail = [cat, cat, size, col, svc.name].filter(Boolean).join('\n');
        lineItems.push({ description: detail, price: svc.price });
        subtotal += svc.price;
      }
    } else {
      const cat = (shoe as any).category || '';
      lineItems.push({ description: [cat, cat, '(no service)'].join('\n'), price: 0 });
    }
  }

  const orderTotal = Number(order.total_amount) || subtotal;

  // Build minimal ZPL for USB printer (silent)
  const safe = (s: string) => String(s || '').replace(/\\/g, '\\\\').replace(/\^/g, '\\^').replace(/_/g, '\\_');
  const W = 812, LM = 20, RX = 620, LH = 20;
  let y = 10;
  const fo = (x: number, yn: number) => '^FO' + x + ',' + yn;
  const fd = (t: string) => '^FD' + safe(t) + '^FS';
  const fb = (w: number, l: number, m: number, t: number, j: string) => '^FB' + w + ',' + l + ',' + m + ',' + t + ',' + j;
  const font = (h: number, w: number) => '^A0N,' + h + ',' + w;
  const vl = (yy: number, th: number) => fo(LM, yy) + '^GB' + (W - 2*LM) + ',' + th + ',' + th + '^FS';
  const fmt = (n: number) => 'UGX ' + (n || 0).toLocaleString('en-US');
  const rl = (label: string, amt: number, yy: number) =>
    fo(LM, yy) + font(20,20) + ' ' + fd(label) + ':' + fo(RX, yy) + font(20,20) + ' ' + fd(fmt(amt));

  const zl: string[] = [];
  zl.push('^XA','^CI28');
  // Header
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(45,45)+' '+fd('Kampanis Shoes and Bags Clinic')); y+=50;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(20,20)+' '+fd('Forest Mall, Kampala')); y+=26;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(20,20)+' '+fd('+256 789 183784')); y+=26;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(18,18)+' '+fd(' CUSTOMER COPY ')); y+=24;
  zl.push(vl(y,3)); y+=12;
  // Receipt number (large centered)
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(50,50)+' '+fd(order.ticket_number || order.id)); y+=55;
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
  for (const [l, v] of ip) { zl.push(fo(col1X,y)+font(22,22)+'^B1 '+fd(l+' :')); zl.push(fo(col2X,y)+font(22,22)+'^B0 '+fd(v)); y+=LH+4; }
  if (order.promised_date) { const pd = new Date(order.promised_date); const pdStr = pd.toLocaleDateString('en-UG', {weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}); const ptStr = pd.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}); zl.push(fo(LM,y)+font(20,20)+' '+fd('Ready:')); y+=LH+4; zl.push(fo(LM,y)+font(24,24)+' '+fd(pdStr)); y+=LH+6; zl.push(fo(LM,y)+font(24,24)+' '+fd(ptStr)); y+=LH+8; zl.push(vl(y,2)); y+=10; }
  y+=5; zl.push(vl(y,2)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(22,22)+' ^B1 '+fd('ITEMS TO WORK ON')); y+=8;
  zl.push(vl(y,2)); y+=12;
  zl.push(fo(LM,y)+font(18,18)+' '+fd('Q ')); zl.push(fo(LM+30,y)+font(18,18)+' '+fd('Item')); zl.push(fo(RX,y)+font(18,18)+' '+fd('P ')); zl.push(fo(RX+50,y)+font(18,18)+' '+fd('T ')); y+=8;
  zl.push(vl(y,1)); y+=10;
  if (lineItems.length > 0) {
    for (const item of lineItems) { zl.push(fo(LM,y)+font(20,20)+' '+fd(item.description.substring(0,35))); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(item.price))); y+=LH+3; }
  } else { zl.push(fo(LM,y)+font(20,20)+' '+fd('No charge')); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(0))); y+=LH+3; }
  y+=5; zl.push(vl(y,1)); y+=10;
  const totalQty = lineItems.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
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
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(18,18)+' '+fd('Thank you for your business!')); y+=25;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd('Items not collected after 30 days attract storage fees.')); y+=20;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd('After 60 days items may be disposed of.')); y+=20;
  zl.push('^XZ');

  // Fire-and-forget USB print (non-blocking)
  tryPrintZPL(zl.join('\n')).catch(() => {});

  // Always return PDF to browser
  try {
    const pdfBuf = await generateReceiptPDF({
      title: 'ORDER TICKET',
      ticketId: order.id,
      ticketNumber: order.ticket_number || order.id,
      customerName: order.customer_name || undefined,
      customerPhone: order.customer_phone || undefined,
      date: new Date(order.created_at).toLocaleDateString('en-UG', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      promisedDate: order.promised_date ? new Date(order.promised_date).toLocaleDateString('en-UG', {day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short'}) : undefined,
      promisedTime: order.promised_date ? new Date(order.promised_date).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false}) : undefined,
      customerAddress: order.customer_address || undefined,
      items: lineItems.map(i => ({ ...i, quantity: i.quantity || 1 })),
      subtotal,
      total: orderTotal,
      amountPaid: Number(order.paid_amount) || undefined,
      balance: (Number(order.paid_amount) || 0) !== orderTotal ? (orderTotal - (Number(order.paid_amount) || 0)) : undefined,
      notes: order.notes || undefined,
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

  const W = 196, boxX = 15;
  let totalH = 0;
  const add = (h: number) => { totalH += h; };

  add(14 + 10 + 10 + 14);          // header + clinic info
  add(12 + 10);                    // title + separator
  add(4 * 11 + 10);                // 4 ticket info rows + gap

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
  add(13);
  for (const b of cleaningBullets) add(estimateH(b));
  add(4 + 14);

  const dyeingBullets = [
    'We cannot guarantee that the color will match the given swatch 100%.',
    'Certain imperfections in the construction of the item may become visible after the item is dyed.',
    'The dyed color will look different when viewed in different types of lighting.',
    'If shoes are worn in the rain or come in contact with water the color may come off and/or bleed onto a material.',
  ];
  add(13);
  for (const b of dyeingBullets) add(estimateH(b));
  add(4);

  add(13);
  add(estimateH("We cannot guarantee that all shoe repair/handbag repair/alterations requests will meet the product's original condition but we will do our best."));
  add(4);

  const stretchBullets = [
    'May cause some wrinkling, buckling and peeling.',
    'Slight changes in shades or top finish may occur on all material types.',
    'Stretching the width may or may not give you more room in the length.',
    'Stretching may cause some finished imperfections on the innersole and/or lining.',
  ];
  add(13);
  for (const b of stretchBullets) add(estimateH(b));
  add(4);

  const storageBullets = [
    'After one month from the date received items are sent to storage, fee of $5 per month.',
    'After six months from the date received items are disposed of at our own discretion.',
  ];
  add(13);
  for (const b of storageBullets) add(estimateH(b));
  add(4);

  add(10 + 14 + 30);

  const PAGE_H = Math.ceil(totalH) + 24;

  const doc = new PDFDocument({ margin: 0, size: [226, PAGE_H], layout: 'portrait' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  let y = 12;

  const dashedLine = (yy: number) => {
    doc.moveTo(boxX, yy).lineTo(boxX + W, yy).strokeColor('#bbbbbb').lineWidth(0.5).stroke();
  };

  doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
  doc.text('Kampa\u0161kis Shoes & Bags Clinic', 0, y, { align: 'center', width: 226 });
  y += 14;
  doc.fontSize(7.5).font('Helvetica').fillColor('#555555');
  doc.text('Forest Mall, Kampala', 0, y, { align: 'center', width: 226 });
  y += 10;
  doc.text('+256 789 183784', 0, y, { align: 'center', width: 226 });
  y += 14;

  doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
  doc.text('Store Policies', 0, y, { align: 'center', width: 226 });
  y += 12;
  dashedLine(y); y += 10;

  const infoRow = (label: string, value: string) => {
    doc.fontSize(8).font('Helvetica').fillColor('#555555');
    doc.text(label, boxX, y, { width: 72 });
    doc.fillColor('#000000').font('Helvetica-Bold');
    doc.text(value, boxX + 72, y, { width: 124 });
    y += 11;
  };
  infoRow('Ticket No :', data.ticketNumber || '01-000000');
  infoRow('Date      :', data.date || '');
  infoRow('Cust No   :', data.customerNumber || '0');
  infoRow('Name      :', (data.customerName || 'WALK-IN').toUpperCase());
  dashedLine(y); y += 10;

  const policySection = (title: string, items: string[]) => {
    doc.fillColor('#000000').fontSize(8.5).font('Helvetica-Bold');
    doc.text(title, boxX, y, { width: W });
    y += 13;
    doc.fontSize(7.5).font('Helvetica').fillColor('#333333');
    for (const item of items) {
      doc.text('\u2022  ' + item, boxX + 4, y, { width: W - 8 });
      y += estimateH(item);
    }
    y += 4;
  };

  policySection('Cleaning:', cleaningBullets);
  doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#555555');
  doc.text("We cannot guarantee that all cleaning requests will meet the product's original condition but we will do our best.", boxX, y, { align: 'center', width: W });
  y += 14;

  policySection('Dyeing:', dyeingBullets);
  policySection('Repairs/Alterations:', [
    "We cannot guarantee that all shoe repair/handbag repair/alterations requests will meet the product's original condition but we will do our best.",
  ]);
  policySection('Shoe Stretching:', stretchBullets);
  policySection('Storage:', storageBullets);

  dashedLine(y); y += 10;
  doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#555555');
  doc.text("I have read the policies and understand that you will carefully service my item(s) to the best of your ability.", boxX, y, { align: 'center', width: W });
  y += 14;
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Signature: _______________________', boxX, y, { width: W });

  await new Promise<void>((resolve) => { doc.on('end', resolve); doc.end(); });
  return Buffer.concat(chunks);
}

router.get('/print/policy', async (req, res) => {
  try {
    const { ticketNumber, date, customerNumber, customerName } = req.query as any;
    if (!ticketNumber) {
      res.status(400).json({ error: 'Missing required fields: ticketNumber' });
      return;
    }
    const pdfBuf = await generatePolicyPDF({ ticketNumber, date: date || '', customerNumber: customerNumber || '', customerName: customerName || '' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="policies-' + (ticketNumber || 'receipt') + '.pdf"');
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
  const { ticketId, ticketNumber, customerName, customerPhone, items, subtotal, tax, total, amountPaid, balance, paymentMethod, date } = req.body;

  const flatRows: { description: string; price: number }[] = [];
  if (items && items.length > 0) {
    for (const item of items) {
      if (item.services && item.services.length > 0) {
        for (const svc of item.services) {
          flatRows.push({ description: svc.name || item.description || 'Service', price: Number(svc.price) || 0 });
        }
      } else {
        flatRows.push({ description: item.description || 'Service', price: Number(item.price || item.amount) || 0 });
      }
    }
  }

  const remaining = (balance !== undefined && balance !== null) ? balance : ((total || 0) - (amountPaid || 0));

  // Fire-and-forget ZPL to USB printer
  const safe = (s: string) => String(s || '').replace(/\\/g, '\\\\').replace(/\^/g, '\\^').replace(/_/g, '\\_');
  const W = 812, LM = 20, RX = 620, LH = 20;
  let y = 10;
  const fo = (x: number, yn: number) => '^FO' + x + ',' + yn;
  const fd = (t: string) => '^FD' + safe(t) + '^FS';
  const fb = (w: number, l: number, m: number, t: number, j: string) => '^FB' + w + ',' + l + ',' + m + ',' + t + ',' + j;
  const font = (h: number, w: number) => '^A0N,' + h + ',' + w;
  const vl = (yy: number, th: number) => fo(LM, yy) + '^GB' + (W - 2*LM) + ',' + th + ',' + th + '^FS';
  const fmt = (n: number) => 'UGX ' + (n || 0).toLocaleString('en-US');
  const rl = (label: string, amt: number, yy: number) =>
    fo(LM, yy) + font(20,20) + ' ' + fd(label) + ':' + fo(RX, yy) + font(20,20) + ' ' + fd(fmt(amt));
  const col1X = LM, col2X = LM + 120;

  const zl: string[] = [];
  zl.push('^XA','^CI28');
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(60,60)+' '+fd('KAMPANIS')); y+=65;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(28,28)+' '+fd('Shoes & Bags Clinic')); y+=35;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(20,20)+' '+fd('FORESET MALL, KOLOLO, KAMPALA, UGANDA')); y+=30;
  zl.push(vl(y,3)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(30,30)+' '+fd('PAYMENT RECEIPT')); y+=10;
  zl.push(vl(y,2)); y+=15;
  const ip: [string, string][] = [
    ['Ticket No', ticketNumber || ('TKT-' + (ticketId || '').slice(-6).toUpperCase())],
    ['Date', date || new Date().toLocaleDateString('en-UG', { day:'2-digit', month:'short', year:'numeric' })],
    ['Customer', customerName || 'N/A'],
  ];
  if (customerPhone) ip.push(['Phone', customerPhone]);
  for (const [l, v] of ip) { zl.push(fo(col1X,y)+font(22,22)+'^B1 '+fd(l+' :')); zl.push(fo(col2X,y)+font(22,22)+'^B0 '+fd(v)); y+=LH+4; }
  y+=5; zl.push(vl(y,2)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(22,22)+' ^B1 '+fd('SERVICE DETAILS')); y+=8;
  zl.push(vl(y,2)); y+=12;
  zl.push(fo(LM,y)+font(18,18)+' '+fd('Service')); zl.push(fo(RX,y)+font(18,18)+' '+fd('Amount')); y+=8;
  zl.push(vl(y,1)); y+=10;
  if (flatRows.length > 0) {
    for (const row of flatRows) { zl.push(fo(LM,y)+font(20,20)+' '+fd(row.description.substring(0,35))); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(row.price))); y+=LH+3; }
  } else { zl.push(fo(LM,y)+font(20,20)+' '+fd('Payment')); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(total||0))); y+=LH+3; }
  y+=5; zl.push(vl(y,1)); y+=10;
  zl.push(rl('Subtotal', subtotal||total||0, y)); y+=LH+2;
  if (tax) { zl.push(rl('Tax', tax, y)); y+=LH+2; }
  zl.push(vl(y,2)); y+=8;
  zl.push(fo(col1X,y)+font(24,24)+'^B1 '+fd('TOTAL')+':'+fo(RX,y)+font(24,24)+'^B1 '+fd(fmt(total||0))); y+=LH+6;
  zl.push(fo(col1X,y)+font(20,20)+'^B0 '+fd('Paid ('+(paymentMethod||'Cash')+'):')+fo(RX,y)+font(20,20)+' '+fd(fmt(amountPaid||0))); y+=LH+2;
  if (remaining > 0) { zl.push(fo(col1X,y)+font(20,20)+' '+fd('Balance:')+fo(RX,y)+font(20,20)+' '+fd(fmt(remaining))); }
  else { zl.push(fo(col1X,y)+font(20,20)+' '+fd('Change:')+fo(RX,y)+font(20,20)+' '+fd(fmt(Math.abs(remaining)))); }
  y+=15; zl.push(vl(y,3)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(18,18)+' '+fd('Thank you for your business!')); y+=25;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd('Items not collected after 30 days attract storage fees.')); y+=20;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(16,16)+' '+fd('After 60 days items may be disposed of.')); y+=20;
  zl.push('^XZ');

  tryPrintZPL(zl.join('\n')).catch(() => {});

  // Always return PDF
  try {
    const pdfBuf = await generateReceiptPDF({
      title: 'PAYMENT RECEIPT',
      ticketId, ticketNumber, customerName, customerPhone, date,
      items: flatRows,
      subtotal: subtotal || total || 0,
      tax: tax || undefined,
      total: total || 0,
      amountPaid: amountPaid || 0,
      balance: remaining,
      paymentMethod: paymentMethod || 'Cash',
    });
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
