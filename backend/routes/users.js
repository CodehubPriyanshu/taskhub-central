const express = require('express');
const { db } = require('../config/db');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.email, p.name, p.phone, p.team_id, p.is_active, p.created_at, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY p.name ASC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT u.id, u.email, p.name, p.phone, p.team_id, p.is_active, p.created_at, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error retrieving user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, team_id, is_active, role } = req.body;
    
    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update profile
      const updateProfileQuery = `
        UPDATE profiles 
        SET name = ?, phone = ?, team_id = ?, is_active = ?
        WHERE id = ?
      `;
      await connection.execute(updateProfileQuery, [name, phone, team_id, is_active, id]);

      // Update role if provided
      if (role !== undefined) {
        const updateRoleQuery = 'UPDATE user_roles SET role = ? WHERE user_id = ?';
        await connection.execute(updateRoleQuery, [role, id]);
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Delete from related tables first
      await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      await connection.execute('DELETE FROM profiles WHERE id = ?', [id]);
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);

      await connection.commit();
      connection.release();

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;