import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

// GET /api/staff-messages/conversations - Get all conversations for current user
router.get('/conversations', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const conversations = await db.all(`
      SELECT
        sc.*,
        u1.name as participant1_name,
        u2.name as participant2_name,
        (
          SELECT content FROM staff_messages
          WHERE conversation_id = sc.id
          ORDER BY created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM staff_messages
          WHERE conversation_id = sc.id AND sender_id != ? AND is_read = 0
        ) as unread_count
      FROM staff_conversations sc
      JOIN users u1 ON sc.participant1_id = u1.id
      JOIN users u2 ON sc.participant2_id = u2.id
      WHERE sc.participant1_id = ? OR sc.participant2_id = ?
      ORDER BY sc.last_message_at DESC
    `, [userId, userId, userId]);

    // Transform to include the "other" participant name
    const transformed = conversations.map((c: any) => ({
      id: c.id,
      otherParticipant: c.participant1_id === userId ? {
        id: c.participant2_id,
        name: c.participant2_name
      } : {
        id: c.participant1_id,
        name: c.participant1_name
      },
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      unreadCount: c.unread_count
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/staff-messages/conversations/:id - Get messages in a conversation
router.get('/conversations/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is part of this conversation
    const conversation = await db.get(`
      SELECT * FROM staff_conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [id, userId, userId]);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messages = await db.all(`
      SELECT sm.*, u.name as sender_name
      FROM staff_messages sm
      JOIN users u ON sm.sender_id = u.id
      WHERE sm.conversation_id = ?
      ORDER BY sm.created_at ASC
    `, [id]);

    // Mark messages as read
    await db.run(`
      UPDATE staff_messages SET is_read = 1
      WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    `, [id, userId]);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/staff-messages/conversations - Start or get a conversation with a user
router.post('/conversations', authenticateToken, async (req: any, res: any) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID required' });
    }

    if (recipientId === senderId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Check if conversation exists
    let conversation = await db.get(`
      SELECT * FROM staff_conversations
      WHERE (participant1_id = ? AND participant2_id = ?)
         OR (participant1_id = ? AND participant2_id = ?)
    `, [senderId, recipientId, recipientId, senderId]);

    // Create if doesn't exist
    if (!conversation) {
      const id = uuidv4();
      const now = new Date().toISOString();
      await db.run(`
        INSERT INTO staff_conversations (id, participant1_id, participant2_id, created_at, last_message_at)
        VALUES (?, ?, ?, ?, ?)
      `, [id, senderId, recipientId, now, now]);
      conversation = { id };
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// POST /api/staff-messages - Send a message
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    if (!conversationId || !content) {
      return res.status(400).json({ error: 'Conversation ID and content required' });
    }

    // Verify user is part of this conversation
    const conversation = await db.get(`
      SELECT * FROM staff_conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [conversationId, senderId, senderId]);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Insert message
    await db.run(`
      INSERT INTO staff_messages (id, conversation_id, sender_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, conversationId, senderId, content.trim(), now]);

    // Update conversation last_message_at
    await db.run(`
      UPDATE staff_conversations SET last_message_at = ? WHERE id = ?
    `, [now, conversationId]);

    // Get sender name
    const sender = await db.get('SELECT name FROM users WHERE id = ?', [senderId]);

    res.json({
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: sender?.name,
      content: content.trim(),
      is_read: false,
      created_at: now
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/staff-messages/unread-count - Get total unread count
router.get('/unread-count', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const result = await db.get(`
      SELECT COUNT(*) as count FROM staff_messages sm
      JOIN staff_conversations sc ON sm.conversation_id = sc.id
      WHERE (sc.participant1_id = ? OR sc.participant2_id = ?)
        AND sm.sender_id != ?
        AND sm.is_read = 0
    `, [userId, userId, userId]);

    res.json({ count: result?.count || 0 });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// GET /api/staff-messages/users - Get all staff users (for composing new message)
router.get('/users', authenticateToken, async (req: any, res: any) => {
  try {
    const users = await db.all(`
      SELECT id, name, email, role FROM users
      WHERE status = 'active'
      ORDER BY name ASC
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
