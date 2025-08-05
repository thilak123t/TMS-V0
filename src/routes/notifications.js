const express = require("express")
const { query } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")
const logger = require("../utils/logger")

const router = express.Router()

// Get user notifications
router.get("/", authenticateToken, async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query

  const offset = (page - 1) * limit

  try {
    const whereConditions = ["user_id = $1"]
    const queryParams = [req.user.id]
    const paramIndex = 2

    if (unreadOnly === "true") {
      whereConditions.push(`read = false`)
    }

    const whereClause = whereConditions.join(" AND ")

    const notificationsQuery = `
      SELECT id, type, title, message, tender_id, bid_id, priority, read, action_url, created_at
      FROM notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    const countQuery = `
      SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE read = false) as unread
      FROM notifications
      WHERE ${whereClause}
    `

    const [notificationsResult, countResult] = await Promise.all([
      query(notificationsQuery, queryParams),
      query(countQuery, [req.user.id]),
    ])

    const notifications = notificationsResult.rows.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      tenderId: notification.tender_id,
      bidId: notification.bid_id,
      priority: notification.priority,
      read: notification.read,
      actionUrl: notification.action_url,
      createdAt: notification.created_at,
    }))

    const { total, unread } = countResult.rows[0]
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        notifications,
        counts: {
          total: Number.parseInt(total),
          unread: Number.parseInt(unread),
        },
        pagination: {
          currentPage: Number.parseInt(page),
          totalPages,
          totalItems: Number.parseInt(total),
          itemsPerPage: Number.parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    logger.error("Get notifications error:", error)
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
})

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    const result = await query("UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *", [
      id,
      req.user.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" })
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    logger.error("Mark notification read error:", error)
    res.status(500).json({ error: "Failed to mark notification as read" })
  }
})

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const result = await query("UPDATE notifications SET read = true WHERE user_id = $1 AND read = false", [
      req.user.id,
    ])

    res.json({
      success: true,
      message: `${result.rowCount} notifications marked as read`,
      data: {
        updatedCount: result.rowCount,
      },
    })
  } catch (error) {
    logger.error("Mark all notifications read error:", error)
    res.status(500).json({ error: "Failed to mark all notifications as read" })
  }
})

// Delete notification
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params

  try {
    const result = await query("DELETE FROM notifications WHERE id = $1 AND user_id = $2", [id, req.user.id])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" })
    }

    res.json({
      success: true,
      message: "Notification deleted",
    })
  } catch (error) {
    logger.error("Delete notification error:", error)
    res.status(500).json({ error: "Failed to delete notification" })
  }
})

// Delete all read notifications
router.delete("/read", authenticateToken, async (req, res) => {
  try {
    const result = await query("DELETE FROM notifications WHERE user_id = $1 AND read = true", [req.user.id])

    res.json({
      success: true,
      message: `${result.rowCount} read notifications deleted`,
      data: {
        deletedCount: result.rowCount,
      },
    })
  } catch (error) {
    logger.error("Delete read notifications error:", error)
    res.status(500).json({ error: "Failed to delete read notifications" })
  }
})

// Get notification statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE read = false) as unread,
        COUNT(*) FILTER (WHERE type = 'invitation') as invitations,
        COUNT(*) FILTER (WHERE type = 'comment') as comments,
        COUNT(*) FILTER (WHERE type = 'update') as updates,
        COUNT(*) FILTER (WHERE type = 'award') as awards,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
      FROM notifications
      WHERE user_id = $1
    `

    const result = await query(statsQuery, [req.user.id])
    const stats = result.rows[0]

    res.json({
      success: true,
      data: {
        total: Number.parseInt(stats.total),
        unread: Number.parseInt(stats.unread),
        byType: {
          invitations: Number.parseInt(stats.invitations),
          comments: Number.parseInt(stats.comments),
          updates: Number.parseInt(stats.updates),
          awards: Number.parseInt(stats.awards),
        },
        byPriority: {
          high: Number.parseInt(stats.high_priority),
        },
        recent: {
          last24Hours: Number.parseInt(stats.last_24h),
        },
      },
    })
  } catch (error) {
    logger.error("Get notification stats error:", error)
    res.status(500).json({ error: "Failed to fetch notification statistics" })
  }
})

module.exports = router
