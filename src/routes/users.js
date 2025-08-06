const express = require("express")
const bcrypt = require('bcryptjs')
const { query, transaction } = require("../config/database")
const { authenticateToken, authorizeRoles, authorizeOwnerOrAdmin } = require("../middleware/auth")
const { validate, userSchemas } = require("../middleware/validation")
const logger = require("../utils/logger")

const router = express.Router()

// Get all users (admin only)
router.get("/", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const queryParams = []
    let paramCount = 0

    // Add filters
    if (role) {
      paramCount++
      whereClause += ` AND role = $${paramCount}`
      queryParams.push(role)
    }

    if (status) {
      paramCount++
      whereClause += ` AND is_active = $${paramCount}`
      queryParams.push(status === 'active')
    }

    if (search) {
      paramCount++
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR company_name ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      queryParams
    )
    const totalUsers = parseInt(countResult.rows[0].count)

    // Get users
    paramCount++
    queryParams.push(limit)
    paramCount++
    queryParams.push(offset)

    const result = await query(
      `SELECT id, email, first_name, last_name, role, company_name, phone, bio, is_active, created_at, last_login
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      queryParams
    )

    const totalPages = Math.ceil(totalUsers / limit)

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get user statistics (admin only)
router.get('/stats', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
        COUNT(*) FILTER (WHERE role = 'tender-creator') as tender_creator_count,
        COUNT(*) FILTER (WHERE role = 'vendor') as vendor_count,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_last_30_days
      FROM users
    `)

    res.json({
      success: true,
      data: { stats: stats.rows[0] }
    })
  } catch (error) {
    next(error)
  }
})

// Get single user by ID
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if user can access this profile
    if (req.user.role !== "admin" && req.user.id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      })
    }

    const result = await query(
      'SELECT id, email, first_name, last_name, role, company_name, phone, bio, is_active, created_at, last_login FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
})

// Update user profile
router.put("/:id", authenticateToken, validate(userSchemas.updateProfile), async (req, res, next) => {
  try {
    const { id } = req.params
    const { first_name, last_name, company_name, phone, bio } = req.body

    // Check if user can update this profile
    if (req.user.role !== "admin" && req.user.id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      })
    }

    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    // Build update query dynamically
    const updates = []
    const values = []
    let paramCount = 0

    if (first_name !== undefined) {
      paramCount++
      updates.push(`first_name = $${paramCount}`)
      values.push(first_name)
    }

    if (last_name !== undefined) {
      paramCount++
      updates.push(`last_name = $${paramCount}`)
      values.push(last_name)
    }

    if (company_name !== undefined) {
      paramCount++
      updates.push(`company_name = $${paramCount}`)
      values.push(company_name)
    }

    if (phone !== undefined) {
      paramCount++
      updates.push(`phone = $${paramCount}`)
      values.push(phone)
    }

    if (bio !== undefined) {
      paramCount++
      updates.push(`bio = $${paramCount}`)
      values.push(bio)
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      })
    }

    paramCount++
    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, role, company_name, phone, bio, is_active, updated_at`,
      values
    )

    logger.info('User profile updated:', { userId: id, updatedBy: req.user.id })

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
})

// Update user status (activate/deactivate)
router.put("/:id/status", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { id } = req.params
    const { is_active } = req.body

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_active must be a boolean value"
      })
    }

    // Prevent admin from deactivating themselves
    if (req.user.id.toString() === id && !is_active) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account"
      })
    }

    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, first_name, last_name, is_active',
      [is_active, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    logger.info('User status updated:', { userId: id, is_active, updatedBy: req.user.id })

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: { user: result.rows[0] }
    })
  } catch (error) {
    next(error)
  }
})

// Delete user (admin only)
router.delete("/:id", authenticateToken, authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves
    if (req.user.id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      })
    }

    // Use transaction to handle related data
    await transaction(async (client) => {
      // Check if user exists
      const userResult = await client.query('SELECT id, email FROM users WHERE id = $1', [id])
      if (userResult.rows.length === 0) {
        throw new Error('User not found')
      }

      const user = userResult.rows[0]

      // Delete related data (bids, tenders, etc.)
      await client.query('DELETE FROM bids WHERE user_id = $1', [id])
      await client.query('DELETE FROM tenders WHERE created_by = $1', [id])
      await client.query('DELETE FROM notifications WHERE user_id = $1', [id])

      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [id])

      logger.info('User deleted:', { userId: id, email: user.email, deletedBy: req.user.id })
    })

    res.json({
      success: true,
      message: "User deleted successfully"
    })
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }
    next(error)
  }
})

// Get list of vendors for invitations
router.get("/vendors/list", authenticateToken, authorizeRoles("admin", "tender-creator"), async (req, res, next) => {
  try {
    const { search, limit = 50 } = req.query

    let whereClause = "WHERE role = 'vendor' AND is_active = true"
    const queryParams = ['vendor', true]
    let paramCount = 2

    if (search) {
      paramCount++
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR company_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    paramCount++
    queryParams.push(limit)

    const result = await query(
      `SELECT id, email, first_name, last_name, company_name, phone
       FROM users ${whereClause}
       ORDER BY company_name, first_name
       LIMIT $${paramCount}`,
      queryParams
    )

    res.json({
      success: true,
      data: { vendors: result.rows }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
