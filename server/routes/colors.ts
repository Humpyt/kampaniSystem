import express from 'express';
import db from '../database';

const router = express.Router();

// Get all active colors
router.get('/', async (req, res) => {
  try {
    const colors = await db.prepare(`
      SELECT id, name, hex_code, display_order
      FROM colors
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `).all();

    res.json(colors.map((color: any) => ({
      id: color.id,
      name: color.name,
      hexCode: color.hex_code,
      displayOrder: color.display_order,
      isRainbow: color.hex_code === '#RAINBOW'
    })));
  } catch (error) {
    console.error('Failed to fetch colors:', error);
    res.status(500).json({ error: 'Failed to fetch colors' });
  }
});

export default router;
