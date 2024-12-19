import express from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all supplies items with optional category filter
router.get('/supplies', (req, res) => {
  try {
    const { category } = req.query;
    console.log('Fetching supplies for category:', category);
    
    const query = category 
      ? 'SELECT * FROM supplies WHERE LOWER(category) = LOWER(?)'
      : 'SELECT * FROM supplies';
    
    const items = category
      ? db.prepare(query).all(category)
      : db.prepare(query).all();
    
    console.log('Found items:', items.length);
    console.log('Sample item:', items[0]);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching supplies:', error);
    res.status(500).json({ error: 'Failed to fetch supplies items' });
  }
});

// Add new supply item
router.post('/supplies', (req, res) => {
  try {
    const { name, category, description, onHand, minStock, cost, unit } = req.body;
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO supplies (
        id, name, category, description, on_hand, min_stock, cost, unit,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), name, category, description, onHand, minStock, cost, unit,
      now, now
    );
    
    const item = db.prepare('SELECT * FROM supplies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating supply:', error);
    res.status(500).json({ error: 'Failed to create supply item' });
  }
});

// Update supply item
router.put('/supplies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, onHand, minStock, cost, unit } = req.body;
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE supplies SET
        name = ?,
        category = ?,
        description = ?,
        on_hand = ?,
        min_stock = ?,
        cost = ?,
        unit = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name, category, description, onHand, minStock, cost, unit,
      now, id
    );
    
    const item = db.prepare('SELECT * FROM supplies WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Supply item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error updating supply:', error);
    res.status(500).json({ error: 'Failed to update supply item' });
  }
});

// Delete supply item
router.delete('/supplies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM supplies WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Supply item not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting supply:', error);
    res.status(500).json({ error: 'Failed to delete supply item' });
  }
});

export default router;
