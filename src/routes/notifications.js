const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', authenticateToken, validate(schemas.pagination), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread_only = false } = req.query;
  const offset = (page - 1) * limit;

  const notifications = await notificationService.getUserNotifications(req.user.id, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    unreadOnly: unread_only === 'true'
  });

  // Get unread count
  const unreadCount = await notificationService.getUnreadCount(req.user.id);

  res.json({
    success: true,
    data: {
      notifications,
      unread_count: unreadCount,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        has_next: notifications.length === parseInt(limit),
        has_prev: page > 1
      }
    }
  });
}));

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await notificationService.markNotificationAsRead(id, req.user.id);

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification }
  });
}));

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', authenticateToken, asyncHandler(async (req, res) => {
  const updatedCount = await notificationService.markAllNotificationsAsRead(req.user.id);

  res.json({
    success: true,
    message: `${updatedCount} notifications marked as read`
  });
}));

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await notificationService.deleteNotification(id, req.user.id);

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);

  res.json({
    success: true,
    data: { count }
  });
}));

module.exports = router;
