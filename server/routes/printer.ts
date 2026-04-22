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

// ─────────────────────────────────────────────────────────────────────────────
// PDF receipt generator — returns a Buffer ready to send as a PDF response
// ─────────────────────────────────────────────────────────────────────────────
async function generateReceiptPDF(data: {
  title: string;
  ticketId?: string;
  ticketNumber?: string;
  customerName?: string;
  customerPhone?: string;
  date?: string;
  promisedDate?: string;
  items: { description: string; price: number }[];
  subtotal: number;
  tax?: number;
  total: number;
  amountPaid?: number;
  balance?: number;
  paymentMethod?: string;
  notes?: string;
}): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  // 80mm thermal receipt style: 226pt wide, auto height
  const doc = new PDFDocument({ margin: 15, size: [226, 600], layout: 'portrait' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const W = 196; // content width
  const RX = 160; // amount column start
  const fmt = (n: number) => 'UGX ' + (n || 0).toLocaleString('en-US');

  let y = 15;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold');
  doc.text('KAMPANIS', 0, y, { align: 'center', width: 226 });
  y += 20;
  doc.fontSize(8).font('Helvetica');
  doc.text('Shoes & Bags Clinic', 0, y, { align: 'center', width: 226 });
  y += 11;
  doc.fontSize(6.5).fillColor('#777777');
  doc.text('FORESET MALL, KOLOLO, KAMPALA, UGANDA', 0, y, { align: 'center', width: 226 });
  y += 11;
  doc.moveTo(15, y).lineTo(211, y).strokeColor('#cccccc').stroke(); y += 9;

  doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
  doc.text(data.title, 0, y, { align: 'center', width: 226 });
  y += 9;
  doc.moveTo(15, y).lineTo(211, y).strokeColor('#dddddd').stroke(); y += 9;

  // ── Info block ───────────────────────────────────────────────────────────
  const infoPairs: [string, string][] = [];
  if (data.ticketNumber) infoPairs.push(['Ticket No', data.ticketNumber]);
  if (data.date) infoPairs.push(['Date', data.date]);
  if (data.customerName) infoPairs.push(['Customer', data.customerName]);
  if (data.customerPhone) infoPairs.push(['Phone', data.customerPhone]);
  if (data.promisedDate) infoPairs.push(['Ready On', data.promisedDate]);

  doc.fontSize(7.5).font('Helvetica');
  for (const [label, value] of infoPairs) {
    doc.fillColor('#999999').text(label + ': ', 15, y, { width: 70 });
    doc.fillColor('#222222').text(value || 'N/A', 85, y, { width: RX - 85 });
    y += 12;
  }
  y += 4;
  doc.moveTo(15, y).lineTo(211, y).strokeColor('#cccccc').stroke(); y += 9;

  // ── Column headers ───────────────────────────────────────────────────────
  doc.fillColor('#888888').fontSize(7).font('Helvetica-Bold');
  doc.text('SERVICE', 15, y, { width: 130 });
  doc.text('AMOUNT', RX, y, { align: 'right', width: 66 });
  y += 7;
  doc.moveTo(15, y).lineTo(211, y).strokeColor('#dddddd').stroke(); y += 6;

  // ── Line items ───────────────────────────────────────────────────────────
  // For each item, render multiline detail block: category → size → color → service
  const DESC_X = 15;
  const AMT_X = 160;      // right-align amounts within the 226pt page
  const AMT_W = 51;
  doc.font('Helvetica').fillColor('#222222').fontSize(8);
  for (const item of data.items) {
    // description carries the full detail text
    const lines = (item.description || 'Service').split('\n');
    let maxHeight = 0;
    for (const line of lines) {
      const lh = doc.heightOfString(line, { width: 130 });
      doc.text(line, DESC_X, y, { width: 130, height: lh });
      maxHeight = Math.max(maxHeight, lh);
    }
    const amtStr = fmt(item.price);
    doc.text(amtStr, AMT_X, y, { align: 'right', width: AMT_W });
    y += Math.max(maxHeight + 2, 13);
  }

  y += 4;
  doc.moveTo(15, y).lineTo(211, y).strokeColor('#cccccc').stroke(); y += 9;

  // ── Totals ───────────────────────────────────────────────────────────────
  const totals: [string, string, boolean][] = [];
  totals.push(['Subtotal', fmt(data.subtotal || data.total), false]);
  if (data.tax) totals.push(['Tax', fmt(data.tax), false]);
  totals.push(['TOTAL', fmt(data.total), true]);

  for (const [label, value, bold] of totals) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 9.5 : 8);
    doc.fillColor(bold ? '#000000' : '#555555').text(label + ':', 15, y, { width: 130 });
    doc.fillColor('#000000').text(value, RX, y, { align: 'right', width: 66 });
    y += bold ? 14 : 12;
  }

  if (data.amountPaid !== undefined) {
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text('Paid (' + (data.paymentMethod || 'Cash') + '):', 15, y, { width: 130 });
    doc.fillColor('#000000').text(fmt(data.amountPaid), RX, y, { align: 'right', width: 66 });
    y += 12;
    if (data.balance !== undefined && data.balance !== 0) {
      doc.font('Helvetica-Bold').fillColor(data.balance > 0 ? '#cc2200' : '#008800');
      doc.text(data.balance > 0 ? 'Balance:' : 'Change:', 15, y, { width: 130 });
      doc.text(fmt(Math.abs(data.balance)), RX, y, { align: 'right', width: 66 });
      y += 12;
    }
  }

  // ── Barcode & REG/PICKUP ─────────────────────────────────────────────
  if (data.promisedDate) {
    y += 6;
    doc.moveTo(15, y).lineTo(211, y).strokeColor('#cccccc').stroke(); y += 9;
    // Barcode image via external URL (tec-it.com free barcode API)
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
        doc.image(imgBuf, 60, y, { width: 106, height: 40 });
        y += 45;
      }
    } catch (_e) {
      // Barcode unavailable — skip silently
    }
    // REG/PICKUP label below barcode
    doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
    doc.text('REG/PICKUP', 0, y, { align: 'center', width: 226 });
    y += 14;
  }

  // ── Notes ────────────────────────────────────────────────────────────────
  if (data.notes) {
    y += 4;
    doc.moveTo(15, y).lineTo(211, y).strokeColor('#dddddd').stroke(); y += 8;
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#888888').text('Notes:', 15, y, { width: W }); y += 10;
    doc.font('Helvetica').fillColor('#444444');
    const noteLines = doc.wrapText(String(data.notes), W);
    for (const line of noteLines) { doc.text(line, 15, y, { width: W }); y += 10; }
    y += 4;
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.moveTo(15, y).lineTo(211, y).strokeColor('#cccccc').stroke(); y += 9;
  doc.fillColor('#999999').fontSize(7).font('Helvetica');
  doc.text('Thank you for your business!', 0, y, { align: 'center', width: 226 }); y += 11;
  doc.fontSize(6).fillColor('#bbbbbb');
  doc.text('Items not collected after 30 days attract storage fees.', 0, y, { align: 'center', width: 226 }); y += 9;
  doc.text('After 60 days items may be disposed of.', 0, y, { align: 'center', width: 226 });

  // doc.end() returns undefined (not a Promise) — wait for 'end' event
  await new Promise<void>((resolve) => {
    doc.on('end', resolve);
    doc.end();
  });
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
router.post('/print/order/:id', async (req, res) => {
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
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(60,60)+' '+fd('KAMPANIS')); y+=65;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(28,28)+' '+fd('Shoes & Bags Clinic')); y+=35;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(20,20)+' '+fd('FORESET MALL, KOLOLO, KAMPALA, UGANDA')); y+=30;
  zl.push(vl(y,3)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(30,30)+' '+fd('ORDER TICKET')); y+=10;
  zl.push(vl(y,2)); y+=15;
  const col1X = LM, col2X = LM + 150;
  const ip: [string, string][] = [
    ['Order No', order.ticket_number || order.id],
    ['Date', new Date(order.created_at).toLocaleDateString('en-UG', { day:'2-digit', month:'short', year:'numeric' })],
    ['Customer', order.customer_name || 'N/A'],
  ];
  if (order.customer_phone) ip.push(['Phone', order.customer_phone]);
  for (const [l, v] of ip) { zl.push(fo(col1X,y)+font(22,22)+'^B1 '+fd(l+' :')); zl.push(fo(col2X,y)+font(22,22)+'^B0 '+fd(v)); y+=LH+4; }
  if (order.promised_date) { zl.push(fo(col1X,y)+font(22,22)+'^B1 '+fd('Ready On :')); zl.push(fo(col2X,y)+font(22,22)+'^B1 '+fd(new Date(order.promised_date).toLocaleDateString('en-UG', {day:'2-digit',month:'short',year:'numeric'}))); y+=LH+4; }
  y+=5; zl.push(vl(y,2)); y+=12;
  zl.push(fo(0,y)+fb(W,1,0,0,'C')+' '+font(22,22)+' ^B1 '+fd('ITEMS TO WORK ON')); y+=8;
  zl.push(vl(y,2)); y+=12;
  zl.push(fo(LM,y)+font(18,18)+' '+fd('Service / Item')); zl.push(fo(RX,y)+font(18,18)+' '+fd('Amount')); y+=8;
  zl.push(vl(y,1)); y+=10;
  if (lineItems.length > 0) {
    for (const item of lineItems) { zl.push(fo(LM,y)+font(20,20)+' '+fd(item.description.substring(0,35))); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(item.price))); y+=LH+3; }
  } else { zl.push(fo(LM,y)+font(20,20)+' '+fd('No charge')); zl.push(fo(RX,y)+font(20,20)+' '+fd(fmt(0))); y+=LH+3; }
  y+=5; zl.push(vl(y,1)); y+=10;
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
      date: new Date(order.created_at).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }),
      promisedDate: order.promised_date ? new Date(order.promised_date).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
      items: lineItems,
      subtotal,
      total: orderTotal,
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

router.post('/print/policy', async (req, res) => {
  try {
    const data: PolicyPrintData = req.body;
    if (!data || !data.ticketNumber) {
      res.status(400).json({ error: 'Missing required fields: ticketNumber' });
      return;
    }
    const pdfBuf = await generatePolicyPDF(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="policies-' + (data.ticketNumber || 'receipt') + '.pdf"');
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
