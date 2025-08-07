const express = require("express")
const { query } = require("../config/database")
const { auth: authenticateToken } = require("../middleware/auth")
const { validate, schemas } = require("../middleware/validation")
const logger = require("../utils/logger")
const { createNotification } = require("../services/notificationService")

const router = express.Router()

// Get comments for a tender
router.get("/tender/:tenderId", authenticateToken, async (req, res) => {
  const { tenderId } = req.params
  const { page = 1, limit = 20 } = req.query

  const offset = (page - 1) * limit

  try {
    // Check if user has access to tender
    const tenderResult = await query(
      `SELECT t.id, t.created_by, t.status, t.title,
              CASE WHEN ti.vendor_id IS NOT NULL THEN true ELSE false END as is_invited
       FROM tenders t
       LEFT JOIN tender_invitations ti ON t.id = ti.tender_id AND ti.vendor_id = $2
       WHERE t.id = $1`,
      [tenderId, req.user.id],
    )

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({ error: "Tender not found" })
    }

    const tender = tenderResult.rows[0]

    // Check permissions
    if (req.user.role === "vendor") {
      if (tender.status !== "published" && !tender.is_invited) {
        return res.status(403).json({ error: "Access denied" })
      }
    } else if (req.user.role === "tender-creator" && tender.created_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Get comments with nested replies
    const commentsQuery = `
      WITH RECURSIVE comment_tree AS (
        -- Base case: top-level comments
        SELECT c.id, c.tender_id, c.author_id, c.message, c.parent_id, c.created_at, c.updated_at,
               u.first_name || ' ' || u.last_name as author_name, u.role as author_role,
               0 as depth, ARRAY[c.created_at, c.id::text] as sort_path
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.tender_id = $1 AND c.parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: replies
        SELECT c.id, c.tender_id, c.author_id, c.message, c.parent_id, c.created_at, c.updated_at,
               u.first_name || ' ' || u.last_name as author_name, u.role as author_role,
               ct.depth + 1, ct.sort_path || ARRAY[c.created_at, c.id::text]
        FROM comments c
        JOIN users u ON c.author_id = u.id
        JOIN comment_tree ct ON c.parent_id = ct.id
        WHERE ct.depth < 3  -- Limit nesting depth
      )
      SELECT * FROM comment_tree
      ORDER BY sort_path
      LIMIT $2 OFFSET $3
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments
      WHERE tender_id = $1
    `

    const [commentsResult, countResult] = await Promise.all([
      query(commentsQuery, [tenderId, limit, offset]),
      query(countQuery, [tenderId]),
    ])

    const comments = commentsResult.rows.map((comment) => ({
      id: comment.id,
      tenderId: comment.tender_id,
      authorId: comment.author_id,
      message: comment.message,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: {
        name: comment.author_name,
        role: comment.author_role,
      },
      depth: comment.depth,
    }))

    const total = Number.parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        comments,
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
    logger.error("Get comments error:", error)
    res.status(500).json({ error: "Failed to fetch comments" })
  }
})

// Create new comment
router.post("/tender/:tenderId", authenticateToken, validate(schemas.createComment), async (req, res) => {
  const { tenderId } = req.params
  const { message, parent_id } = req.body

  try {
    // Check if user has access to tender
    const tenderResult = await query(
      `SELECT t.id, t.title, t.created_by, t.status,
              CASE WHEN ti.vendor_id IS NOT NULL THEN true ELSE false END as is_invited
       FROM tenders t
       LEFT JOIN tender_invitations ti ON t.id = ti.tender_id AND ti.vendor_id = $2
       WHERE t.id = $1`,
      [tenderId, req.user.id],
    )

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({ error: "Tender not found" })
    }

    const tender = tenderResult.rows[0]

    // Check permissions
    if (req.user.role === "vendor") {
      if (tender.status !== "published" && !tender.is_invited) {
        return res.status(403).json({ error: "Access denied" })
      }
    } else if (req.user.role === "tender-creator" && tender.created_by !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Validate parent comment if provided
    if (parent_id) {
      const parentResult = await query("SELECT id FROM comments WHERE id = $1 AND tender_id = $2", [parent_id, tenderId])
      if (parentResult.rows.length === 0) {
        return res.status(400).json({ error: "Parent comment not found" })
      }
    }

    // Create comment
    const commentResult = await query(
      `INSERT INTO comments (tender_id, author_id, message, parent_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [tenderId, req.user.id, message, parent_id],
    )

    const comment = commentResult.rows[0]

    // Get all users who should be notified (tender creator and other commenters)
    const notifyUsersQuery = `
      SELECT DISTINCT u.id, u.first_name, u.last_name
      FROM users u
      WHERE (u.id = $1 OR u.id IN (
        SELECT DISTINCT author_id FROM comments WHERE tender_id = $2
      )) AND u.id != $3
    `

    const notifyUsersResult = await query(notifyUsersQuery, [tender.created_by, tenderId, req.user.id])

    // Create notifications
    const notificationPromises = notifyUsersResult.rows.map((user) =>
      createNotification({
        user_id: user.id,
        type: "comment",
        title: "New Comment",
        message: `${req.user.first_name} ${req.user.last_name} commented on '${tender.title}'`,
        reference_id: tenderId,
        reference_type: "tender",
      }),
    )

    await Promise.all(notificationPromises)

    logger.info(`Comment created: ${comment.id} on tender ${tenderId} by ${req.user.email}`)

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: {
        comment: {
          id: comment.id,
          tenderId: comment.tender_id,
          authorId: comment.author_id,
          message: comment.message,
          parentId: comment.parent_id,
          createdAt: comment.created_at,
          author: {
            name: `${req.user.first_name} ${req.user.last_name}`,
            role: req.user.role,
          },
        },
      },
    })
  } catch (error) {
    logger.error("Create comment error:", error)
    res.status(500).json({ error: "Failed to create comment" })
  }
})

// Update comment
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params
  const { message } = req.body

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required" })
  }

  try {
    // Check if comment exists and belongs to user
    const commentResult = await query("SELECT author_id, created_at FROM comments WHERE id = $1", [id])

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" })
    }

    const comment = commentResult.rows[0]

    if (comment.author_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Check if comment is too old to edit (24 hours)
    const commentAge = Date.now() - new Date(comment.created_at).getTime()
    const maxEditTime = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (commentAge > maxEditTime) {
      return res.status(400).json({ error: "Comment is too old to edit" })
    }

    // Update comment
    const result = await query(
      "UPDATE comments SET message = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [message, id],
    )

    const updatedComment = result.rows[0]

    logger.info(`Comment updated: ${id} by ${req.user.email}`)

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: {
        comment: {
          id: updatedComment.id,
          message: updatedComment.message,
          updatedAt: updatedComment.updated_at,
        },
      },
    })
  } catch (error) {
    logger.error("Update comment error:", error)
    res.status(500).json({ error: "Failed to update comment" })
  }
})

// Delete comment
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    // Check if comment exists and user has permission
    const commentResult = await query(
      `SELECT c.author_id, c.tender_id, t.created_by
       FROM comments c
       JOIN tenders t ON c.tender_id = t.id
       WHERE c.id = $1`,
      [id],
    )

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" })
    }

    const comment = commentResult.rows[0]

    // Check permissions (author, tender creator, or admin can delete)
    if (comment.author_id !== req.user.id && comment.created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" })
    }

    // Delete comment (cascade will handle replies)
    await query("DELETE FROM comments WHERE id = $1", [id])

    logger.info(`Comment deleted: ${id} by ${req.user.email}`)

    res.json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    logger.error("Delete comment error:", error)
    res.status(500).json({ error: "Failed to delete comment" })
  }
})

module.exports = router
