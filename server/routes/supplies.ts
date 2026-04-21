import express from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all supplies
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM supplies';
    let params: any[] = [];
    
    if (category && category !== 'all') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY name ASC';
    
    const items = await db.prepare(query).all(...params);
    res.json(items);
  } catch (error) {
    console.error('Error fetching supplies:', error);
    res.status(500).json({ error: 'Failed to fetch supplies' });
  }
});

// Get a single supply item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.prepare('SELECT * FROM supplies WHERE id = ?').get(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Supply item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching supply item:', error);
    res.status(500).json({ error: 'Failed to fetch supply item' });
  }
});

// Create a new supply item
router.post('/', async (req, res) => {
  try {
    const { name, category, price, quantity, image_url } = req.body;
    
    // Validate required fields
    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate price and quantity
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    
    await db.prepare(`
      INSERT INTO supplies (
        id, name, category, price, quantity,
        image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, category, price, quantity, image_url || null, now, now);
    
    const newItem = await db.prepare('SELECT * FROM supplies WHERE id = ?').get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating supply item:', error);
    res.status(500).json({ error: 'Failed to create supply item' });
  }
});

// Update a supply item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, quantity, image_url } = req.body;
    
    // Validate required fields
    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate price and quantity
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const now = new Date().toISOString();
    
    await db.prepare(`
      UPDATE supplies SET
        name = ?,
        category = ?,
        price = ?,
        quantity = ?,
        image_url = ?,
        updated_at = ?
      WHERE id = ?
    `).run(name, category, price, quantity, image_url || null, now, id);
    
    const updatedItem = await db.prepare('SELECT * FROM supplies WHERE id = ?').get(id);
    if (!updatedItem) {
      return res.status(404).json({ error: 'Supply item not found' });
    }
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating supply item:', error);
    res.status(500).json({ error: 'Failed to update supply item' });
  }
});

// Delete a supply item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.prepare('DELETE FROM supplies WHERE id = ?').run(id);
    
    if ((result as any).changes === 0) {
      return res.status(404).json({ error: 'Supply item not found' });
    }
    res.json({ message: 'Supply item deleted successfully' });
  } catch (error) {
    console.error('Error deleting supply item:', error);
    res.status(500).json({ error: 'Failed to delete supply item' });
  }
});

export default router;
