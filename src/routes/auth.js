const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
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

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Simple validation middleware
const validateUserRegistration = (req, res, next) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be provided'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  if (!['admin', 'tender-creator', 'vendor'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified'
    });
  }
  
  next();
};

const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  next();
};

const validatePasswordReset = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  next();
};

const validatePasswordResetConfirm = (req, res, next) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: 'Token and password are required'
    });
  }
  
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  next();
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    try {
      const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication'
      });
    }
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, validateUserRegistration, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, companyName, phone, address } = req.body;

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, company_name, phone, address, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, company_name, phone, address, is_active, created_at`,
      [email, hashedPassword, firstName, lastName, role, companyName, phone, address]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id);

    logger.info(`New user registered: ${email} with role: ${role}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          companyName: user.company_name,
          phone: user.phone,
          address: user.address,
          isActive: user.is_active,
          createdAt: user.created_at
        },
        token
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, validateUserLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const result = await pool.query(
      'SELECT id, email, password, first_name, last_name, role, company_name, phone, address, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          companyName: user.company_name,
          phone: user.phone,
          address: user.address,
          isActive: user.is_active
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, company_name, phone, address, is_active, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          companyName: user.company_name,
          phone: user.phone,
          address: user.address,
          isActive: user.is_active,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // Here we can log the logout event and potentially blacklist the token if needed
  
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', validatePasswordReset, asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const result = await pool.query('SELECT id, first_name, last_name FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token in database
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
      [resetToken, user.id]
    );

    // TODO: Send email with reset link
    // emailService.sendPasswordResetEmail(email, resetToken);

    logger.info(`Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', validatePasswordResetConfirm, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Check if token exists and is not expired
    const result = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND reset_token = $2 AND reset_token_expires > NOW()',
      [decoded.userId, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, decoded.userId]
    );

    logger.info(`Password reset completed for user ID: ${decoded.userId}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

module.exports = router;
