const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth');
const { 
  validateTenderCreation, 
  validateTenderUpdate, 
  validateVendorInvitation,
  validateUUID,
  validatePagination 
} = require('../middleware/validation');
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

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Authorization middleware for roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// @route   GET /api/tenders
// @desc    Get all tenders with filtering and pagination
// @access  Private
router.get('/', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT t.*, u.first_name as creator_first_name, u.last_name as creator_last_name, 
             u.company_name as creator_company, COUNT(b.id) as bid_count
      FROM tenders t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN bids b ON t.id = b.tender_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    // Add filters based on user role
    if (req.user.role === 'tender-creator') {
      paramCount++;
      query += ` AND t.created_by = $${paramCount}`;
      queryParams.push(req.user.id);
    } else if (req.user.role === 'vendor') {
      // Vendors can only see published tenders or tenders they're invited to
      query += ` AND (t.status = 'published' OR t.id IN (
        SELECT tender_id FROM tender_invitations WHERE vendor_id = $${++paramCount}
      ))`;
      queryParams.push(req.user.id);
    }

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add status filter
    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Add category filter
    if (category) {
      paramCount++;
      query += ` AND t.category = $${paramCount}`;
      queryParams.push(category);
    }

    query += ` GROUP BY t.id, u.first_name, u.last_name, u.company_name`;
    query += ` ORDER BY t.${sortBy} ${sortOrder}`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(DISTINCT t.id) as total FROM tenders t WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (req.user.role === 'tender-creator') {
      countParamCount++;
      countQuery += ` AND t.created_by = $${countParamCount}`;
      countParams.push(req.user.id);
    } else if (req.user.role === 'vendor') {
      countQuery += ` AND (t.status = 'published' OR t.id IN (
        SELECT tender_id FROM tender_invitations WHERE vendor_id = $${++countParamCount}
      ))`;
      countParams.push(req.user.id);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (t.title ILIKE $${countParamCount} OR t.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND t.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND t.category = $${countParamCount}`;
      countParams.push(category);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        tenders: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTenders: total,
          perPage: parseInt(limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get tenders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenders'
    });
  }
}));

// @route   GET /api/tenders/:id
// @desc    Get single tender by ID
// @access  Private
router.get('/:id', authenticateToken, validateUUID, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT t.*, u.first_name as creator_first_name, u.last_name as creator_last_name,
             u.company_name as creator_company, u.email as creator_email,
             COUNT(b.id) as bid_count
      FROM tenders t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN bids b ON t.id = b.tender_id
      WHERE t.id = $1
      GROUP BY t.id, u.first_name, u.last_name, u.company_name, u.email
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const tender = result.rows[0];

    // Check access permissions
    if (req.user.role === 'vendor' && tender.status !== 'published') {
      // Check if vendor is invited
      const invitationResult = await pool.query(
        'SELECT id FROM tender_invitations WHERE tender_id = $1 AND vendor_id = $2',
        [id, req.user.id]
      );

      if (invitationResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'tender-creator' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get user's bid if vendor
    let userBid = null;
    if (req.user.role === 'vendor') {
      const bidResult = await pool.query(
        'SELECT * FROM bids WHERE tender_id = $1 AND vendor_id = $2',
        [id, req.user.id]
      );
      if (bidResult.rows.length > 0) {
        userBid = bidResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        tender: {
          ...tender,
          userBid
        }
      }
    });
  } catch (error) {
    logger.error('Get tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tender'
    });
  }
}));

// @route   POST /api/tenders
// @desc    Create new tender
// @access  Private (tender-creator, admin)
router.post('/', authenticateToken, authorizeRoles('tender-creator', 'admin'), validateTenderCreation, asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    budget,
    submissionDeadline,
    requirements,
    location,
    attachments = []
  } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO tenders (
        title, description, category, budget, submission_deadline,
        requirements, location, attachments, created_by, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', NOW(), NOW())
      RETURNING *
    `, [
      title,
      description,
      category,
      budget,
      submissionDeadline,
      requirements,
      location,
      JSON.stringify(attachments),
      req.user.id
    ]);

    const tender = result.rows[0];

    logger.info(`New tender created: ${title} by user ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Tender created successfully',
      data: {
        tender
      }
    });
  } catch (error) {
    logger.error('Create tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tender'
    });
  }
}));

// @route   PUT /api/tenders/:id
// @desc    Update tender
// @access  Private (tender-creator, admin)
router.put('/:id', authenticateToken, authorizeRoles('tender-creator', 'admin'), validateUUID, validateTenderUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Check if tender exists and user has permission
    const existingTender = await pool.query('SELECT * FROM tenders WHERE id = $1', [id]);
    
    if (existingTender.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const tender = existingTender.rows[0];

    // Check permissions
    if (req.user.role !== 'admin' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount++}`);
        values.push(key === 'attachments' ? JSON.stringify(updates[key]) : updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    values.push(id);

    const result = await pool.query(
      `UPDATE tenders SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    logger.info(`Tender updated: ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tender updated successfully',
      data: {
        tender: result.rows[0]
      }
    });
  } catch (error) {
    logger.error('Update tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tender'
    });
  }
}));

// @route   DELETE /api/tenders/:id
// @desc    Delete tender
// @access  Private (tender-creator, admin)
router.delete('/:id', authenticateToken, authorizeRoles('tender-creator', 'admin'), validateUUID, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Check if tender exists and user has permission
    const existingTender = await pool.query('SELECT * FROM tenders WHERE id = $1', [id]);
    
    if (existingTender.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const tender = existingTender.rows[0];

    // Check permissions
    if (req.user.role !== 'admin' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if there are any bids
    const bidCount = await pool.query('SELECT COUNT(*) FROM bids WHERE tender_id = $1', [id]);
    if (parseInt(bidCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tender with existing bids'
      });
    }

    await pool.query('DELETE FROM tenders WHERE id = $1', [id]);

    logger.info(`Tender deleted: ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tender deleted successfully'
    });
  } catch (error) {
    logger.error('Delete tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tender'
    });
  }
}));

// @route   PUT /api/tenders/:id/publish
// @desc    Publish tender
// @access  Private (tender-creator, admin)
router.put('/:id/publish', authenticateToken, authorizeRoles('tender-creator', 'admin'), validateUUID, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Check if tender exists and user has permission
    const existingTender = await pool.query('SELECT * FROM tenders WHERE id = $1', [id]);
    
    if (existingTender.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const tender = existingTender.rows[0];

    // Check permissions
    if (req.user.role !== 'admin' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (tender.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft tenders can be published'
      });
    }

    await pool.query(
      'UPDATE tenders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['published', id]
    );

    logger.info(`Tender published: ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tender published successfully'
    });
  } catch (error) {
    logger.error('Publish tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish tender'
    });
  }
}));

// @route   POST /api/tenders/:id/award
// @desc    Award tender to a bid
// @access  Private (tender-creator, admin)
router.post('/:id/award', authenticateToken, authorizeRoles('tender-creator', 'admin'), validateUUID, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bidId } = req.body;

  if (!bidId) {
    return res.status(400).json({
      success: false,
      message: 'Bid ID is required'
    });
  }

  try {
    // Check if tender exists and user has permission
    const tenderResult = await pool.query('SELECT * FROM tenders WHERE id = $1', [id]);
    
    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const tender = tenderResult.rows[0];

    // Check permissions
    if (req.user.role !== 'admin' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if bid exists
    const bidResult = await pool.query('SELECT * FROM bids WHERE id = $1 AND tender_id = $2', [bidId, id]);
    
    if (bidResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Update tender status and awarded bid
    await pool.query(
      'UPDATE tenders SET status = $1, awarded_to = $2, updated_at = NOW() WHERE id = $3',
      ['awarded', bidId, id]
    );

    // Update bid status
    await pool.query(
      'UPDATE bids SET status = $1, updated_at = NOW() WHERE id = $2',
      ['awarded', bidId]
    );

    // Update other bids to rejected
    await pool.query(
      'UPDATE bids SET status = $1, updated_at = NOW() WHERE tender_id = $2 AND id != $3',
      ['rejected', id, bidId]
    );

    logger.info(`Tender awarded: ${id} to bid ${bidId} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tender awarded successfully'
    });
  } catch (error) {
    logger.error('Award tender error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award tender'
    });
  }
}));

// @route   POST /api/tenders/:id/invite
// @desc    Invite vendors to tender
// @access  Private (tender-creator, admin)
router.post('/:id/invite', authenticateToken, authorizeRoles('tender-creator', 'admin'), validateUUID, validateVendorInvitation, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vendorIds, message } = req.body;

  try {
    // Check if tender exists and user has permission
    const tenderResult = await pool.query('SELECT * FROM tenders WHERE id = $1', [id]);
    
    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }

    const tender = tenderResult.rows[0];

    // Check permissions
    if (req.user.role !== 'admin' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get vendor details
    const vendorsResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = ANY($1) AND role = $2',
      [vendorIds, 'vendor']
    );

    const vendors = vendorsResult.rows;

    if (vendors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid vendors found'
      });
    }

    let invitationCount = 0;

    for (const vendor of vendors) {
      // Check if already invited
      const existingInvitation = await pool.query(
        'SELECT id FROM tender_invitations WHERE tender_id = $1 AND vendor_id = $2',
        [id, vendor.id]
      );

      if (existingInvitation.rows.length === 0) {
        // Create invitation
        await pool.query(
          'INSERT INTO tender_invitations (tender_id, vendor_id, invited_by, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [id, vendor.id, req.user.id, message]
        );

        invitationCount++;

        // TODO: Send invitation email
        // emailService.sendTenderInvitationEmail(vendor, tender, req.user);
      }
    }

    logger.info(`${invitationCount} vendors invited to tender: ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: `Invitations sent to ${invitationCount} vendors`
    });
  } catch (error) {
    logger.error('Invite vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitations'
    });
  }
}));

module.exports = router;
