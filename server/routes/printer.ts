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

// Dynamically import printer module
let ThermalPrinter, PrinterTypes, CharacterSet, USB;
try {
  ({ ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer'));
  ({ USB } = require('escpos-usb'));
} catch (error) {
  console.error('Error loading printer module:', error);
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
    
    // Get order details with customer info
    const order = db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM operations o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get shoes and services for the order
    const shoes = db.prepare(`
      SELECT os.*, s.name as service_name, s.price as service_base_price
      FROM operation_shoes os
      LEFT JOIN operation_services oss ON os.id = oss.operation_shoe_id
      LEFT JOIN services s ON oss.service_id = s.id
      WHERE os.operation_id = ?
    `).all(id);

    if (!ThermalPrinter) {
      return res.status(500).json({ error: 'Printer module not available' });
    }

    // Create printer instance
    const printer = new ThermalPrinter(printerConfig);

    // Print header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('SHOE REPAIR POS');
    printer.bold(false);
    printer.println('123 Main Street');
    printer.println('Phone: (555) 123-4567');
    printer.newLine();

    // Print order info
    printer.alignLeft();
    printer.bold(true);
    printer.println(`Order #: ${order.id}`);
    printer.bold(false);
    printer.println(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
    printer.println(`Customer: ${order.customer_name}`);
    if (order.customer_phone) {
      printer.println(`Phone: ${order.customer_phone}`);
    }
    printer.drawLine();

    // Print items
    printer.bold(true);
    printer.println('ITEMS');
    printer.bold(false);

    let total = 0;
    shoes.forEach((shoe, index) => {
      printer.bold(true);
      printer.println(`Item ${index + 1}: ${shoe.category}`);
      printer.bold(false);
      if (shoe.color) printer.println(`Color: ${shoe.color}`);
      if (shoe.notes) printer.println(`Notes: ${shoe.notes}`);
      
      if (shoe.service_name) {
        printer.alignRight();
        printer.println(`${shoe.service_name}: ${formatCurrency(shoe.price)}`);
        printer.alignLeft();
        total += shoe.price;
      }
      printer.newLine();
    });

    // Print totals
    printer.drawLine();
    printer.alignRight();
    printer.println(`Subtotal: ${formatCurrency(total)}`);
    if (order.tax) {
      printer.println(`Tax: ${formatCurrency(order.tax)}`);
      total += order.tax;
    }
    printer.bold(true);
    printer.println(`Total: ${formatCurrency(total)}`);
    printer.bold(false);
    printer.newLine();

    // Print promised date if exists
    if (order.promised_date) {
      printer.alignCenter();
      printer.println('Ready for pickup on:');
      printer.bold(true);
      printer.setTextSize(1, 1);
      printer.println(new Date(order.promised_date).toLocaleDateString());
      printer.setTextSize(0, 0);
      printer.bold(false);
      printer.newLine();
    }

    // Print notes if exists
    if (order.notes) {
      printer.alignLeft();
      printer.bold(true);
      printer.println('Notes:');
      printer.bold(false);
      printer.println(order.notes);
      printer.newLine();
    }

    // Print footer
    printer.alignCenter();
    printer.println('Thank you for your business!');
    printer.println('Please keep this receipt');
    printer.newLine();
    printer.cut();

    try {
      // Find available USB printer
      const device = new USB();
      await printer.execute(device);
      res.json({ success: true, message: 'Receipt printed successfully' });
    } catch (printError) {
      console.error('Printer error:', printError);
      res.status(500).json({ error: 'Failed to print receipt', details: printError.message });
    }

  } catch (error) {
    console.error('Error processing print request:', error);
    res.status(500).json({ error: 'Failed to process print request' });
  }
});

// Print quotation
router.post('/print/quotation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get quotation details with customer info
    const quotation = db.prepare(`
      SELECT q.*, c.name as customer_name, c.phone as customer_phone
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ?
    `).get(id);

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (!ThermalPrinter) {
      return res.status(500).json({ error: 'Printer module not available' });
    }

    // Create printer instance
    const printer = new ThermalPrinter(printerConfig);

    // Print header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('SHOE REPAIR POS');
    printer.setTextSize(0, 0);
    printer.println('QUOTATION');
    printer.bold(false);
    printer.println('123 Main Street');
    printer.println('Phone: (555) 123-4567');
    printer.newLine();

    // Print quotation info
    printer.alignLeft();
    printer.bold(true);
    printer.println(`Quotation #: ${quotation.id}`);
    printer.bold(false);
    printer.println(`Date: ${new Date(quotation.created_at).toLocaleDateString()}`);
    printer.println(`Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}`);
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
      // Find available USB printer
      const device = new USB();
      await printer.execute(device);
      res.json({ success: true, message: 'Quotation printed successfully' });
    } catch (printError) {
      console.error('Printer error:', printError);
      res.status(500).json({ error: 'Failed to print quotation', details: printError.message });
    }

  } catch (error) {
    console.error('Error processing print request:', error);
    res.status(500).json({ error: 'Failed to process print request' });
  }
});

export default router;
