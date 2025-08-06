const express = require("express")
const { query } = require("../config/database")
const { authenticateToken, authorize, validate } = require("../middleware/auth")
const { schemas } = require("../middleware/validation")
const logger = require("../utils/logger")

const router = express.Router()

// Get all users (admin only)
router.get("/", authenticateToken, authorize("admin"), validate(schemas.paginationQuery, "query"), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query

    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const queryParams = []
    let paramCount = 0

    // Add search filter
    if (search) {
      paramCount++
      whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR company_name ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    // Add role filter
    if (role) {
      paramCount++
      whereClause += ` AND role = $${paramCount}`
      queryParams.push(role)
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      queryParams
    )
    const totalUsers = parseInt(countResult.rows[0].count)

    // Get users with pagination
    const usersResult = await query(
      `SELECT id, email, first_name, last_name, role, company_name, phone, 
              is_active, created_at, updated_at, last_login
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    )

    const totalPages = Math.ceil(totalUsers / limit)

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_users: totalUsers,
          per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get vendors for invitations
router.get("/vendors", authenticateToken, authorize("tender-creator", "admin"), async (req, res, next) => {
  const { search, limit = 50 } = req.query

  try {
    const whereConditions = ["role = 'vendor'", "status = 'active'"]
    const queryParams = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(
        `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`,
      )
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.join(" AND ")

    const vendorsQuery = `
      SELECT id, email, first_name, last_name, phone, bio, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY first_name, last_name
      LIMIT $${paramIndex}
    `

    queryParams.push(limit)

    const result = await query(vendorsQuery, queryParams)

    const vendors = result.rows.map((vendor) => ({
      id: vendor.id,
      email: vendor.email,
      firstName: vendor.first_name,
      lastName: vendor.last_name,
      name: `${vendor.first_name} ${vendor.last_name}`,
      phone: vendor.phone,
      bio: vendor.bio,
      createdAt: vendor.created_at,
    }))

    res.json({
      success: true,
      data: { vendors },
    })
  } catch (error) {
    logger.error("Get vendors error:", error)
    res.status(500).json({ error: "Failed to fetch vendors" })
  }
})

// Get single user by ID
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    // Check permissions
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" })
    }

    const userQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.address, u.bio, 
             u.avatar_url, u.timezone, u.language, u.status, u.email_verified, u.last_login, 
             u.created_at, u.updated_at,
             us.email_notifications, us.weekly_reports, us.system_alerts, us.tender_updates, 
             us.user_registrations, us.session_timeout, us.login_alerts
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id = $1
    `

    const result = await query(userQuery, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = result.rows[0]

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          address: user.address,
          bio: user.bio,
          avatarUrl: user.avatar_url,
          timezone: user.timezone,
          language: user.language,
          status: user.status,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          settings: {
            emailNotifications: user.email_notifications,
            weeklyReports: user.weekly_reports,
            systemAlerts: user.system_alerts,
            tenderUpdates: user.tender_updates,
            userRegistrations: user.user_registrations,
            sessionTimeout: user.session_timeout,
            loginAlerts: user.login_alerts,
          },
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

// Update user profile
router.put("/:id", authenticateToken, validate(schemas.profileUpdate), async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if user can update this profile
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" })
    }

    const {
      first_name,
      last_name,
      company_name,
      phone,
      address,
      bio,
      website,
      linkedin,
    } = req.body

    // Build update query dynamically
    const updateFields = []
    const queryParams = []
    let paramCount = 0

    if (first_name !== undefined) {
      paramCount++
      updateFields.push(`first_name = $${paramCount}`)
      queryParams.push(first_name)
    }

    if (last_name !== undefined) {
      paramCount++
      updateFields.push(`last_name = $${paramCount}`)
      queryParams.push(last_name)
    }

    if (company_name !== undefined) {
      paramCount++
      updateFields.push(`company_name = $${paramCount}`)
      queryParams.push(company_name)
    }

    if (phone !== undefined) {
      paramCount++
      updateFields.push(`phone = $${paramCount}`)
      queryParams.push(phone)
    }

    if (address !== undefined) {
      paramCount++
      updateFields.push(`address = $${paramCount}`)
      queryParams.push(address)
    }

    if (bio !== undefined) {
      paramCount++
      updateFields.push(`bio = $${paramCount}`)
      queryParams.push(bio)
    }

    if (website !== undefined) {
      paramCount++
      updateFields.push(`website = $${paramCount}`)
      queryParams.push(website)
    }

    if (linkedin !== undefined) {
      paramCount++
      updateFields.push(`linkedin = $${paramCount}`)
      queryParams.push(linkedin)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" })
    }

    // Add updated_at
    paramCount++
    updateFields.push(`updated_at = NOW()`)

    // Add user ID for WHERE clause
    paramCount++
    queryParams.push(id)

    const result = await query(
      `UPDATE users 
       SET ${updateFields.join(", ")}
       WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, role, company_name, phone, address,
                 bio, website, linkedin, updated_at`,
      queryParams
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    logger.info(`User profile updated: ${result.rows[0].email}`)

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: result.rows[0] },
    })
  } catch (error) {
    next(error)
  }
})

// Update user status (activate/deactivate)
router.put("/:id/status", authenticateToken, authorize("admin"), async (req, res, next) => {
  try {
    const { id } = req.params
    const { is_active } = req.body

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be a boolean value" })
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === id && !is_active) {
      return res.status(400).json({ error: "You cannot deactivate your own account" })
    }

    const result = await query(
      `UPDATE users 
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, first_name, last_name, is_active`,
      [is_active, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = result.rows[0]
    const action = is_active ? "activated" : "deactivated"

    logger.info(`User ${action}: ${user.email} by ${req.user.email}`)

    res.json({
      success: true,
      message: `User ${action} successfully`,
      data: { user },
    })
  } catch (error) {
    next(error)
  }
})

// Delete user (soft delete)
router.delete("/:id", authenticateToken, authorize("admin"), async (req, res, next) => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ error: "You cannot delete your own account" })
    }

    // Check if user exists and get their info
    const userResult = await query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [id]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = userResult.rows[0]

    // Soft delete by deactivating and anonymizing
    await query(
      `UPDATE users 
       SET is_active = false, 
           email = CONCAT('deleted_', id, '@deleted.com'),
           first_name = 'Deleted',
           last_name = 'User',
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    )

    logger.info(`User deleted: ${user.email} by ${req.user.email}`)

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    next(error)
  }
})

// Get list of vendors for invitations
router.get("/vendors/list", authenticateToken, authorize("admin", "tender_creator"), async (req, res, next) => {
  try {
    const { search } = req.query

    let whereClause = "WHERE role = 'vendor' AND is_active = true"
    const queryParams = []

    if (search) {
      whereClause += " AND (first_name ILIKE $1 OR last_name ILIKE $1 OR company_name ILIKE $1 OR email ILIKE $1)"
      queryParams.push(`%${search}%`)
    }

    const result = await query(
      `SELECT id, email, first_name, last_name, company_name, phone
       FROM users 
       ${whereClause}
       ORDER BY company_name, first_name, last_name
       LIMIT 50`,
      queryParams
    )

    res.json({
      success: true,
      data: { vendors: result.rows },
    })
  } catch (error) {
    next(error)
  }
})

// Get user statistics
router.get("/stats/overview", authenticateToken, authorize("admin"), async (req, res, next) => {
  try {
    // Get user counts by role
    const roleStatsResult = await query(
      `SELECT role, COUNT(*) as count, 
              COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
       FROM users 
       GROUP BY role`
    )

    // Get recent registrations (last 30 days)
    const recentRegistrationsResult = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users 
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    )

    // Get total counts
    const totalStatsResult = await query(
      `SELECT 
         COUNT(*) as total_users,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
         COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_this_month,
         COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_week
       FROM users`
    )

    const stats = totalStatsResult.rows[0]

    res.json({
      success: true,
      data: {
        overview: {
          total_users: parseInt(stats.total_users),
          active_users: parseInt(stats.active_users),
          new_users_this_month: parseInt(stats.new_users_this_month),
          active_last_week: parseInt(stats.active_last_week),
        },
        by_role: roleStatsResult.rows.map(row => ({
          role: row.role,
          total: parseInt(row.count),
          active: parseInt(row.active_count),
        })),
        recent_registrations: recentRegistrationsResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
