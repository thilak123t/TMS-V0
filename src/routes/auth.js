const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { validate, userSchemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validate(userSchemas.register), async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role, company_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role, company_name, phone, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, company_name, phone, is_active, created_at`,
      [email, hashedPassword, first_name, last_name, role, company_name, phone]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`
      });
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    logger.info('User registered successfully:', { userId: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          company_name: user.company_name,
          phone: user.phone,
          is_active: user.is_active,
          created_at: user.created_at
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(userSchemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Get user with password
    const result = await query(
      'SELECT id, email, password, first_name, last_name, role, company_name, phone, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate token
    const token = generateToken(user.id);

    logger.info('User logged in successfully:', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          company_name: user.company_name,
          phone: user.phone,
          is_active: user.is_active
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', validate(userSchemas.forgotPassword), async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const result = await query(
      'SELECT id, email, first_name, last_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRES) || 3600000); // 1 hour

    // Save reset token
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      logger.info('Password reset email sent:', { userId: user.id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', validate(userSchemas.resetPassword), async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Find user with valid reset token
    const result = await query(
      'SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expires > NOW() AND is_active = true',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = result.rows[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    logger.info('Password reset successfully:', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.post('/change-password', authenticateToken, validate(userSchemas.changePassword), async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Get current password
    const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    logger.info('Password changed successfully:', { userId });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role, company_name, phone, bio, is_active, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // Here we just confirm the logout
  logger.info('User logged out:', { userId: req.user.id });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
