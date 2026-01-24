const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const router = express.Router();

// Secret key for JWT (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const query = 
      SELECT u.id, u.email, u.password_hash, p.name, p.phone, p.team_id, p.is_active, p.created_at, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.email = ?
    ;
    
    const [rows] = await db.execute(query, [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data along with token
    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        team_id: user.team_id,
        is_active: user.is_active,
        created_at: user.created_at
      },
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user', team_id } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user already exists
      const checkUserQuery = 'SELECT id FROM users WHERE email = ?';
      const [existingUsers] = await connection.execute(checkUserQuery, [email]);

      if (existingUsers.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'User already exists' });
      }

      // Insert user
      const insertUserQuery = 'INSERT INTO users (email, password_hash) VALUES (?, ?)';
      const { insertId } = await connection.execute(insertUserQuery, [email, hashedPassword]);

      const userId = insertId;

      // Insert profile
      const insertProfileQuery = 
        INSERT INTO profiles (id, email, name, phone, team_id, is_active, created_by)
        VALUES (?, ?, ?, NULL, ?, TRUE, ?)
      ;
      await connection.execute(insertProfileQuery, [userId, email, name, team_id, userId]);

      // Insert role
      const insertRoleQuery = 'INSERT INTO user_roles (user_id, role) VALUES (?, ?)';
      await connection.execute(insertRoleQuery, [userId, role]);

      await connection.commit();

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify token route
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data
    const query = 
      SELECT u.id, u.email, p.name, p.phone, p.team_id, p.is_active, p.created_at, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
    ;
    
    const [rows] = await db.execute(query, [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0];

    res.json({
      id: user.id,
      email: user.email,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        team_id: user.team_id,
        is_active: user.is_active,
        created_at: user.created_at
      },
      role: user.role
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Update email route
router.put('/update-email', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { new_email } = req.body;

    if (!token || !new_email) {
      return res.status(400).json({ message: 'Authorization token and new password are required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update users table
      const updateUserQuery = 'UPDATE users SET email = ? WHERE id = ?';
      await connection.execute(updateUserQuery, [new_email, decoded.id]);

      // Update profiles table
      const updateProfileQuery = 'UPDATE profiles SET email = ? WHERE id = ?';
      await connection.execute(updateProfileQuery, [new_email, decoded.id]);

      await connection.commit();
      connection.release();

      res.json({ message: 'Email updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ message: 'Server error updating email' });
  }
});

// Update password route
router.put('/update-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ message: 'Authorization token and new password are required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    await db.execute(query, [hashedPassword, decoded.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

// Update admin credentials route
router.put('/admin/update-credentials', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { current_password, new_password, new_email, new_name } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Get current user data
    const getUserQuery = 
      SELECT u.id, u.email, u.password_hash, p.name, ur.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
    ;
    const [userRows] = await db.execute(getUserQuery, [decoded.id]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update credentials' });
    }

    // Verify current password if changing email or password
    if ((new_email && new_email !== user.email) || new_password) {
      if (!current_password) {
        return res.status(400).json({ message: 'Current password is required to update email or password' });
      }

      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    // Check if new email already exists (if provided and different)
    if (new_email && new_email !== user.email) {
      const checkEmailQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
      const [existingUsers] = await db.execute(checkEmailQuery, [new_email, decoded.id]);
      
      if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'Email already exists' });
      }
    }

    // Begin transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      if (new_email && new_email !== user.email) {
        // Update users table
        const updateUserQuery = 'UPDATE users SET email = ? WHERE id = ?';
        await connection.execute(updateUserQuery, [new_email, decoded.id]);

        // Update profiles table
        const updateProfileQuery = 'UPDATE profiles SET email = ? WHERE id = ?';
        await connection.execute(updateProfileQuery, [new_email, decoded.id]);
      }

      if (new_password) {
        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);

        // Update password
        const updatePasswordQuery = 'UPDATE users SET password_hash = ? WHERE id = ?';
        await connection.execute(updatePasswordQuery, [hashedPassword, decoded.id]);
      }

      if (new_name && new_name !== user.name) {
        // Update name in profiles table
        const updateNameQuery = 'UPDATE profiles SET name = ? WHERE id = ?';
        await connection.execute(updateNameQuery, [new_name, decoded.id]);
      }

      await connection.commit();
      connection.release();

      // Fetch updated user data
      const [updatedUserRows] = await db.execute(getUserQuery, [decoded.id]);
      const updatedUser = updatedUserRows[0];

      res.json({ 
        message: 'Credentials updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update admin credentials error:', error);
    res.status(500).json({ message: 'Server error updating credentials' });
  }
});

module.exports = router;
