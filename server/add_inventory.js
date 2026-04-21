import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'shoerepair.db'));

const now = new Date().toISOString();

const dummyItems = [
  // Retail Items
  {
    itemNo: 'R001',
    category: 'retail',
    vendor: 'Shoe Care Co',
    upcSku: 'SKU001',
    description: 'Premium Shoe Polish - Black',
    location: 'Shelf A1',
    cost: 5.99,
    onHand: 20,
    minStock: 10
  },
  {
    itemNo: 'R002',
    category: 'retail',
    vendor: 'Shoe Care Co',
    upcSku: 'SKU002',
    description: 'Premium Shoe Polish - Brown',
    location: 'Shelf A1',
    cost: 5.99,
    onHand: 15,
    minStock: 10
  },

  // Supplies
  {
    itemNo: 'S001',
    category: 'supplies',
    vendor: 'Supply Corp',
    upcSku: 'SUP001',
    description: 'Leather Cleaner',
    location: 'Shelf B1',
    cost: 12.99,
    onHand: 8,
    minStock: 5
  },
  {
    itemNo: 'S002',
    category: 'supplies',
    vendor: 'Supply Corp',
    upcSku: 'SUP002',
    description: 'Shoe Brushes',
    location: 'Shelf B2',
    cost: 8.99,
    onHand: 12,
    minStock: 6
  },

  // Raw Materials
  {
    itemNo: 'M001',
    category: 'raw',
    vendor: 'Raw Materials Inc',
    upcSku: 'RAW001',
    description: 'Leather Sheets - Black',
    location: 'Shelf C1',
    cost: 45.99,
    onHand: 5,
    minStock: 3
  },
  {
    itemNo: 'M002',
    category: 'raw',
    vendor: 'Raw Materials Inc',
    upcSku: 'RAW002',
    description: 'Leather Sheets - Brown',
    location: 'Shelf C1',
    cost: 45.99,
    onHand: 4,
    minStock: 3
  },

  // Tools
  {
    itemNo: 'T001',
    category: 'tools',
    vendor: 'Tool Masters',
    upcSku: 'TOOL001',
    description: 'Leather Cutting Knife',
    location: 'Shelf D1',
    cost: 24.99,
    onHand: 3,
    minStock: 2
  },
  {
    itemNo: 'T002',
    category: 'tools',
    vendor: 'Tool Masters',
    upcSku: 'TOOL002',
    description: 'Shoe Stretcher',
    location: 'Shelf D2',
    cost: 89.99,
    onHand: 2,
    minStock: 1
  },

  // Others
  {
    itemNo: 'O001',
    category: 'others',
    vendor: 'Misc Supplies',
    upcSku: 'MISC001',
    description: 'Shoe Laces - Black',
    location: 'Shelf E1',
    cost: 1.99,
    onHand: 50,
    minStock: 20
  },
  {
    itemNo: 'O002',
    category: 'others',
    vendor: 'Misc Supplies',
    upcSku: 'MISC002',
    description: 'Shoe Laces - Brown',
    location: 'Shelf E1',
    cost: 1.99,
    onHand: 45,
    minStock: 20
  }
];

// Insert dummy items
const stmt = db.prepare(`
  INSERT INTO inventory_items (
    id, item_no, category, vendor, upc_sku, description, location,
    cost, on_hand, min_stock, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

dummyItems.forEach(item => {
  try {
    stmt.run(
      uuidv4(),
      item.itemNo,
      item.category,
      item.vendor,
      item.upcSku,
      item.description,
      item.location,
      item.cost,
      item.onHand,
      item.minStock,
      now,
      now
    );
    console.log(`Added inventory item: ${item.description}`);
  } catch (err) {
    console.error(`Failed to add item ${item.description}:`, err.message);
  }
});

console.log('Dummy inventory items added successfully!');
