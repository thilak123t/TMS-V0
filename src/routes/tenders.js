const express = require("express")
const { query, transaction } = require("../config/database")
const { authenticateToken, requireTenderCreator, requireAdmin } = require("../middleware/auth")
const { validate, tenderSchemas, querySchemas } = require("../middleware/validation")
const { sendTenderInvitationEmail } = require("../services/emailService")
const { createNotification, createBulkNotifications } = require("../services/notificationService")
const logger = require("../utils/logger")

const router = express.Router()

// Get all tenders with filtering and pagination
router.get("/", authenticateToken, validate(querySchemas.pagination, "query"), async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query
    const { status, category, minPrice, maxPrice, search } = req.query
    const offset = (page - 1) * limit
    const userRole = req.user.role
    const userId = req.user.id

    let whereClause = "1=1"
    const queryParams = []
    let paramCount = 0

    // Role-based filtering
    if (userRole === "vendor") {
      // Vendors can only see published tenders or tenders they're invited to
      whereClause += ` AND (t.status = 'published' OR EXISTS (
        SELECT 1 FROM tender_invitations ti 
        WHERE ti.tenderId = t.id AND ti.vendorId = $${++paramCount}
      ))`
      queryParams.push(userId)
    } else if (userRole === "tender-creator") {
      // Tender creators can only see their own tenders
      whereClause += ` AND t.createdBy = $${++paramCount}`
      queryParams.push(userId)
    }
    // Admins can see all tenders

    // Apply filters
    if (status) {
      whereClause += ` AND t.status = $${++paramCount}`
      queryParams.push(status)
    }

    if (category) {
      whereClause += ` AND t.category ILIKE $${++paramCount}`
      queryParams.push(`%${category}%`)
    }

    if (minPrice) {
      whereClause += ` AND t.basePrice >= $${++paramCount}`
      queryParams.push(minPrice)
    }

    if (maxPrice) {
      whereClause += ` AND t.basePrice <= $${++paramCount}`
      queryParams.push(maxPrice)
    }

    if (search) {
      whereClause += ` AND (t.title ILIKE $${++paramCount} OR t.description ILIKE $${++paramCount})`
      queryParams.push(`%${search}%`, `%${search}%`)
      paramCount++
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as total FROM tenders t WHERE ${whereClause}`, queryParams)
    const total = Number.parseInt(countResult.rows[0].total)

    // Get tenders
    const tendersResult = await query(
      `SELECT 
        t.*,
        u.firstName as creatorFirstName,
        u.lastName as creatorLastName,
        u.companyName as creatorCompany,
        (SELECT COUNT(*) FROM bids b WHERE b.tenderId = t.id) as bidCount,
        (SELECT COUNT(*) FROM tender_invitations ti WHERE ti.tenderId = t.id) as invitationCount
       FROM tenders t
       JOIN users u ON t.createdBy = u.id
       WHERE ${whereClause}
       ORDER BY t.${sortBy} ${sortOrder}
       LIMIT $${++paramCount} OFFSET $${++paramCount}`,
      [...queryParams, limit, offset],
    )

    const tenders = tendersResult.rows.map((tender) => ({
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
      updatedAt: tender.updatedat,
      creator: {
        firstName: tender.creatorfirstname,
        lastName: tender.creatorlastname,
        companyName: tender.creatorcompany,
      },
      bidCount: Number.parseInt(tender.bidcount),
      invitationCount: Number.parseInt(tender.invitationcount),
    }))

    res.json({
      success: true,
      data: {
        tenders,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
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
    const tenderId = req.params.id
    const userId = req.user.id
    const userRole = req.user.role

    // Get tender with creator info
    const tenderResult = await query(
      `SELECT 
        t.*,
        u.firstName as creatorFirstName,
        u.lastName as creatorLastName,
        u.companyName as creatorCompany,
        u.email as creatorEmail
       FROM tenders t
       JOIN users u ON t.createdBy = u.id
       WHERE t.id = $1`,
      [tenderId],
    )

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      })
    }

    const tender = tenderResult.rows[0]

    // Check access permissions
    if (userRole === "vendor") {
      // Vendors can only see published tenders or tenders they're invited to
      if (tender.status !== "published") {
        const invitationResult = await query(
          "SELECT id FROM tender_invitations WHERE tenderId = $1 AND vendorId = $2",
          [tenderId, userId],
        )

        if (invitationResult.rows.length === 0) {
          return res.status(403).json({
            success: false,
            message: "Access denied",
          })
        }
      }
    } else if (userRole === "tender-creator" && tender.createdby !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Get bids count and user's bid if vendor
    let userBid = null
    let bidCount = 0

    const bidCountResult = await query("SELECT COUNT(*) as count FROM bids WHERE tenderId = $1", [tenderId])
    bidCount = Number.parseInt(bidCountResult.rows[0].count)

    if (userRole === "vendor") {
      const userBidResult = await query("SELECT * FROM bids WHERE tenderId = $1 AND vendorId = $2", [tenderId, userId])

      if (userBidResult.rows.length > 0) {
        userBid = userBidResult.rows[0]
      }
    }

    res.json({
      success: true,
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
          updatedAt: tender.updatedat,
          creator: {
            firstName: tender.creatorfirstname,
            lastName: tender.creatorlastname,
            companyName: tender.creatorcompany,
            email: userRole === "admin" ? tender.creatoremail : undefined,
          },
          bidCount,
          userBid,
        },
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
router.post("/", authenticateToken, requireTenderCreator, validate(tenderSchemas.create), async (req, res) => {
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

    const result = await query(
      `INSERT INTO tenders (
        title, description, requirements, basePrice, currency, deadline,
        category, location, attachments, createdBy, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
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
router.put("/:id", authenticateToken, requireTenderCreator, validate(tenderSchemas.update), async (req, res) => {
  try {
    const tenderId = req.params.id
    const userId = req.user.id
    const userRole = req.user.role
    const updates = req.body

    // Check if tender exists and user has permission
    const existingTender = await query("SELECT * FROM tenders WHERE id = $1", [tenderId])

    if (existingTender.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      })
    }

    const tender = existingTender.rows[0]

    // Check permissions
    if (userRole !== "admin" && tender.createdby !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Don't allow updates to awarded tenders
    if (tender.status === "awarded") {
      return res.status(400).json({
        success: false,
        message: "Cannot update awarded tender",
      })
    }

    // Build update query
    const updateFields = []
    const updateValues = []
    let paramCount = 0

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = $${++paramCount}`)
        updateValues.push(key === "attachments" ? JSON.stringify(updates[key]) : updates[key])
      }
    })

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      })
    }

    updateFields.push(`updatedAt = NOW()`)
    updateValues.push(tenderId)

    const result = await query(
      `UPDATE tenders SET ${updateFields.join(", ")} WHERE id = $${++paramCount} RETURNING *`,
      updateValues,
    )

    const updatedTender = result.rows[0]

    logger.info(`Tender updated: ${updatedTender.title} by user ${req.user.email}`)

    res.json({
      success: true,
      message: "Tender updated successfully",
      data: {
        tender: {
          id: updatedTender.id,
          title: updatedTender.title,
          description: updatedTender.description,
          requirements: updatedTender.requirements,
          basePrice: updatedTender.baseprice,
          currency: updatedTender.currency,
          deadline: updatedTender.deadline,
          status: updatedTender.status,
          category: updatedTender.category,
          location: updatedTender.location,
          attachments: updatedTender.attachments,
          updatedAt: updatedTender.updatedat,
        },
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
router.delete("/:id", authenticateToken, requireTenderCreator, async (req, res) => {
  try {
    const tenderId = req.params.id
    const userId = req.user.id
    const userRole = req.user.role

    // Check if tender exists and user has permission
    const existingTender = await query("SELECT * FROM tenders WHERE id = $1", [tenderId])

    if (existingTender.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      })
    }

    const tender = existingTender.rows[0]

    // Check permissions
    if (userRole !== "admin" && tender.createdby !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Don't allow deletion of tenders with bids
    const bidCount = await query("SELECT COUNT(*) as count FROM bids WHERE tenderId = $1", [tenderId])

    if (Number.parseInt(bidCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete tender with existing bids",
      })
    }

    // Delete tender (cascade will handle related records)
    await query("DELETE FROM tenders WHERE id = $1", [tenderId])

    logger.info(`Tender deleted: ${tender.title} by user ${req.user.email}`)

    res.json({
      success: true,
      message: "Tender deleted successfully",
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
router.put("/:id/publish", authenticateToken, requireTenderCreator, async (req, res) => {
  try {
    const tenderId = req.params.id
    const userId = req.user.id
    const userRole = req.user.role

    // Check if tender exists and user has permission
    const existingTender = await query("SELECT * FROM tenders WHERE id = $1", [tenderId])

    if (existingTender.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found",
      })
    }

    const tender = existingTender.rows[0]

    // Check permissions
    if (userRole !== "admin" && tender.createdby !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    if (tender.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft tenders can be published",
      })
    }

    // Update status to published
    await query("UPDATE tenders SET status = $1, updatedAt = NOW() WHERE id = $2", ["published", tenderId])

    logger.info(`Tender published: ${tender.title} by user ${req.user.email}`)

    res.json({
      success: true,
      message: "Tender published successfully",
    })
  } catch (error) {
    logger.error("Publish tender error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to publish tender",
    })
  }
})

// Award tender to a bid
router.put("/:id/award", authenticateToken, requireTenderCreator, async (req, res) => {
  try {
    const tenderId = req.params.id
    const { bidId } = req.body
    const userId = req.user.id
    const userRole = req.user.role

    if (!bidId) {
      return res.status(400).json({
        success: false,
        message: "Bid ID is required",
      })
    }

    await transaction(async (client) => {
      // Check if tender exists and user has permission
      const tenderResult = await client.query("SELECT * FROM tenders WHERE id = $1", [tenderId])

      if (tenderResult.rows.length === 0) {
        throw new Error("Tender not found")
      }

      const tender = tenderResult.rows[0]

      // Check permissions
      if (userRole !== "admin" && tender.createdby !== userId) {
        throw new Error("Access denied")
      }

      if (tender.status === "awarded") {
        throw new Error("Tender already awarded")
      }

      // Check if bid exists and belongs to this tender
      const bidResult = await client.query(
        `SELECT b.*, u.firstName, u.lastName, u.email 
         FROM bids b 
         JOIN users u ON b.vendorId = u.id 
         WHERE b.id = $1 AND b.tenderId = $2`,
        [bidId, tenderId],
      )

      if (bidResult.rows.length === 0) {
        throw new Error("Bid not found")
      }

      const bid = bidResult.rows[0]

      // Update tender status to awarded
      await client.query("UPDATE tenders SET status = $1, awardedBidId = $2, updatedAt = NOW() WHERE id = $3", [
        "awarded",
        bidId,
        tenderId,
      ])

      // Update winning bid status
      await client.query("UPDATE bids SET status = $1, updatedAt = NOW() WHERE id = $2", ["awarded", bidId])

      // Update other bids to rejected
      await client.query("UPDATE bids SET status = $1, updatedAt = NOW() WHERE tenderId = $2 AND id != $3", [
        "rejected",
        tenderId,
        bidId,
      ])

      // Create notification for winning vendor
      await createNotification({
        userId: bid.vendorid,
        type: "tender_awarded",
        title: "Congratulations! Your bid won",
        message: `Your bid for "${tender.title}" has been selected`,
        relatedId: tenderId,
        relatedType: "tender",
      })

      // Send award email
      const { sendTenderAwardEmail } = require("../services/emailService")
      sendTenderAwardEmail({ firstName: bid.firstname, lastName: bid.lastname, email: bid.email }, tender, bid).catch(
        (err) => logger.error("Failed to send award email:", err),
      )

      logger.info(`Tender awarded: ${tender.title} to ${bid.firstname} ${bid.lastname}`)
    })

    res.json({
      success: true,
      message: "Tender awarded successfully",
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
  requireTenderCreator,
  validate(tenderSchemas.invite),
  async (req, res) => {
    try {
      const tenderId = req.params.id
      const { vendorIds, message } = req.body
      const userId = req.user.id
      const userRole = req.user.role

      // Check if tender exists and user has permission
      const tenderResult = await query("SELECT * FROM tenders WHERE id = $1", [tenderId])

      if (tenderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Tender not found",
        })
      }

      const tender = tenderResult.rows[0]

      // Check permissions
      if (userRole !== "admin" && tender.createdby !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      // Get vendor details
      const vendorsResult = await query(
        "SELECT id, firstName, lastName, email FROM users WHERE id = ANY($1) AND role = $2",
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
      const inviterResult = await query("SELECT firstName, lastName FROM users WHERE id = $1", [userId])
      const inviter = inviterResult.rows[0]

      await transaction(async (client) => {
        const invitations = []

        for (const vendor of vendors) {
          // Check if already invited
          const existingInvitation = await client.query(
            "SELECT id FROM tender_invitations WHERE tenderId = $1 AND vendorId = $2",
            [tenderId, vendor.id],
          )

          if (existingInvitation.rows.length === 0) {
            // Create invitation
            const invitationResult = await client.query(
              "INSERT INTO tender_invitations (tenderId, vendorId, invitedBy, message) VALUES ($1, $2, $3, $4) RETURNING *",
              [tenderId, vendor.id, userId, message],
            )

            invitations.push(invitationResult.rows[0])

            // Create notification
            await createNotification({
              userId: vendor.id,
              type: "tender_invitation",
              title: "New tender invitation",
              message: `You've been invited to bid on "${tender.title}"`,
              relatedId: tenderId,
              relatedType: "tender",
            })

            // Send invitation email
            sendTenderInvitationEmail(vendor, tender, inviter).catch((err) =>
              logger.error("Failed to send invitation email:", err),
            )
          }
        }

        logger.info(`${invitations.length} vendors invited to tender: ${tender.title}`)
      })

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
