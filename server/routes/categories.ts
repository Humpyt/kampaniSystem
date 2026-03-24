import express from 'express';
import db from '../database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get a single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    
    await db.prepare(`
      INSERT INTO categories (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(id, name, now, now);
    
    const newCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const now = new Date().toISOString();
    
    const result = await db.prepare(`
      UPDATE categories SET
        name = ?,
        updated_at = ?
      WHERE id = ?
    `).run(name, now, id);
    
    if ((result as any).changes > 0) {
      const updatedCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      res.json(updatedCategory);
    } else {
      res.status(404).json({ error: 'Category not found' });
    }
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is in use
    const itemsUsingCategory = await db.prepare('SELECT COUNT(*) as count FROM supplies WHERE category = ?').get(id);
    if (itemsUsingCategory.count > 0) {
      return res.status(400).json({ error: 'Cannot delete category that is in use' });
    }

    const result = await db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    
    if ((result as any).changes > 0) {
      res.json({ message: 'Category deleted successfully' });
    } else {
      res.status(404).json({ error: 'Category not found' });
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
