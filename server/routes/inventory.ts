import express from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all inventory items with optional category filter
router.get('/supplies', (req, res) => {
  try {
    const { category } = req.query;
    const query = category 
      ? 'SELECT * FROM inventory_items WHERE category = ?'
      : 'SELECT * FROM inventory_items';
    
    const items = category
      ? db.prepare(query).all(category)
      : db.prepare(query).all();
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Add new inventory item
router.post('/supplies', (req, res) => {
  try {
    const { itemNo, category, vendor, upcSku, description, location, cost, onHand, minStock } = req.body;
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO inventory_items (
        id, item_no, category, vendor, upc_sku, description, location, 
        cost, on_hand, min_stock, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), itemNo, category, vendor, upcSku, description, location,
      cost, onHand, minStock, now, now
    );
    
    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/supplies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { itemNo, category, vendor, upcSku, description, location, cost, onHand, minStock } = req.body;
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE inventory_items SET
        item_no = ?, category = ?, vendor = ?, upc_sku = ?,
        description = ?, location = ?, cost = ?, on_hand = ?,
        min_stock = ?, updated_at = ?
      WHERE id = ?
    `).run(
      itemNo, category, vendor, upcSku, description, location,
      cost, onHand, minStock, now, id
    );
    
    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/supplies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
    if (result.changes > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Search inventory items
router.get('/supplies/search', (req, res) => {
  try {
    const { query } = req.query;
    const items = db.prepare(`
      SELECT * FROM inventory_items 
      WHERE item_no LIKE ? 
      OR description LIKE ? 
      OR upc_sku LIKE ?
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search inventory items' });
  }
});

// Update stock level
router.patch('/supplies/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE inventory_items 
      SET on_hand = ?, updated_at = ?
      WHERE id = ?
    `).run(quantity, now, id);
    
    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock level' });
  }
});

// Bulk update supplies
router.post('/supplies/bulk-update', (req, res) => {
  try {
    const { items } = req.body;
    
    for (const item of items) {
      const { id, quantity } = item;
      
      // Get current supply
      const supply = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
      if (!supply) {
        return res.status(404).json({ error: `Supply ${id} not found` });
      }

      // Calculate new quantity
      const newQuantity = supply.on_hand - quantity;
      if (newQuantity < 0) {
        return res.status(400).json({ error: `Not enough quantity in stock for supply ${id}` });
      }

      // Update quantity
      db.prepare('UPDATE inventory_items SET on_hand = ? WHERE id = ?').run(newQuantity, id);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update supplies' });
  }
});

export default router;
