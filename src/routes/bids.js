const express = require("express")
const router = express.Router()
const { query, transaction } = require("../config/database")
const { authenticateToken, authorizeRoles } = require("../middleware/auth")
const { validate, schemas } = require("../middleware/validation")
const logger = require("../utils/logger")
const notificationService = require("../services/notificationService")
const emailService = require("../services/emailService")

/**
 * @route   GET /api/bids
 * @desc    Get all bids (filtered by user role)
 * @access  Private
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tender_id } = req.query
    const offset = (page - 1) * limit
    const userId = req.user.id

    // Build query based on filters
    let queryText = `
      SELECT b.*, t.title as tender_title, t.submission_deadline, t.status as tender_status,
             u.first_name as vendor_first_name, u.last_name as vendor_last_name, u.company_name as vendor_company
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      JOIN users u ON b.vendor_id = u.id
    `

    const queryParams = []
    let paramCount = 0

    if (req.user.role === "vendor") {
      // Vendors can only see their own bids
      queryText += ` WHERE b.vendor_id = $${++paramCount}`
      queryParams.push(userId)
    } else if (req.user.role === "tender-creator") {
      // Tender creators can see bids for tenders they created
      queryText += ` WHERE t.created_by = $${++paramCount}`
      queryParams.push(userId)
    } else if (req.user.role === "admin") {
      // Admins can see all bids
      queryText += ` WHERE 1=1`
    } else {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    if (status) {
      queryText += ` AND b.status = $${++paramCount}`
      queryParams.push(status)
    }

    if (tender_id) {
      queryText += ` AND b.tender_id = $${++paramCount}`
      queryParams.push(tender_id)
    }

    // Add pagination
    queryText += ` ORDER BY b.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`
    queryParams.push(limit, offset)

    // Get bids
    const result = await query(queryText, queryParams)

    // Get total count for pagination
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
    `

    const countParams = []
    let countParamCount = 0

    if (req.user.role === "vendor") {
      countQueryText += ` WHERE b.vendor_id = $${++countParamCount}`
      countParams.push(userId)
    } else if (req.user.role === "tender-creator") {
      countQueryText += ` WHERE t.created_by = $${++countParamCount}`
      countParams.push(userId)
    } else if (req.user.role === "admin") {
      countQueryText += ` WHERE 1=1`
    }

    if (status) {
      countQueryText += ` AND b.status = $${++countParamCount}`
      countParams.push(status)
    }

    if (tender_id) {
      countQueryText += ` AND b.tender_id = $${++countParamCount}`
      countParams.push(tender_id)
    }

    const countResult = await query(countQueryText, countParams)
    const total = Number.parseInt(countResult.rows[0].total)

    res.status(200).json({
      success: true,
      data: {
        bids: result.rows,
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    logger.error("Error fetching bids:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   GET /api/bids/:id
 * @desc    Get a single bid by ID
 * @access  Private
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const bidId = req.params.id
    const userId = req.user.id

    // Get bid with related data
    const result = await query(
      `
      SELECT b.*, 
             t.title as tender_title, t.description as tender_description, 
             t.submission_deadline, t.status as tender_status, t.budget_min, t.budget_max,
             u.first_name as vendor_first_name, u.last_name as vendor_last_name,
             u.email as vendor_email, u.company_name as vendor_company
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      JOIN users u ON b.vendor_id = u.id
      WHERE b.id = $1 AND (b.vendor_id = $2 OR t.created_by = $2 OR $3 = 'admin')
    `,
      [bidId, userId, req.user.role],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Bid not found or access denied" })
    }

    const bid = result.rows[0]

    // Check authorization
    if (req.user.role === "vendor" && bid.vendor_id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    if (req.user.role === "tender-creator") {
      // Check if tender creator is the owner of the tender
      const { rows: tenderRows } = await query("SELECT created_by FROM tenders WHERE id = $1", [bid.tender_id])

      if (tenderRows.length === 0 || tenderRows[0].created_by !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access" })
      }
    }

    // Get bid documents
    const documentsResult = await query(
      `
      SELECT id, file_name, file_path, file_size, file_type, created_at
      FROM bid_documents
      WHERE bid_id = $1
    `,
      [bidId],
    )

    // Get bid evaluation if available
    const evaluationResult = await query(
      `
      SELECT id, technical_score, financial_score, total_score, comments, evaluated_by, created_at
      FROM bid_evaluations
      WHERE bid_id = $1
    `,
      [bidId],
    )

    const bidWithDetails = {
      ...bid,
      documents: documentsResult.rows,
      evaluation: evaluationResult.rows[0] || null,
    }

    res.status(200).json({
      success: true,
      data: bidWithDetails,
    })
  } catch (error) {
    logger.error("Error fetching bid:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   POST /api/bids
 * @desc    Create a new bid
 * @access  Private (Vendors only)
 */
router.post("/", authenticateToken, authorizeRoles('vendor'), validate(schemas.createBid), async (req, res) => {
  try {
    const { tender_id, amount, currency, validity_period, description, documents } = req.body
    const vendorId = req.user.id

    // Check if tender exists and is open for bidding
    const tenderResult = await query(
      `
      SELECT t.*, u.email as creator_email, u.first_name as creator_first_name, u.last_name as creator_last_name
      FROM tenders t
      JOIN users u ON t.created_by = u.id
      WHERE t.id = $1 AND t.status = 'published'
    `,
      [tender_id],
    )

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tender not found or not open for bidding.",
      })
    }

    const tender = tenderResult.rows[0]

    // Check if submission deadline has passed
    if (new Date(tender.submission_deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Submission deadline has passed.",
      })
    }

    // Check if vendor has already submitted a bid
    const existingBidResult = await query(
      `
      SELECT * FROM bids
      WHERE tender_id = $1 AND vendor_id = $2
    `,
      [tender_id, vendorId],
    )

    if (existingBidResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a bid for this tender. Please update your existing bid.",
      })
    }

    // Create bid using transaction
    const result = await transaction(async (client) => {
      // Insert bid
      const bidResult = await client.query(
        `
        INSERT INTO bids (tender_id, vendor_id, amount, currency, validity_period, description, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW(), NOW())
        RETURNING *
      `,
        [tender_id, vendorId, amount, currency, validity_period, description],
      )

      const bid = bidResult.rows[0]

      // Insert documents if provided
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          await client.query(
            `
            INSERT INTO bid_documents (bid_id, file_name, file_path, file_size, file_type, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `,
            [bid.id, doc.file_name, doc.file_path, doc.file_size, doc.file_type],
          )
        }
      }

      return bid
    })

    // Get vendor details
    const vendorResult = await query(
      `
      SELECT * FROM users WHERE id = $1
    `,
      [vendorId],
    )

    const vendor = vendorResult.rows[0]

    // Create notification for tender creator
    await notificationService.createNotification({
      user_id: tender.created_by,
      type: "bid_submitted",
      title: "New Bid Submitted",
      message: `${vendor.company_name || vendor.first_name + ' ' + vendor.last_name} has submitted a bid for tender "${tender.title}"`,
      reference_id: result.id,
      reference_type: "bid",
    })

    // Send email notification
    await emailService.sendBidSubmissionEmail(result, tender, vendor)

    res.status(201).json({
      success: true,
      message: "Bid submitted successfully.",
      data: result,
    })
  } catch (error) {
    logger.error("Error creating bid:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   PUT /api/bids/:id
 * @desc    Update a bid
 * @access  Private (Vendors - own bids only)
 */
router.put("/:id", authenticateToken, authorizeRoles('vendor'), validate(schemas.updateBid), async (req, res) => {
  try {
    const bidId = req.params.id
    const { amount, currency, validity_period, description, documents } = req.body

    // Check if bid exists and can be updated
    const bidResult = await query(
      `
      SELECT b.*, t.submission_deadline, t.status as tender_status, t.created_by
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      WHERE b.id = $1 AND b.vendor_id = $2
    `,
      [bidId, req.user.id],
    )

    if (bidResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bid not found.",
      })
    }

    const bid = bidResult.rows[0]

    // Check if bid can be updated (not evaluated, accepted or rejected)
    if (["evaluated", "accepted", "rejected"].includes(bid.status)) {
      return res.status(400).json({
        success: false,
        message: `Bid cannot be updated because it has been ${bid.status}.`,
      })
    }

    // Check if tender is still open
    if (bid.tender_status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Tender is no longer open for bidding.",
      })
    }

    // Check if submission deadline has passed
    if (new Date(bid.submission_deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Submission deadline has passed.",
      })
    }

    // Update bid using transaction
    const result = await transaction(async (client) => {
      // Update bid
      const updateResult = await client.query(
        `
        UPDATE bids
        SET amount = $1, currency = $2, validity_period = $3, description = $4, status = 'revised', updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `,
        [amount, currency, validity_period, description, bidId],
      )

      // Handle documents if provided
      if (documents && documents.length > 0) {
        // Delete existing documents
        await client.query(
          `
          DELETE FROM bid_documents
          WHERE bid_id = $1
        `,
          [bidId],
        )

        // Insert new documents
        for (const doc of documents) {
          await client.query(
            `
            INSERT INTO bid_documents (bid_id, file_name, file_path, file_size, file_type, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
          `,
            [bidId, doc.file_name, doc.file_path, doc.file_size, doc.file_type],
          )
        }
      }

      return updateResult.rows[0]
    })

    // Get vendor details
    const vendorResult = await query(
      `
      SELECT * FROM users WHERE id = $1
    `,
      [req.user.id],
    )

    const vendor = vendorResult.rows[0]

    // Create notification for tender creator
    await notificationService.createNotification({
      user_id: bid.created_by,
      type: "bid_revised",
      title: "Bid Updated",
      message: `${vendor.company_name || vendor.first_name + ' ' + vendor.last_name} has updated their bid`,
      reference_id: bidId,
      reference_type: "bid",
    })

    res.status(200).json({
      success: true,
      message: "Bid updated successfully.",
      data: result,
    })
  } catch (error) {
    logger.error("Error updating bid:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   DELETE /api/bids/:id
 * @desc    Delete a bid
 * @access  Private (Vendors - own bids only)
 */
router.delete("/:id", authenticateToken, authorizeRoles('vendor'), async (req, res) => {
  try {
    const bidId = req.params.id

    // Check if bid exists and can be withdrawn
    const bidResult = await query(
      `
      SELECT b.*, t.submission_deadline, t.status as tender_status, t.created_by, t.title
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      WHERE b.id = $1 AND b.vendor_id = $2
    `,
      [bidId, req.user.id],
    )

    if (bidResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bid not found.",
      })
    }

    const bid = bidResult.rows[0]

    // Check if bid can be withdrawn (not evaluated, accepted or rejected)
    if (["evaluated", "accepted", "rejected"].includes(bid.status)) {
      return res.status(400).json({
        success: false,
        message: `Bid cannot be withdrawn because it has been ${bid.status}.`,
      })
    }

    // Check if tender is still open
    if (bid.tender_status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Tender is no longer open for bidding.",
      })
    }

    // Update bid status to withdrawn
    await query(
      `
      UPDATE bids
      SET status = 'withdrawn', updated_at = NOW()
      WHERE id = $1
    `,
      [bidId],
    )

    // Get vendor details
    const vendorResult = await query(
      `
      SELECT * FROM users WHERE id = $1
    `,
      [req.user.id],
    )

    const vendor = vendorResult.rows[0]

    // Create notification for tender creator
    await notificationService.createNotification({
      user_id: bid.created_by,
      type: "bid_withdrawn",
      title: "Bid Withdrawn",
      message: `${vendor.company_name || vendor.first_name + ' ' + vendor.last_name} has withdrawn their bid for "${bid.title}"`,
      reference_id: bidId,
      reference_type: "bid",
    })

    res.status(200).json({
      success: true,
      message: "Bid withdrawn successfully.",
    })
  } catch (error) {
    logger.error("Error deleting bid:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   PUT /api/bids/:id/award
 * @desc    Award a bid (mark as accepted)
 * @access  Private (Tender creators and admins)
 */
router.put("/:id/award", authenticateToken, authorizeRoles('tender-creator', 'admin'), async (req, res) => {
  try {
    const bidId = req.params.id

    // Get bid with tender details
    const { rows: bidRows } = await query(
      `SELECT b.*, t.id as tender_id, t.title, t.created_by, t.status as tender_status
       FROM bids b
       JOIN tenders t ON b.tender_id = t.id
       WHERE b.id = $1`,
      [bidId],
    )

    if (bidRows.length === 0) {
      return res.status(404).json({ message: "Bid not found" })
    }

    const bid = bidRows[0]

    // Check authorization for tender creator
    if (req.user.role === "tender-creator" && bid.created_by !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    // Check if tender is in the right state
    if (bid.tender_status !== "published") {
      return res.status(400).json({
        message: "Cannot award bid: Tender must be published",
      })
    }

    // Start a transaction
    await transaction(async (client) => {
      // Update bid status
      await client.query(`UPDATE bids SET status = 'accepted', updated_at = NOW() WHERE id = $1`, [bidId])

      // Update tender status
      await client.query(
        `UPDATE tenders SET status = 'awarded', awarded_bid_id = $1, updated_at = NOW() WHERE id = $2`,
        [bidId, bid.tender_id],
      )

      // Update other bids for this tender to 'rejected'
      await client.query(
        `UPDATE bids SET status = 'rejected', updated_at = NOW() 
         WHERE tender_id = $1 AND id != $2`,
        [bid.tender_id, bidId],
      )
    })

    // Get winning vendor details
    const { rows: vendorRows } = await query("SELECT id, first_name, last_name, email FROM users WHERE id = $1", [
      bid.vendor_id,
    ])

    const winner = vendorRows[0]

    // Get other vendors who submitted bids
    const { rows: otherVendorRows } = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, b.amount as bid_amount
       FROM users u
       JOIN bids b ON u.id = b.vendor_id
       WHERE b.tender_id = $1 AND b.id != $2`,
      [bid.tender_id, bidId],
    )

    // Send email notifications
    await emailService.sendTenderAwardEmail(bid, winner, otherVendorRows)

    // Create notification for winning vendor
    await notificationService.createNotification({
      user_id: winner.id,
      type: "bid_accepted",
      title: "Bid Accepted",
      message: `Your bid for "${bid.title}" has been accepted!`,
      reference_id: bid.tender_id,
      reference_type: "tender",
    })

    // Create notifications for other vendors
    for (const vendor of otherVendorRows) {
      await notificationService.createNotification({
        user_id: vendor.id,
        type: "bid_rejected",
        title: "Bid Not Selected",
        message: `Your bid for "${bid.title}" was not selected.`,
        reference_id: bid.tender_id,
        reference_type: "tender",
      })
    }

    res.json({ message: "Bid awarded successfully" })
  } catch (error) {
    logger.error("Error awarding bid:", error)
    res.status(500).json({ message: "Server error" })
  }
})

/**
 * @route   GET /api/bids/tender/:tenderId
 * @desc    Get all bids for a specific tender
 * @access  Private (Tender creators and admins)
 */
router.get("/tender/:tenderId", authenticateToken, async (req, res) => {
  try {
    const tenderId = req.params.tenderId

    // Check if tender exists
    const { rows: tenderRows } = await query("SELECT * FROM tenders WHERE id = $1", [tenderId])

    if (tenderRows.length === 0) {
      return res.status(404).json({ message: "Tender not found" })
    }

    const tender = tenderRows[0]

    // Check authorization
    if (req.user.role === "vendor") {
      // Vendors can only see their own bids
      const { rows } = await query(`SELECT * FROM bids WHERE tender_id = $1 AND vendor_id = $2`, [
        tenderId,
        req.user.id,
      ])
      return res.json(rows)
    } else if (req.user.role === "tender-creator" && tender.created_by !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" })
    }

    // Get all bids for the tender with vendor details
    const { rows } = await query(
      `SELECT b.*, 
              u.first_name as vendor_first_name, 
              u.last_name as vendor_last_name,
              u.company_name as vendor_company
       FROM bids b
       JOIN users u ON b.vendor_id = u.id
       WHERE b.tender_id = $1
       ORDER BY b.amount ASC`,
      [tenderId],
    )

    res.json(rows)
  } catch (error) {
    logger.error("Error fetching bids for tender:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
