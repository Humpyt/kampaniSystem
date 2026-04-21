import express from 'express';
import db from '../database';
import { formatCurrency } from '../utils/formatCurrency';

const router = express.Router();

// Store printer configuration in memory (in production, this should be in a database)
let printerConfig = {
  type: 'EPSON',
  interface: 'printer:auto',
  characterSet: 'PC437_USA',
  removeSpecialCharacters: false,
  options: {
    timeout: 5000
  },
  width: 42
};

// Lazily load printer modules
let printerModule: any = null;
let escposModule: any = null;

async function loadPrinterModules() {
  if (!printerModule) {
    try {
      printerModule = await import('node-thermal-printer');
    } catch (error) {
      console.error('Error loading node-thermal-printer:', error);
    }
  }
  if (!escposModule) {
    try {
      escposModule = await import('escpos-usb');
    } catch (error) {
      console.error('Error loading escpos-usb:', error);
    }
  }
  return { printerModule, escposModule };
}

// Get printer configuration
router.get('/config', (req, res) => {
  res.json(printerConfig);
});

// Update printer configuration
router.put('/config', (req, res) => {
  try {
    printerConfig = {
      ...printerConfig,
      ...req.body
    };
    res.json(printerConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update printer configuration' });
  }
});

// Print receipt for an order
router.post('/print/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details with customer info and payment info
    const order = await db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.id as customer_id
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get shoes and services for the order
    const shoes = await db.prepare(`
      SELECT os.*, s.name as service_name, s.price as service_base_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = ?
    `).all(id);

    // Get payment records for this order
    const payments = await db.prepare(`
      SELECT * FROM operation_payments WHERE operation_id = ?
    `).all(id);

    const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const { printerModule, escposModule } = await loadPrinterModules();
    
    if (!printerModule || !printerModule.ThermalPrinter) {
      return res.status(500).json({ error: 'Printer module not available' });
    }

    const { ThermalPrinter } = printerModule;
    const { USB } = escposModule || {};

    // Create printer instance
    const printer = new ThermalPrinter(printerConfig);

    // Print header with business name and address
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('Kampani Shoes and Bag Clinic');
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.println('FORESTMALL, KAMPALA, Uganda');
    printer.newLine();

    // Print order number and Customer Copy label
    printer.alignCenter();
    printer.bold(true);
    printer.println(`${order.ticket_number || order.id} - Customer Copy`);
    printer.bold(false);
    printer.newLine();

    // Print customer info block
    printer.alignLeft();
    
    // Format date: 30 Mar, 2026 18:09
    const orderDate = new Date(order.created_at);
    const day = orderDate.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[orderDate.getMonth()];
    const year = orderDate.getFullYear();
    const hours = orderDate.getHours().toString().padStart(2, '0');
    const minutes = orderDate.getMinutes().toString().padStart(2, '0');
    const dateStr = `${order.customer_name} ${day} ${month}, ${year} ${hours}:${minutes}`;
    
    printer.println(dateStr);
    
    // Shop info
    printer.println('DEF DEF KAMPANISTS-TWO');
    printer.println(', KAMPALA, Uganda');
    
    // Account and phone
    printer.println(`Acct:${order.customer_id || 'N/A'} Tel (${order.customer_phone || 'N/A'})`);
    printer.newLine();

    // Print items with details
    let subtotal = 0;
    shoes.forEach((shoe: any) => {
      // Item description and price
      printer.bold(true);
      printer.println(`1 ${shoe.category || 'Item'} Ush${shoe.price}`);
      printer.bold(false);
      
      // Item attributes/details (color, brand, etc)
      if (shoe.color) printer.println(shoe.color);
      if (shoe.notes) printer.println(shoe.notes);
      
      // Service applied
      if (shoe.service_name) {
        printer.println(`${shoe.service_name} - ${shoe.service_type || 'Standard'}`);
      }
      
      // Pieces
      printer.println('1 PIECES');
      
      subtotal += shoe.price || 0;
      printer.newLine();
    });

    // Print totals block
    const total = subtotal; // Could add tax here if needed
    const balance = total - totalPaid;
    
    printer.drawLine();
    printer.alignRight();
    printer.println(`SubTotal: Ush${subtotal}`);
    printer.bold(true);
    printer.println(`Total: Ush${total}`);
    printer.bold(false);
    printer.println(`Paid Amount: Ush${totalPaid}`);
    printer.bold(true);
    printer.println(`Balance: Ush${balance}`);
    printer.bold(false);
    printer.newLine();

    // Print promised pickup date
    if (order.promised_date) {
      const promDate = new Date(order.promised_date);
      const promDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][promDate.getDay()];
      const promDay = promDate.getDate().toString().padStart(2, '0');
      const promMonth = (promDate.getMonth() + 1).toString().padStart(2, '0');
      const promYear = promDate.getFullYear();
      const promHours = promDate.getHours().toString().padStart(2, '0');
      const promMinutes = promDate.getMinutes().toString().padStart(2, '0');
      
      printer.drawLine();
      printer.alignCenter();
      printer.println(`${promDayName}${promDay}/${promMonth}/${promYear} ${promHours}:${promMinutes}`);
      printer.bold(true);
      printer.println('REG/PICKUP');
      printer.bold(false);
      printer.newLine();
    }

    // Print footer
    printer.alignCenter();
    printer.println('Thank You for Your Business');
    printer.println('Store Hours Mon-Fri:8:00AM - 6:30PM');
    printer.println('Saturday: 8:30AM - 5:00PM');
    printer.newLine();
    
    printer.cut();

    try {
      if (!USB) {
        return res.status(500).json({ error: 'USB printer module not available' });
      }
      // Find available USB printer
      const device = new USB();
      await printer.execute(device);
      res.json({ success: true, message: 'Receipt printed successfully' });
    } catch (printError: any) {
      console.error('Printer error:', printError);
      res.status(500).json({ error: 'Failed to print receipt', details: printError.message });
    }

  } catch (error) {
    console.error('Error processing print request:', error);
    res.status(500).json({ error: 'Failed to process print request' });
  }
});

// Print store policy on 8x27cm thermal paper
router.post('/print/policy', async (req: Request, res: Response) => {
  const { ticketNumber, date, customerNumber, customerName } = req.body;

  try {
    const { printerModule, escposModule } = await loadPrinterModules();

    if (!printerModule || !printerModule.ThermalPrinter) {
      return res.status(500).json({ error: 'Printer module not available' });
    }

    const { ThermalPrinter } = printerModule;
    const { USB } = escposModule || {};

    const printer = new ThermalPrinter(printerConfig);
    printer.clear();

    // === HEADER (centered, bold) ===
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('STORE POLICIES');
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.newLine();

    // === TICKET INFO (left-aligned) ===
    printer.alignLeft();
    printer.println(`Ticket No: ${ticketNumber || 'N/A'}`);
    printer.println(`Date: ${date || new Date().toLocaleDateString()}`);
    printer.println(`Customer No: ${customerNumber || 'N/A'}`);
    printer.println(`Name: ${customerName || 'N/A'}`);
    printer.newLine();

    // === CLEANING SECTION ===
    printer.bold(true);
    printer.println('Cleaning:');
    printer.bold(false);
    printer.println('(1) May cause all material types to become tender, stiff, brittle and may cause some buckling and peeling.');
    printer.println('(2) Shrinkage of all material types is unpredictable and may occur.');
    printer.println('(3) Slight changes in shades or top finish may occur on all material types.');
    printer.println('(4) Insect bites and scars on leather skins, which were covered over by the manufacture, could show afterward.');
    printer.println('(5) Breaks and skin lines may show to be more apparent.');
    printer.println('(6) Unevenly matched skins are common and may show more uneven.');
    printer.println('(7) May cause bleeding on all material types, which in turn, causes change of color.');
    printer.println('(8) May cause hardware pieces to bleed onto all material types and may stain material.');
    printer.newLine();
    printer.println('We cannot guarantee that all cleaning request will meet products original condition but we will do our best.');
    printer.newLine();

    // === DYEING SECTION ===
    printer.bold(true);
    printer.println('Dyeing:');
    printer.bold(false);
    printer.println('(1) We can not guarantee that the color will match the given swatch 100%.');
    printer.println('(2) Certain imperfections in the construction of the item may become visible after the item is dyed.');
    printer.println('(3) The dyed color will look different when viewed in different types of lighting.');
    printer.println('(4) If shoes are worn in the rain or come in contact with water the color may come off and/or bleed onto a material.');
    printer.newLine();

    // === SHOE REPAIR/HANDBAG REPAIR/ALTERATIONS SECTION ===
    printer.bold(true);
    printer.println('Shoe Repair/Handbag Repair/Alterations:');
    printer.bold(false);
    printer.println('(1) We cannot guarantee that all shoe repair/handbag repair/alterations request will meet products original condition but we will do our best.');
    printer.newLine();

    // === SHOE STRETCHING SECTION ===
    printer.bold(true);
    printer.println('Shoe Stretching:');
    printer.bold(false);
    printer.println('(1) May cause some wrinkling, buckling and peeling.');
    printer.println('(2) Slight changes in shades or top finish may occur on all material types.');
    printer.println('(3) Stretching the width may or may not give you more room in the length.');
    printer.println('(4) Stretching may cause some finished imperfections on the innersole and/or lining.');
    printer.newLine();

    // === STORAGE SECTION ===
    printer.bold(true);
    printer.println('Storage:');
    printer.bold(false);
    printer.println('(1) After one month from the date received items are sent to storage, fee of $5 per month.');
    printer.println('(2) After six months from the date received items are disposed of at our own discretion.');
    printer.newLine();

    // === SIGNATURE LINE ===
    printer.println('I have read the policies and understand that you will carefully service my item(s) to the best of your ability.');
    printer.newLine();
    printer.println('Signature: _________________________________');

    // === CUT PAPER ===
    printer.cut();

    try {
      if (!USB) {
        return res.status(500).json({ error: 'USB printer module not available' });
      }
      const device = new USB();
      await printer.execute(device);
      res.json({ success: true });
    } catch (printError: any) {
      console.error('Printer error:', printError);
      res.status(500).json({ error: 'Failed to print policy', details: printError.message });
    }
  } catch (error) {
    console.error('Policy print error:', error);
    res.status(500).json({ error: 'Failed to print policy' });
  }
});

// Print quotation
router.post('/print/quotation/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get quotation details with customer info
    const quotation = await db.prepare(`
      SELECT q.*, c.name as customer_name, c.phone as customer_phone
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ?
    `).get(id);

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const { printerModule, escposModule } = await loadPrinterModules();
    
    if (!printerModule || !printerModule.ThermalPrinter) {
      return res.status(500).json({ error: 'Printer module not available' });
    }

    const { ThermalPrinter } = printerModule;
    const { USB } = escposModule || {};

    // Create printer instance
    const printer = new ThermalPrinter(printerConfig);

    // Print header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('Kampani Shoes and Bag Clinic');
    printer.setTextSize(0, 0);
    printer.println('FORESTMALL, KAMPALA, Uganda');
    printer.bold(false);
    printer.newLine();

    // Print quotation info
    printer.alignLeft();
    printer.bold(true);
    printer.println(`Quotation #: ${quotation.id}`);
    printer.bold(false);
    printer.println(`Date: ${new Date(quotation.created_at).toLocaleDateString()}`);
    if (quotation.valid_until) {
      printer.println(`Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}`);
    }
    printer.println(`Customer: ${quotation.customer_name}`);
    if (quotation.customer_phone) {
      printer.println(`Phone: ${quotation.customer_phone}`);
    }
    printer.drawLine();

    // Print items and total
    printer.bold(true);
    printer.println(`Total Estimate: ${formatCurrency(quotation.estimated_total)}`);
    printer.bold(false);
    printer.newLine();

    // Print footer
    printer.alignCenter();
    printer.println('This is an estimate only.');
    printer.println('Actual price may vary based on inspection.');
    printer.newLine();
    printer.println('Thank you for choosing us!');
    printer.cut();

    try {
      if (!USB) {
        return res.status(500).json({ error: 'USB printer module not available' });
      }
      // Find available USB printer
      const device = new USB();
      await printer.execute(device);
      res.json({ success: true, message: 'Quotation printed successfully' });
    } catch (printError: any) {
      console.error('Printer error:', printError);
      res.status(500).json({ error: 'Failed to print quotation', details: printError.message });
    }

  } catch (error) {
    console.error('Error processing print request:', error);
    res.status(500).json({ error: 'Failed to process print request' });
  }
});

export default router;
