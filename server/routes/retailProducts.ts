import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken, requireRole } from './auth';

const router = express.Router();

// GET /api/retail-products - Get all active products
router.get('/', async (req, res) => {
  try {
    const products = await db.prepare(`
      SELECT * FROM retail_products
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `).all();
    res.json(products);
  } catch (error) {
    console.error('Error fetching retail products:', error);
    res.status(500).json({ error: 'Failed to fetch retail products' });
  }
});

// GET /api/retail-products/categories - Get unique categories from active products
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.prepare(`
      SELECT DISTINCT category
      FROM retail_products
      WHERE is_active = true
      ORDER BY category
    `).all();
    res.json(categories.map((c: any) => c.category));
  } catch (error) {
    console.error('Error fetching retail product categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/retail-products/category/:category - Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = await db.prepare(`
      SELECT * FROM retail_products
      WHERE is_active = true AND category = ?
      ORDER BY display_order ASC, name ASC
    `).all(category);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/retail-products - Create new product
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, description, default_price, icon, display_order, image_url } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO retail_products (
        id, name, category, description, default_price, icon, display_order, image_url,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      name,
      category,
      description || null,
      default_price || 0,
      icon || null,
      Number.isFinite(display_order) ? Number(display_order) : 999,
      image_url || null,
      now,
      now
    );

    const newProduct = await db.prepare('SELECT * FROM retail_products WHERE id = ?').get(id);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating retail product:', error);
    res.status(500).json({ error: 'Failed to create retail product' });
  }
});

// PUT /api/retail-products/:id - Update product
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    // Build dynamic SET clause from provided fields
    const setClauses: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name',
      category: 'category',
      description: 'description',
      default_price: 'default_price',
      icon: 'icon',
      display_order: 'display_order',
      is_active: 'is_active',
      image_url: 'image_url'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in updates) {
        setClauses.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    }

    // Always update updated_at
    setClauses.push('updated_at = ?');
    values.push(now);

    // Add id as final parameter
    values.push(id);

    const result = await db.prepare(`
      UPDATE retail_products
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `).run(...values);

    if ((result as any).changes > 0) {
      const updatedProduct = await db.prepare('SELECT * FROM retail_products WHERE id = ?').get(id);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating retail product:', error);
    res.status(500).json({ error: 'Failed to update retail product' });
  }
});

// DELETE /api/retail-products/:id - Soft delete product
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    const result = await db.prepare(`
      UPDATE retail_products
      SET is_active = false, updated_at = ?
      WHERE id = ? AND is_active = true
    `).run(now, id);

    if ((result as any).changes > 0) {
      res.json({ message: 'Product deactivated successfully' });
    } else {
      res.status(404).json({ error: 'Product not found or already inactive' });
    }
  } catch (error) {
    console.error('Error deactivating retail product:', error);
    res.status(500).json({ error: 'Failed to deactivate retail product' });
  }
});

export default router;
