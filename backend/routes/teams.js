const express = require('express');
const { db } = require('../config/db');
const router = express.Router();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT t.*, p.name as leader_name, p.email as leader_email, d.name as department_name
      FROM teams t
      LEFT JOIN profiles p ON t.leader_id = p.id
      LEFT JOIN departments d ON t.department_id = d.id
      ORDER BY t.name ASC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error retrieving teams' });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT t.*, p.name as leader_name, p.email as leader_email, d.name as department_name
      FROM teams t
      LEFT JOIN profiles p ON t.leader_id = p.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error retrieving team' });
  }
});

// Create new team
router.post('/', async (req, res) => {
  try {
    const { name, leader_id, department_id } = req.body;

    // Validate required fields
    if (!name || !leader_id) {
      return res.status(400).json({ message: 'Name and leader_id are required' });
    }

    const query = 'INSERT INTO teams (name, leader_id, department_id) VALUES (?, ?, ?)';
    const params = [name, leader_id, department_id || null];

    const { insertId } = await db.execute(query, params);
    
    res.status(201).json({ id: insertId, message: 'Team created successfully' });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error creating team' });
  }
});

// Update team
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leader_id, department_id } = req.body;

    const query = `
      UPDATE teams SET
        name = COALESCE(?, name),
        leader_id = COALESCE(?, leader_id),
        department_id = COALESCE(?, department_id)
      WHERE id = ?
    `;
    
    const params = [name, leader_id, department_id, id];

    await db.execute(query, params);
    
    res.json({ message: 'Team updated successfully' });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error updating team' });
  }
});

// Delete team
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update profiles to remove team association first
      await connection.execute('UPDATE profiles SET team_id = NULL WHERE team_id = ?', [id]);
      
      // Delete team
      await connection.execute('DELETE FROM teams WHERE id = ?', [id]);

      await connection.commit();
      connection.release();

      res.json({ message: 'Team deleted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error deleting team' });
  }
});

module.exports = router;