const express = require('express');
const { db } = require('../config/db');
const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { assigned_to, status, team_id } = req.query;
    
    let query = `
      SELECT t.*, p.name as assigned_user_name, p.email as assigned_user_email, 
             tp.name as team_name, dp.name as department_name
      FROM tasks t
      LEFT JOIN profiles p ON t.assigned_to = p.id
      LEFT JOIN teams tp ON t.team_id = tp.id
      LEFT JOIN departments dp ON tp.department_id = dp.id
      WHERE 1=1
    `;
    const params = [];

    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (team_id) {
      query += ' AND t.team_id = ?';
      params.push(team_id);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error retrieving tasks' });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT t.*, p.name as assigned_user_name, p.email as assigned_user_email,
             tp.name as team_name, dp.name as department_name
      FROM tasks t
      LEFT JOIN profiles p ON t.assigned_to = p.id
      LEFT JOIN teams tp ON t.team_id = tp.id
      LEFT JOIN departments dp ON tp.department_id = dp.id
      WHERE t.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error retrieving task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const { 
      title, description, assigned_to, created_by, due_date, start_date, 
      priority, status = 'pending', team_id, 
      allows_file_upload, allows_text_submission, max_files 
    } = req.body;

    // Validate required fields
    if (!title || !assigned_to || !created_by || !due_date) {
      return res.status(400).json({ message: 'Title, assigned_to, created_by, and due_date are required' });
    }

    const query = `
      INSERT INTO tasks (
        title, description, assigned_to, created_by, due_date, start_date, 
        priority, status, team_id, 
        allows_file_upload, allows_text_submission, max_files
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      title, description || null, assigned_to, created_by, due_date, start_date || null,
      priority || 'medium', status, team_id || null,
      allows_file_upload !== undefined ? allows_file_upload : true,
      allows_text_submission !== undefined ? allows_text_submission : true,
      max_files || null
    ];

    const { insertId } = await db.execute(query, params);
    
    res.status(201).json({ id: insertId, message: 'Task created successfully' });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, assigned_to, due_date, start_date, 
      priority, status, team_id, 
      allows_file_upload, allows_text_submission, max_files 
    } = req.body;

    const query = `
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assigned_to = COALESCE(?, assigned_to),
        due_date = COALESCE(?, due_date),
        start_date = COALESCE(?, start_date),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        team_id = COALESCE(?, team_id),
        allows_file_upload = COALESCE(?, allows_file_upload),
        allows_text_submission = COALESCE(?, allows_text_submission),
        max_files = COALESCE(?, max_files),
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const params = [
      title, description, assigned_to, due_date, start_date,
      priority, status, team_id,
      allows_file_upload, allows_text_submission, max_files,
      id
    ];

    await db.execute(query, params);
    
    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Delete related submissions and files first
      await connection.execute('DELETE FROM submission_files WHERE submission_id IN (SELECT id FROM task_submissions WHERE task_id = ?)', [id]);
      await connection.execute('DELETE FROM task_submissions WHERE task_id = ?', [id]);
      await connection.execute('DELETE FROM tasks WHERE id = ?', [id]);

      await connection.commit();
      connection.release();

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

module.exports = router;