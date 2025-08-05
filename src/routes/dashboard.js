const express = require("express")
const { query } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")
const logger = require("../utils/logger")

const router = express.Router()

// Get dashboard statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    let stats = {}

    if (req.user.role === "admin") {
      // Admin dashboard stats
      const adminStatsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'vendor') as total_vendors,
          (SELECT COUNT(*) FROM users WHERE role = 'tender-creator') as total_creators,
          (SELECT COUNT(*) FROM tenders) as total_tenders,
          (SELECT COUNT(*) FROM tenders WHERE status = 'published') as active_tenders,
          (SELECT COUNT(*) FROM bids) as total_bids,
          (SELECT COUNT(*) FROM bids WHERE status = 'pending') as pending_bids,
          (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
          (SELECT COUNT(*) FROM tenders WHERE created_at >= NOW() - INTERVAL '30 days') as new_tenders_30d
      `

      const result = await query(adminStatsQuery)
      const data = result.rows[0]

      stats = {
        users: {
          totalVendors: Number.parseInt(data.total_vendors),
          totalCreators: Number.parseInt(data.total_creators),
          newUsers30d: Number.parseInt(data.new_users_30d),
        },
        tenders: {
          total: Number.parseInt(data.total_tenders),
          active: Number.parseInt(data.active_tenders),
          new30d: Number.parseInt(data.new_tenders_30d),
        },
        bids: {
          total: Number.parseInt(data.total_bids),
          pending: Number.parseInt(data.pending_bids),
        },
      }
    } else if (req.user.role === "tender-creator") {
      // Tender creator dashboard stats
      const creatorStatsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM tenders WHERE creator_id = $1) as my_tenders,
          (SELECT COUNT(*) FROM tenders WHERE creator_id = $1 AND status = 'published') as active_tenders,
          (SELECT COUNT(*) FROM tenders WHERE creator_id = $1 AND status = 'draft') as draft_tenders,
          (SELECT COUNT(*) FROM tenders WHERE creator_id = $1 AND status = 'awarded') as awarded_tenders,
          (SELECT COUNT(*) FROM bids b JOIN tenders t ON b.tender_id = t.id WHERE t.creator_id = $1) as total_bids,
          (SELECT COUNT(*) FROM bids b JOIN tenders t ON b.tender_id = t.id WHERE t.creator_id = $1 AND b.status = 'pending') as pending_bids,
          (SELECT COUNT(*) FROM tender_invitations ti JOIN tenders t ON ti.tender_id = t.id WHERE t.creator_id = $1) as total_invitations,
          (SELECT COUNT(*) FROM comments c JOIN tenders t ON c.tender_id = t.id WHERE t.creator_id = $1 AND c.created_at >= NOW() - INTERVAL '7 days') as recent_comments
      `

      const result = await query(creatorStatsQuery, [req.user.id])
      const data = result.rows[0]

      stats = {
        tenders: {
          total: Number.parseInt(data.my_tenders),
          active: Number.parseInt(data.active_tenders),
          draft: Number.parseInt(data.draft_tenders),
          awarded: Number.parseInt(data.awarded_tenders),
        },
        bids: {
          total: Number.parseInt(data.total_bids),
          pending: Number.parseInt(data.pending_bids),
        },
        invitations: {
          total: Number.parseInt(data.total_invitations),
        },
        activity: {
          recentComments: Number.parseInt(data.recent_comments),
        },
      }
    } else if (req.user.role === "vendor") {
      // Vendor dashboard stats
      const vendorStatsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM tender_invitations WHERE vendor_id = $1) as total_invitations,
          (SELECT COUNT(*) FROM tender_invitations WHERE vendor_id = $1 AND status = 'invited') as pending_invitations,
          (SELECT COUNT(*) FROM bids WHERE vendor_id = $1) as my_bids,
          (SELECT COUNT(*) FROM bids WHERE vendor_id = $1 AND status = 'pending') as pending_bids,
          (SELECT COUNT(*) FROM bids WHERE vendor_id = $1 AND status = 'accepted') as won_bids,
          (SELECT COUNT(*) FROM bids WHERE vendor_id = $1 AND status = 'rejected') as lost_bids,
          (SELECT COUNT(*) FROM user_favorites WHERE user_id = $1) as favorite_tenders,
          (SELECT COUNT(*) FROM tenders WHERE status = 'published' AND deadline > NOW()) as available_tenders
      `

      const result = await query(vendorStatsQuery, [req.user.id])
      const data = result.rows[0]

      stats = {
        invitations: {
          total: Number.parseInt(data.total_invitations),
          pending: Number.parseInt(data.pending_invitations),
        },
        bids: {
          total: Number.parseInt(data.my_bids),
          pending: Number.parseInt(data.pending_bids),
          won: Number.parseInt(data.won_bids),
          lost: Number.parseInt(data.lost_bids),
        },
        tenders: {
          favorites: Number.parseInt(data.favorite_tenders),
          available: Number.parseInt(data.available_tenders),
        },
      }
    }

    res.json({
      success: true,
      data: { stats },
    })
  } catch (error) {
    logger.error("Get dashboard stats error:", error)
    res.status(500).json({ error: "Failed to fetch dashboard statistics" })
  }
})

// Get recent activity
router.get("/activity", authenticateToken, async (req, res) => {
  const { limit = 10 } = req.query

  try {
    let activities = []

    if (req.user.role === "admin") {
      // Admin recent activity
      const activityQuery = `
        SELECT 'user_registered' as type, u.first_name || ' ' || u.last_name as title, 
               'New ' || u.role || ' registered' as description, u.created_at as timestamp
        FROM users u
        WHERE u.created_at >= NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        SELECT 'tender_created' as type, t.title, 
               'New tender created by ' || u.first_name || ' ' || u.last_name as description, t.created_at as timestamp
        FROM tenders t
        JOIN users u ON t.creator_id = u.id
        WHERE t.created_at >= NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        SELECT 'bid_submitted' as type, t.title,
               'New bid submitted by ' || u.first_name || ' ' || u.last_name as description, b.submitted_at as timestamp
        FROM bids b
        JOIN tenders t ON b.tender_id = t.id
        JOIN users u ON b.vendor_id = u.id
        WHERE b.submitted_at >= NOW() - INTERVAL '7 days'
        
        ORDER BY timestamp DESC
        LIMIT $1
      `

      const result = await query(activityQuery, [limit])
      activities = result.rows
    } else if (req.user.role === "tender-creator") {
      // Tender creator recent activity
      const activityQuery = `
        SELECT 'bid_received' as type, t.title,
               'New bid from ' || u.first_name || ' ' || u.last_name as description, b.submitted_at as timestamp
        FROM bids b
        JOIN tenders t ON b.tender_id = t.id
        JOIN users u ON b.vendor_id = u.id
        WHERE t.creator_id = $1 AND b.submitted_at >= NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        SELECT 'comment_added' as type, t.title,
               'New comment from ' || u.first_name || ' ' || u.last_name as description, c.created_at as timestamp
        FROM comments c
        JOIN tenders t ON c.tender_id = t.id
        JOIN users u ON c.author_id = u.id
        WHERE t.creator_id = $1 AND c.author_id != $1 AND c.created_at >= NOW() - INTERVAL '7 days'
        
        ORDER BY timestamp DESC
        LIMIT $2
      `

      const result = await query(activityQuery, [req.user.id, limit])
      activities = result.rows
    } else if (req.user.role === "vendor") {
      // Vendor recent activity
      const activityQuery = `
        SELECT 'invitation_received' as type, t.title,
               'New tender invitation' as description, ti.invited_at as timestamp
        FROM tender_invitations ti
        JOIN tenders t ON ti.tender_id = t.id
        WHERE ti.vendor_id = $1 AND ti.invited_at >= NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        SELECT 'bid_status_changed' as type, t.title,
               'Bid status changed to ' || b.status as description, b.updated_at as timestamp
        FROM bids b
        JOIN tenders t ON b.tender_id = t.id
        WHERE b.vendor_id = $1 AND b.updated_at >= NOW() - INTERVAL '7 days' AND b.updated_at != b.submitted_at
        
        ORDER BY timestamp DESC
        LIMIT $2
      `

      const result = await query(activityQuery, [req.user.id, limit])
      activities = result.rows
    }

    res.json({
      success: true,
      data: {
        activities: activities.map((activity) => ({
          type: activity.type,
          title: activity.title,
          description: activity.description,
          timestamp: activity.timestamp,
        })),
      },
    })
  } catch (error) {
    logger.error("Get dashboard activity error:", error)
    res.status(500).json({ error: "Failed to fetch recent activity" })
  }
})

// Get chart data
router.get("/charts/:type", authenticateToken, async (req, res) => {
  const { type } = req.params
  const { period = "30d" } = req.query

  try {
    let chartData = []

    const periodMap = {
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
      "1y": "1 year",
    }

    const interval = periodMap[period] || "30 days"

    if (type === "tenders-over-time" && (req.user.role === "admin" || req.user.role === "tender-creator")) {
      const query_text = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM tenders
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        ${req.user.role === "tender-creator" ? `AND creator_id = '${req.user.id}'` : ""}
        GROUP BY DATE(created_at)
        ORDER BY date
      `

      const result = await query(query_text)
      chartData = result.rows.map((row) => ({
        date: row.date,
        count: Number.parseInt(row.count),
      }))
    } else if (type === "bids-over-time" && req.user.role === "vendor") {
      const query_text = `
        SELECT DATE(submitted_at) as date, COUNT(*) as count
        FROM bids
        WHERE vendor_id = $1 AND submitted_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(submitted_at)
        ORDER BY date
      `

      const result = await query(query_text, [req.user.id])
      chartData = result.rows.map((row) => ({
        date: row.date,
        count: Number.parseInt(row.count),
      }))
    } else if (type === "bid-status-distribution" && req.user.role === "vendor") {
      const query_text = `
        SELECT status, COUNT(*) as count
        FROM bids
        WHERE vendor_id = $1
        GROUP BY status
        ORDER BY count DESC
      `

      const result = await query(query_text, [req.user.id])
      chartData = result.rows.map((row) => ({
        status: row.status,
        count: Number.parseInt(row.count),
      }))
    } else if (type === "tender-status-distribution" && req.user.role === "tender-creator") {
      const query_text = `
        SELECT status, COUNT(*) as count
        FROM tenders
        WHERE creator_id = $1
        GROUP BY status
        ORDER BY count DESC
      `

      const result = await query(query_text, [req.user.id])
      chartData = result.rows.map((row) => ({
        status: row.status,
        count: Number.parseInt(row.count),
      }))
    }

    res.json({
      success: true,
      data: { chartData },
    })
  } catch (error) {
    logger.error("Get chart data error:", error)
    res.status(500).json({ error: "Failed to fetch chart data" })
  }
})

module.exports = router
