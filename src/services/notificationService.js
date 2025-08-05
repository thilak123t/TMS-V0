const db = require("../config/database")
const logger = require("../utils/logger")

/**
 * Create a notification
 * @param {Object} notification - Notification object
 * @param {string} notification.user_id - User ID
 * @param {string} notification.type - Notification type
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.reference_id - Reference ID (optional)
 * @param {string} notification.reference_type - Reference type (optional)
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async (notification) => {
  try {
    const { user_id, type, title, message, reference_id, reference_type } = notification

    const { rows } = await db.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, reference_id, reference_type, read)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [user_id, type, title, message, reference_id, reference_type],
    )

    logger.info(`Notification created for user ${user_id}: ${type}`)
    return rows[0]
  } catch (error) {
    logger.error("Error creating notification:", error)
    throw error
  }
}

/**
 * Create multiple notifications at once
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<Array>} - Created notifications
 */
const createBulkNotifications = async (notifications) => {
  try {
    // Use a transaction to ensure all notifications are created or none
    return await db.transaction(async (client) => {
      const createdNotifications = []

      for (const notification of notifications) {
        const { user_id, type, title, message, reference_id, reference_type } = notification

        const { rows } = await client.query(
          `INSERT INTO notifications 
           (user_id, type, title, message, reference_id, reference_type, read)
           VALUES ($1, $2, $3, $4, $5, $6, false)
           RETURNING *`,
          [user_id, type, title, message, reference_id, reference_type],
        )

        createdNotifications.push(rows[0])
      }

      logger.info(`Bulk created ${createdNotifications.length} notifications`)
      return createdNotifications
    })
  } catch (error) {
    logger.error("Error creating bulk notifications:", error)
    throw error
  }
}

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset results
 * @param {boolean} options.unreadOnly - Get only unread notifications
 * @returns {Promise<Array>} - Notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0, unreadOnly = false } = options

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `

    const params = [userId]

    if (unreadOnly) {
      query += ` AND read = false`
    }

    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`

    const { rows } = await db.query(query, [...params, limit, offset])
    return rows
  } catch (error) {
    logger.error("Error getting user notifications:", error)
    throw error
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Updated notification
 */
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const { rows } = await db.query(
      `UPDATE notifications
       SET read = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId],
    )

    if (rows.length === 0) {
      throw new Error("Notification not found or unauthorized")
    }

    return rows[0]
  } catch (error) {
    logger.error("Error marking notification as read:", error)
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of updated notifications
 */
const markAllNotificationsAsRead = async (userId) => {
  try {
    const { rowCount } = await db.query(
      `UPDATE notifications
       SET read = true, updated_at = NOW()
       WHERE user_id = $1 AND read = false`,
      [userId],
    )

    logger.info(`Marked ${rowCount} notifications as read for user ${userId}`)
    return rowCount
  } catch (error) {
    logger.error("Error marking all notifications as read:", error)
    throw error
  }
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} - Success status
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId],
    )

    if (rowCount === 0) {
      throw new Error("Notification not found or unauthorized")
    }

    return true
  } catch (error) {
    logger.error("Error deleting notification:", error)
    throw error
  }
}

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread notification count
 */
const getUnreadCount = async (userId) => {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND read = false`,
      [userId],
    )

    return Number.parseInt(rows[0].count)
  } catch (error) {
    logger.error("Error getting unread notification count:", error)
    throw error
  }
}

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
}
