import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = express.Router();

// Initialize QR codes table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS qrcodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Get all QR codes
router.get('/', (req, res) => {
  try {
    const qrCodes = db.prepare(`
      SELECT * FROM qrcodes 
      ORDER BY created_at DESC
    `).all();
    res.json(qrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

// Create a new QR code
router.post('/', (req, res) => {
  try {
    const { type, label, data } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO qrcodes (id, type, label, data)
      VALUES (?, ?, ?, ?)
    `).run(id, type, label, data);
    
    const newQRCode = db.prepare('SELECT * FROM qrcodes WHERE id = ?').get(id);
    res.status(201).json(newQRCode);
  } catch (error) {
    console.error('Error creating QR code:', error);
    res.status(500).json({ error: 'Failed to create QR code' });
  }
});

// Delete a QR code
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM qrcodes WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

export default router;
