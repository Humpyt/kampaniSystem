import { Router } from 'express';
import { pool } from '../database.js';

const router = Router();

// GET /api/ticket/next - Get next ticket number for current month
router.get('/next', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Lock the highest existing ticket row to prevent concurrent reads
    const result = await client.query(
      `SELECT ticket_number FROM operations
       WHERE ticket_number LIKE $1
       ORDER BY ticket_number DESC
       LIMIT 1
       FOR UPDATE`,
      [`${yearMonth}-%`]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
      const highestTicket = result.rows[0].ticket_number;
      // Extract sequence number from "YYYY-MM-NNNN" format
      const parts = highestTicket.split('-');
      if (parts.length === 3) {
        sequence = parseInt(parts[2], 10) + 1;
      }
    }

    const ticket_number = `${yearMonth}-${String(sequence).padStart(4, '0')}`;
    await client.query('COMMIT');
    res.json({ ticket_number });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('ticket/next error:', error);
    res.status(500).json({ error: 'Failed to generate ticket number' });
  } finally {
    client.release();
  }
});

export default router;
