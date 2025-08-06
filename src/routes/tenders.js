const express = require("express")
const { Pool } = require('pg')
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { validate, tenderSchemas, querySchemas } = require("../middleware/validation")
const emailService = require("../services/emailService")
const { createNotification, createBulkNotifications } = require("../services/notificationService")
const logger = require("../utils/logger")

const router = express.Router()
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Get all tenders with filtering and pagination
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query

    const offset = (page - 1) * limit
    let query = `
      SELECT t.*, u.first_name as creatorFirstName, u.last_name as creatorLastName, u.companyName as creatorCompany,
             COUNT(b.id) as bidCount
      FROM tenders t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN bids b ON t.id = b.tender_id
      WHERE 1=1
    `
    const queryParams = []
    let paramCount = 0

    // Add filters
    if (status) {
      paramCount++
      query += ` AND t.status = $${paramCount}`
      queryParams.push(status)
    }

    if (category) {
      paramCount++
      query += ` AND t.category = $${paramCount}`
      queryParams.push(category)
    }

    if (search) {
      paramCount++
      query += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    // Role-based filtering
    if (req.user.role === 'tender_creator') {
      paramCount++
      query += ` AND t.created_by = $${paramCount}`
      queryParams.push(req.user.id)
    }

    query += ` GROUP BY t.id, u.first_name, u.last_name, u.companyName`
    query += ` ORDER BY t.${sortBy} ${sortOrder}`
    
    paramCount++
    query += ` LIMIT $${paramCount}`
    queryParams.push(limit)
    
    paramCount++
    query += ` OFFSET $${paramCount}`
    queryParams.push(offset)

    const result = await pool.query(query, queryParams)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM tenders t
      WHERE 1=1
    `
    const countParams = []
    let countParamCount = 0

    if (status) {
      countParamCount++
      countQuery += ` AND t.status = $${countParamCount}`
      countParams.push(status)
    }

    if (category) {
      countParamCount++
      countQuery += ` AND t.category = $${countParamCount}`
      countParams.push(category)
    }

    if (search) {
      countParamCount++
      countQuery += ` AND (t.title ILIKE $${countParamCount} OR t.description ILIKE $${countParamCount})`
      countParams.push(`%${search}%`)
    }

    if (req.user.role === 'tender_creator') {
      countParamCount++
      countQuery += ` AND t.created_by = $${countParamCount}`
      countParams.push(req.user.id)
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = Number.parseInt(countResult.rows[0].total)

    res.json({
      success: true,
      data: {
        tenders: result.rows,
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTenders: total,
          perPage: Number.parseInt(limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    })
  } catch (error) {
    logger.error("Get tenders error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get tenders",
    })
  }
})

// Get single tender by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT t.*, u.first_name as creatorFirstName, u.last_name as creatorLastName, u.companyName as creatorCompany,
             COUNT(b.id) as bidCount
      FROM tenders t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN bids b ON t.id = b.tender_id
      WHERE t.id = $1
      GROUP BY t.id, u.first_name, u.last_name, u.companyName
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      })
    }

    const tender = result.rows[0]

    // Check if user has access to this tender
    if (req.user.role === 'tender_creator' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: {
        tender: tender,
      },
    })
  } catch (error) {
    logger.error("Get tender error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get tender",
    })
  }
})

// Create new tender
router.post("/", authenticateToken, authorizeRoles('tender-creator', 'admin'), validate(tenderSchemas.create), async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      basePrice,
      currency = "USD",
      deadline,
      category,
      location,
      attachments = [],
    } = req.body
    const createdBy = req.user.id

    const result = await pool.query(
      `INSERT INTO tenders (
        title, description, requirements, basePrice, currency, deadline,
        category, location, attachments, createdBy, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', NOW(), NOW())
      RETURNING *`,
      [
        title,
        description,
        requirements,
        basePrice,
        currency,
        deadline,
        category,
        location,
        JSON.stringify(attachments),
        createdBy,
      ],
    )

    const tender = result.rows[0]

    logger.info(`New tender created: ${tender.title} by user ${req.user.email}`)

    res.status(201).json({
      success: true,
      message: "Tender created successfully",
      data: {
        tender: {
          id: tender.id,
          title: tender.title,
          description: tender.description,
          requirements: tender.requirements,
          basePrice: tender.baseprice,
          currency: tender.currency,
          deadline: tender.deadline,
          status: tender.status,
          category: tender.category,
          location: tender.location,
          attachments: tender.attachments,
          createdAt: tender.createdat,
        },
      },
    })
  } catch (error) {
    logger.error("Create tender error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create tender",
    })
  }
})

// Update tender
router.put("/:id", authenticateToken, authorizeRoles('tender-creator', 'admin'), validate(tenderSchemas.update), async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Build update query dynamically
    const updateFields = []
    const values = []
    let paramCount = 1

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramCount++}`)
        values.push(key === "attachments" ? JSON.stringify(updates[key]) : updates[key])
      }
    })

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      })
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    const result = await pool.query(
      `UPDATE tenders SET ${updateFields.join(", ")} WHERE id = $${paramCount}
       RETURNING id, title, description, category, budget_min, budget_max, submission_deadline, requirements, status, created_at, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      })
    }

    const tender = result.rows[0]

    logger.info(`Tender updated: ${tender.title} by user ${req.user.email}`)

    res.json({
      success: true,
      message: "Tender updated successfully",
      data: {
        tender: tender,
      },
    })
  } catch (error) {
    logger.error("Update tender error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update tender",
    })
  }
})

// Delete tender
router.delete("/:id", authenticateToken, authorizeRoles('tender-creator', 'admin'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if tender exists and user has permission
    const tenderResult = await pool.query('SELECT * FROM tenders WHERE id = $1', [id])
    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      })
    }

    const tender = tenderResult.rows[0]

    // Check permissions
    if (req.user.role !== 'admin' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Don't allow deletion if there are bids
    const bidCount = await pool.query('SELECT COUNT(*) FROM bids WHERE tender_id = $1', [id])
    if (parseInt(bidCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tender with existing bids'
      })
    }

    await pool.query('DELETE FROM tenders WHERE id = $1', [id])

    logger.info(`Tender deleted: ${id} by user ${req.user.id}`)

    res.json({
      success: true,
      message: 'Tender deleted successfully'
    })
  } catch (error) {
    logger.error("Delete tender error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete tender",
    })
  }
})

// Publish tender
router.put("/:id/publish", authenticateToken, authorizeRoles('tender-creator', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Check if tender exists and user has permission
    const existingTender = await pool.query("SELECT * FROM tenders WHERE id = $1", [id])

    if (existingTender.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      })
    }

    const tender = existingTender.rows[0]

    if (tender.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft tenders can be published",
      })
    }

    // Update status to published
    await pool.query("UPDATE tenders SET status = $1, updatedAt = NOW() WHERE id = $2", ["published", id])

    logger.info(`Tender published: ${tender.title} by user ${req.user.email}`)

    res.json({
      success: true,
      message: "Tender published successfully",
    })
  } catch (error) {
    logger.error("Publish tender error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to publish tender",
    })
  }
})

// Award tender to a bid
router.post("/:id/award", authenticateToken, authorizeRoles('tender-creator', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { bidId } = req.body
    const userId = req.user.id

    if (!bidId) {
      return res.status(400).json({
        success: false,
        message: "Bid ID is required",
      })
    }

    // Check if tender exists and user has permission
    const tenderResult = await pool.query('SELECT * FROM tenders WHERE id = $1', [id])
    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      })
    }

    const tender = tenderResult.rows[0]

    // Check permissions
    if (req.user.role !== 'admin' && tender.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Check if bid exists
    const bidResult = await pool.query('SELECT * FROM bids WHERE id = $1 AND tender_id = $2', [bidId, id])
    if (bidResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      })
    }

    // Update tender status and awarded bid
    await pool.query(`
      UPDATE tenders 
      SET status = 'awarded', awarded_to = $1, updated_at = NOW()
      WHERE id = $2
    `, [bidId, id])

    // Update bid status
    await pool.query(`
      UPDATE bids 
      SET status = 'awarded', updated_at = NOW()
      WHERE id = $1
    `, [bidId])

    // Update other bids to rejected
    await pool.query(`
      UPDATE bids 
      SET status = 'rejected', updated_at = NOW()
      WHERE tender_id = $1 AND id != $2
    `, [id, bidId])

    logger.info(`Tender awarded: ${id} to bid ${bidId} by user ${req.user.id}`)

    res.json({
      success: true,
      message: 'Tender awarded successfully'
    })
  } catch (error) {
    logger.error("Award tender error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to award tender",
    })
  }
})

// Invite vendors to tender
router.post(
  "/:id/invite",
  authenticateToken,
  authorizeRoles('tender-creator', 'admin'),
  validate(tenderSchemas.invite),
  async (req, res) => {
    try {
      const { id } = req.params
      const { vendorIds, message } = req.body
      const userId = req.user.id

      // Get vendor details
      const vendorsResult = await pool.query(
        "SELECT id, first_name, last_name, email FROM users WHERE id = ANY($1) AND role = $2",
        [vendorIds, "vendor"],
      )

      const vendors = vendorsResult.rows

      if (vendors.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid vendors found",
        })
      }

      // Get inviter details
      const inviterResult = await pool.query("SELECT first_name, last_name FROM users WHERE id = $1", [userId])
      const inviter = inviterResult.rows[0]

      for (const vendor of vendors) {
        // Check if already invited
        const existingInvitation = await pool.query(
          "SELECT id FROM tender_invitations WHERE tenderId = $1 AND vendorId = $2",
          [id, vendor.id],
        )

        if (existingInvitation.rows.length === 0) {
          // Create invitation
          await pool.query(
            "INSERT INTO tender_invitations (tenderId, vendorId, invitedBy, message) VALUES ($1, $2, $3, $4)",
            [id, vendor.id, userId, message],
          )

          // Create notification
          await createNotification({
            userId: vendor.id,
            type: "tender_invitation",
            title: "New tender invitation",
            message: `You've been invited to bid on "${id}"`,
            relatedId: id,
            relatedType: "tender",
          })

          // Send invitation email
          emailService.sendTenderInvitationEmail(vendor, id, inviter).catch((err) =>
            logger.error("Failed to send invitation email:", err),
          )
        }
      }

      logger.info(`${vendors.length} vendors invited to tender: ${id}`)

      res.json({
        success: true,
        message: `Invitations sent to ${vendors.length} vendors`,
      })
    } catch (error) {
      logger.error("Invite vendors error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to send invitations",
      })
    }
  },
)

module.exports = router
