const { query } = require('../config/database');
const logger = require('../utils/logger');

class NotificationService {
  // Create a single notification
  async createNotification({ user_id, type, title, message, reference_id, reference_type }) {
    try {
      const result = await query(
        `INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW())
         RETURNING *`,
        [user_id, type, title, message, reference_id]
      );

      logger.info(`Notification created for user ${user_id}: ${title}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create bulk notifications
  async createBulkNotifications(notifications) {
    try {
      const values = [];
      const placeholders = [];
      
      notifications.forEach((notification, index) => {
        const baseIndex = index * 5;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, false, NOW())`);
        values.push(
          notification.user_id,
          notification.type,
          notification.title,
          notification.message,
          notification.reference_id || null
        );
      });

      const queryText = `
        INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const result = await query(queryText, values);
      
      logger.info(`${notifications.length} bulk notifications created`);
      return result.rows;
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
    try {
      let queryText = `
        SELECT * FROM notifications
        WHERE user_id = $1
      `;
      
      const params = [userId];
      
      if (unreadOnly) {
        queryText += ` AND is_read = false`;
      }
      
      queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(queryText, params);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      const result = await query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllNotificationsAsRead(userId) {
    try {
      const result = await query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      logger.info(`Marked ${result.rowCount} notifications as read for user ${userId}`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const result = await query(
        `DELETE FROM notifications 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
