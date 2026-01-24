const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/db');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow certain file types
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Get submission files by query parameters
router.get('/', async (req, res) => {
  try {
    const { submission_id } = req.query;
    
    let query = 'SELECT * FROM submission_files WHERE 1=1';
    const params = [];

    if (submission_id) {
      query += ' AND submission_id = ?';
      params.push(submission_id);
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get submission files error:', error);
    res.status(500).json({ message: 'Server error retrieving submission files' });
  }
});

// Get submission file by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM submission_files WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Submission file not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get submission file error:', error);
    res.status(500).json({ message: 'Server error retrieving submission file' });
  }
});

// Upload submission file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { submission_id } = req.body;
    const { filename, originalname, mimetype, size } = req.file;

    // Validate required fields
    if (!submission_id) {
      return res.status(400).json({ message: 'Submission ID is required' });
    }

    // Store file path as relative path from uploads directory
    const filePath = `/uploads/${filename}`;

    const query = `
      INSERT INTO submission_files 
      (submission_id, file_name, file_path, file_type, file_size, uploaded_by) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      submission_id, 
      originalname, 
      filePath, 
      mimetype, 
      size, 
      req.user ? req.user.id : null
    ];

    const { insertId } = await db.execute(query, params);
    
    // Get the created file record
    const getQuery = 'SELECT * FROM submission_files WHERE id = ?';
    const [rows] = await db.execute(getQuery, [insertId]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Upload submission file error:', error);
    res.status(500).json({ message: 'Server error uploading submission file' });
  }
});

// Delete submission file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the file record first to get the file path
    const getFileQuery = 'SELECT file_path FROM submission_files WHERE id = ?';
    const [fileRows] = await db.execute(getFileQuery, [id]);
    
    if (fileRows.length === 0) {
      return res.status(404).json({ message: 'Submission file not found' });
    }
    
    const filePath = fileRows[0].file_path;
    
    // Delete from database
    await db.execute('DELETE FROM submission_files WHERE id = ?', [id]);
    
    // Delete the physical file if it exists
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    res.json({ message: 'Submission file deleted successfully' });
  } catch (error) {
    console.error('Delete submission file error:', error);
    res.status(500).json({ message: 'Server error deleting submission file' });
  }
});

// Download submission file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the file record
    const getFileQuery = 'SELECT * FROM submission_files WHERE id = ?';
    const [fileRows] = await db.execute(getFileQuery, [id]);
    
    if (fileRows.length === 0) {
      return res.status(404).json({ message: 'Submission file not found' });
    }
    
    const fileRecord = fileRows[0];
    const fullPath = path.join(__dirname, '..', fileRecord.file_path);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.download(fullPath, fileRecord.file_name);
  } catch (error) {
    console.error('Download submission file error:', error);
    res.status(500).json({ message: 'Server error downloading submission file' });
  }
});

module.exports = router;