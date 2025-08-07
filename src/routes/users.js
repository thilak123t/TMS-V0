const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', auth, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT id, email, first_name, last_name, role, company_name, phone, address, is_active, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    // Add filters
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      queryParams.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR company_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countQuery += ` AND role = $${countParamCount}`;
      countParams.push(role);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (first_name ILIKE $${countParamCount} OR last_name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR company_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private/Admin
router.get('/role/:role', auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'tender-creator', 'vendor'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, company_name, phone, is_active, created_at
       FROM users
       WHERE role = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [role]
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    logger.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (own profile or admin)
router.get('/:id', auth, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, company_name, phone, address, is_active, created_at, last_login FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (own profile or admin)
router.put('/:id', auth, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, company_name, phone, address } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const result = await pool.query(`
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          company_name = COALESCE($3, company_name),
          phone = COALESCE($4, phone),
          address = COALESCE($5, address),
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, email, first_name, last_name, role, company_name, phone, address, is_active, created_at
    `, [first_name, last_name, company_name, phone, address, id]);

    logger.info(`User profile updated: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Change user password
// @route   PUT /api/users/:id/password
// @access  Private
router.put('/:id/password', auth, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // Get current user
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If not admin, verify current password
    if (req.user.role !== 'admin') {
      const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, id]);

    logger.info(`Password changed for user: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Toggle user active status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private
router.put('/:id/status', auth, validateId, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Only admin can change user status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Can't deactivate yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own status'
      });
    }

    const result = await pool.query(`
      UPDATE users 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, first_name, last_name, role, company_name, is_active
    `, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`User status changed: ${id} to ${is_active} by user ${req.user.id}`);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Change user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', auth, validateId, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Can't delete yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check if user has associated data
    const tenderCount = await pool.query('SELECT COUNT(*) FROM tenders WHERE created_by = $1', [id]);
    const bidCount = await pool.query('SELECT COUNT(*) FROM bids WHERE vendor_id = $1', [id]);

    if (parseInt(tenderCount.rows[0].count) > 0 || parseInt(bidCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete user with associated tenders or bids. Deactivate instead.'
      });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    logger.info(`User deleted: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create new user (admin only)
// @route   POST /api/users
// @access  Private/Admin
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, company_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
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
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, company_name, phone, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, company_name, phone, is_active, created_at`,
      [email, hashedPassword, first_name, last_name, role, company_name, phone]
    );

    const user = result.rows[0];

    logger.info(`New user created by admin: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: user
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats/overview
// @access  Private/Admin
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    // Get user counts by role
    const roleStats = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users 
      GROUP BY role
    `);

    // Get recent registrations (last 30 days)
    const recentRegistrations = await pool.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Get total users
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');

    // Get active users
    const activeUsers = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');

    res.json({
      success: true,
      data: {
        total_users: parseInt(totalUsers.rows[0].count),
        active_users: parseInt(activeUsers.rows[0].count),
        recent_registrations: parseInt(recentRegistrations.rows[0].count),
        role_distribution: roleStats.rows.map(row => ({
          role: row.role,
          total: parseInt(row.count),
          active: parseInt(row.active_count)
        }))
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
