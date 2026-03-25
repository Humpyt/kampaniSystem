import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'shoe-repair-pos-secret-key-change-in-production';

// Helper: Generate JWT token
const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper: Verify JWT token
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware: Authenticate JWT token
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

// Middleware: Check if user has required role
export const requireRole = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// POST /api/auth/register - Create new user (admin only)
router.post('/register', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role = 'staff', permissions = [] } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Validate role
    if (!['admin', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Create user
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      [userId, name, email, passwordHash, role, req.user.id, now, now]
    );

    // Set default targets for staff
    if (role === 'staff') {
      await db.run(
        `INSERT INTO staff_targets (id, user_id, daily_target, monthly_target, effective_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, 1000000, 26000000, now, now, now]
      );
    }

    // Assign permissions
    if (permissions.length > 0) {
      for (const permission of permissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), userId, permission, 1, now]
        );
      }
    } else if (role === 'staff') {
      // Default staff permissions
      const defaultStaffPermissions = [
        'view_customers', 'create_drop', 'create_pickup', 'send_messages',
        'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
        'view_business_targets'
      ];

      for (const permission of defaultStaffPermissions) {
        await db.run(
          `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), userId, permission, 1, now]
        );
      }
    }

    // Return created user (without password)
    const newUser = await db.get(
      'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/auth/login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await db.get(
      'SELECT * FROM users WHERE email = ? AND status = ?',
      [email, 'active']
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user permissions
    const permissions = await db.all(
      'SELECT permission FROM user_permissions WHERE user_id = ? AND granted = 1',
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    // Return user data and token
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: permissions.map((p: any) => p.permission)
      },
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user permissions
    const permissions = await db.all(
      'SELECT permission FROM user_permissions WHERE user_id = ? AND granted = 1',
      [user.id]
    );

    res.json({
      ...user,
      permissions: permissions.map((p: any) => p.permission)
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/auth/users - Get all users (admin/manager only)
router.get('/users', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const users = await db.all(`
      SELECT
        u.id, u.name, u.email, u.role, u.status, u.created_at,
        COUNT(DISTINCT op.id) as total_operations,
        COUNT(DISTINCT s.id) as total_sales
      FROM users u
      LEFT JOIN operations op ON op.created_by = u.id
      LEFT JOIN sales s ON s.created_by = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    // Get permissions for each user
    const usersWithPermissions = await Promise.all(
      users.map(async (user: any) => {
        const permissions = await db.all(
          'SELECT permission FROM user_permissions WHERE user_id = ? AND granted = 1',
          [user.id]
        );

        return {
          ...user,
          permissions: permissions.map((p: any) => p.permission)
        };
      })
    );

    res.json(usersWithPermissions);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/auth/users/:id - Update user
router.put('/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    // Validate role if provided
    if (role && !['admin', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated user
    const updatedUser = await db.get(
      'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/auth/users/:id - Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PUT /api/auth/users/:id/permissions - Update user permissions (admin only)
router.put('/users/:id/permissions', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }

    const now = new Date().toISOString();

    // Delete existing permissions
    await db.run('DELETE FROM user_permissions WHERE user_id = ?', [id]);

    // Add new permissions
    for (const permission of permissions) {
      await db.run(
        `INSERT INTO user_permissions (id, user_id, permission, granted, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), id, permission, 1, now]
      );
    }

    res.json({ success: true, message: 'Permissions updated' });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// POST /api/auth/change-password - Change own password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    // Get current user
    const user = await db.get(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.run(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      [newPasswordHash, new Date().toISOString(), req.user.id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
