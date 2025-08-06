const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  }
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authLimiter, validate(schemas.register), asyncHandler(async (req, res) => {
  const { email, password, first_name, last_name, role, company_name } = req.body;

  // Check if user exists
  const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (userExists.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'User already exists'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, password, first_name, last_name, role, company_name, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
     RETURNING id, email, first_name, last_name, role, company_name, created_at`,
    [email, hashedPassword, first_name, last_name, role, company_name]
  );

  const user = result.rows[0];
  const token = generateToken(user.id);

  logger.info(`User registered: ${email}`);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      company: user.company_name,
      createdAt: user.created_at
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validate(schemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const result = await pool.query(
    'SELECT id, email, password, first_name, last_name, role, company_name, is_active FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  const user = result.rows[0];

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      error: 'Account is deactivated'
    });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Update last login
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const token = generateToken(user.id);

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      company: user.company_name
    }
  });
}));

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const result = await pool.query(
    'SELECT id, email, first_name, last_name, role, company_name, created_at FROM users WHERE id = $1 AND is_active = true',
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({
      success: false,
      error: 'User not found'
    });
  }

  const user = result.rows[0];
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      company: user.company_name,
      createdAt: user.created_at
    }
  });
}));

module.exports = router;
