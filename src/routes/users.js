const express = require("express")
const { query } = require("../config/database")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const logger = require("../utils/logger")

const router = express.Router()

// Get all users (admin only)
router.get("/", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query

  const offset = (page - 1) * limit

  try {
    const whereConditions = []
    const queryParams = []
    let paramIndex = 1

    if (role) {
      whereConditions.push(`role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (search) {
      whereConditions.push(
        `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`,
      )
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const usersQuery = `
      SELECT id, email, first_name, last_name, role, phone, address, status, 
             email_verified, last_login, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `

    const [usersResult, countResult] = await Promise.all([
      query(usersQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)),
    ])

    const users = usersResult.rows.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      status: user.status,
      emailVerified: user.email_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }))

    const total = Number.parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: Number.parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    logger.error("Get users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Get vendors for invitations
router.get("/vendors", authenticateToken, authorizeRoles("tender-creator", "admin"), async (req, res) => {
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
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
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
    logger.error("Get user error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

// Update user status (admin only)
router.put("/:id/status", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!["active", "inactive", "suspended"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" })
  }

  try {
    const result = await query(
      "UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, status",
      [status, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = result.rows[0]

    logger.info(`User status updated: ${user.email} -> ${status} by ${req.user.email}`)

    res.json({
      success: true,
      message: "User status updated successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
        },
      },
    })
  } catch (error) {
    logger.error("Update user status error:", error)
    res.status(500).json({ error: "Failed to update user status" })
  }
})

// Delete user (admin only)
router.delete("/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params

  try {
    // Check if user exists
    const userResult = await query("SELECT email FROM users WHERE id = $1", [id])

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = userResult.rows[0]

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" })
    }

    // Check for dependencies
    const dependenciesCheck = await Promise.all([
      query("SELECT COUNT(*) as count FROM tenders WHERE creator_id = $1", [id]),
      query("SELECT COUNT(*) as count FROM bids WHERE vendor_id = $1", [id]),
    ])

    const [tenderCount, bidCount] = dependenciesCheck.map((result) => Number.parseInt(result.rows[0].count))

    if (tenderCount > 0 || bidCount > 0) {
      return res.status(400).json({
        error: "Cannot delete user with existing tenders or bids",
        details: {
          tenders: tenderCount,
          bids: bidCount,
        },
      })
    }

    // Delete user (cascade will handle related records)
    await query("DELETE FROM users WHERE id = $1", [id])

    logger.info(`User deleted: ${user.email} by ${req.user.email}`)

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    logger.error("Delete user error:", error)
    res.status(500).json({ error: "Failed to delete user" })
  }
})

module.exports = router
