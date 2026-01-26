const express = require('express');
const { db } = require('../config/db');
const router = express.Router();

// Get all departments
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT d.*, 
             COUNT(p.id) as user_count
      FROM departments d
      LEFT JOIN teams t ON d.id = t.department_id
      LEFT JOIN profiles p ON t.id = p.team_id
      GROUP BY d.id, d.name, d.created_at
      ORDER BY d.name ASC
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error retrieving departments' });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM departments WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ message: 'Server error retrieving department' });
  }
});

// Create new department
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required field
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const query = 'INSERT INTO departments (name) VALUES (?)';
    const params = [name];

    const { insertId } = await db.execute(query, params);
    
    res.status(201).json({ id: insertId, message: 'Department created successfully' });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Server error creating department' });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const query = 'UPDATE departments SET name = ? WHERE id = ?';
    const params = [name, id];

    await db.execute(query, params);
    
    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Server error updating department' });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update teams to remove department association first
      await connection.execute('UPDATE teams SET department_id = NULL WHERE department_id = ?', [id]);
      
      // Delete department
      await connection.execute('DELETE FROM departments WHERE id = ?', [id]);

      await connection.commit();
      connection.release();

      res.json({ message: 'Department deleted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Server error deleting department' });
  }
});

module.exports = router;