import db from './database';
import { v4 as uuidv4 } from 'uuid';

const dummySupplies = [
  // Glue & Thinner
  {
    name: 'Super Glue',
    category: 'Glue & Thinner',
    description: 'Strong instant adhesive for quick repairs',
    on_hand: 50,
    min_stock: 10,
    cost: 11362,
    unit: 'bottle'
  },
  {
    name: 'Contact Cement',
    category: 'Glue & Thinner',
    description: 'Professional grade adhesive for soles',
    on_hand: 25,
    min_stock: 5,
    cost: 60762,
    unit: 'can'
  },
  {
    name: 'Rubber Cement',
    category: 'Glue & Thinner',
    description: 'Flexible adhesive for rubber materials',
    on_hand: 30,
    min_stock: 8,
    cost: 34162,
    unit: 'bottle'
  },

  // Leather & Rubber
  {
    name: 'Full Grain Leather',
    category: 'Leather & Rubber',
    description: 'Premium quality leather for repairs',
    on_hand: 100,
    min_stock: 20,
    cost: 49362,
    unit: 'sqft'
  },
  {
    name: 'Rubber Sole Material',
    category: 'Leather & Rubber',
    description: 'Durable rubber for sole replacement',
    on_hand: 150,
    min_stock: 30,
    cost: 26562,
    unit: 'sheet'
  },

  // Heels
  {
    name: 'Ladies High Heel Tips',
    category: 'Heels',
    description: 'Replacement tips for high heels',
    on_hand: 200,
    min_stock: 50,
    cost: 3762,
    unit: 'pair'
  },
  {
    name: 'Rubber Heel Caps',
    category: 'Heels',
    description: 'Standard replacement heel caps',
    on_hand: 300,
    min_stock: 75,
    cost: 5662,
    unit: 'pair'
  },

  // Cleaners
  {
    name: 'Leather Cleaner',
    category: 'Cleaners',
    description: 'Professional leather cleaning solution',
    on_hand: 40,
    min_stock: 10,
    cost: 37962,
    unit: 'bottle'
  },
  {
    name: 'Suede Brush',
    category: 'Cleaners',
    description: 'Soft brush for suede cleaning',
    on_hand: 25,
    min_stock: 5,
    cost: 18962,
    unit: 'piece'
  },

  // Insoles
  {
    name: 'Memory Foam Insoles',
    category: 'Insoles - Pads & Sock Lining',
    description: 'Comfortable memory foam insoles',
    on_hand: 75,
    min_stock: 15,
    cost: 30362,
    unit: 'pair'
  },
  {
    name: 'Leather Sock Lining',
    category: 'Insoles - Pads & Sock Lining',
    description: 'Premium leather sock lining material',
    on_hand: 50,
    min_stock: 10,
    cost: 22762,
    unit: 'sqft'
  },

  // Nails
  {
    name: 'Shoe Tacks',
    category: 'Nails',
    description: 'Small nails for sole attachment',
    on_hand: 1000,
    min_stock: 200,
    cost: 190,
    unit: 'piece'
  },
  {
    name: 'Heel Pins',
    category: 'Nails',
    description: 'Steel pins for heel repair',
    on_hand: 500,
    min_stock: 100,
    cost: 380,
    unit: 'piece'
  }
];

try {
  // Begin transaction
  db.prepare('BEGIN').run();

  // Clear existing data
  db.prepare('DELETE FROM supplies').run();

  // Insert dummy data
  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT INTO supplies (
      id, name, category, description, on_hand,
      min_stock, cost, unit, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const supply of dummySupplies) {
    insertStmt.run(
      uuidv4(),
      supply.name,
      supply.category,
      supply.description,
      supply.on_hand,
      supply.min_stock,
      supply.cost,
      supply.unit,
      now,
      now
    );
  }

  // Commit transaction
  db.prepare('COMMIT').run();
  console.log('Dummy supplies data added successfully');
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error adding dummy supplies:', error);
  process.exit(1);
}
