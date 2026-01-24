const express = require('express');
const { db } = require('../config/db');
const router = express.Router();

// Get submissions by query parameters
router.get('/', async (req, res) => {
  try {
    const { task_id, user_id } = req.query;
    
    let query = 'SELECT * FROM task_submissions WHERE 1=1';
    const params = [];

    if (task_id) {
      query += ' AND task_id = ?';
      params.push(task_id);
    }

    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error retrieving submissions' });
  }
});

// Get submission by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM task_submissions WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error retrieving submission' });
  }
});

// Create new submission
router.post('/', async (req, res) => {
  try {
    const { task_id, user_id, status = 'draft', text_content } = req.body;

    // Validate required fields
    if (!task_id || !user_id) {
      return res.status(400).json({ message: 'Task ID and User ID are required' });
    }

    const query = 'INSERT INTO task_submissions (task_id, user_id, status, text_content) VALUES (?, ?, ?, ?)';
    const params = [task_id, user_id, status, text_content || null];

    const { insertId } = await db.execute(query, params);
    
    // Get the created submission
    const getQuery = 'SELECT * FROM task_submissions WHERE id = ?';
    const [rows] = await db.execute(getQuery, [insertId]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Server error creating submission' });
  }
});

// Update submission
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, text_content, submitted_at } = req.body;

    const query = `
      UPDATE task_submissions SET
        status = COALESCE(?, status),
        text_content = COALESCE(?, text_content),
        submitted_at = COALESCE(?, submitted_at),
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const params = [status, text_content, submitted_at, id];

    await db.execute(query, params);
    
    // Get the updated submission
    const getQuery = 'SELECT * FROM task_submissions WHERE id = ?';
    const [rows] = await db.execute(getQuery, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ message: 'Server error updating submission' });
  }
});

// Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Delete related files first
      await connection.execute('DELETE FROM submission_files WHERE submission_id = ?', [id]);
      await connection.execute('DELETE FROM task_submissions WHERE id = ?', [id]);

      await connection.commit();
      connection.release();

      res.json({ message: 'Submission deleted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Server error deleting submission' });
  }
});

module.exports = router;