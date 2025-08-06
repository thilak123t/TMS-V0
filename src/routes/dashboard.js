const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// @desc    Get admin dashboard data
// @route   GET /api/dashboard/admin
// @access  Private/Admin
router.get('/admin', authenticateToken, authorizeRoles('admin'), asyncHandler(async (req, res) => {
  try {
    // Get total counts
    const [usersResult, tendersResult, bidsResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM tenders'),
      query('SELECT COUNT(*) as total FROM bids')
    ]);

    // Get user counts by role
    const usersByRoleResult = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY role
    `);

    // Get tender counts by status
    const tendersByStatusResult = await query(`
      SELECT status, COUNT(*) as count
      FROM tenders
      GROUP BY status
    `);

    // Get recent activity (last 30 days)
    const recentActivityResult = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM tenders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // Get top performing tenders (by bid count)
    const topTendersResult = await query(`
      SELECT 
        t.id,
        t.title,
        t.created_at,
        COUNT(b.id) as bid_count,
        t.status
      FROM tenders t
      LEFT JOIN bids b ON t.id = b.tender_id
      GROUP BY t.id, t.title, t.created_at, t.status
      ORDER BY bid_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        totals: {
          users: parseInt(usersResult.rows[0].total),
          tenders: parseInt(tendersResult.rows[0].total),
          bids: parseInt(bidsResult.rows[0].total)
        },
        usersByRole: usersByRoleResult.rows.map(row => ({
          role: row.role,
          count: parseInt(row.count)
        })),
        tendersByStatus: tendersByStatusResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        recentActivity: recentActivityResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        topTenders: topTendersResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          createdAt: row.created_at,
          bidCount: parseInt(row.bid_count),
          status: row.status
        }))
      }
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
}));

// @desc    Get tender creator dashboard data
// @route   GET /api/dashboard/tender-creator
// @access  Private/TenderCreator
router.get('/tender-creator', authenticateToken, authorizeRoles('tender-creator'), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's tender counts
    const tenderCountsResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tenders
      WHERE created_by = $1
      GROUP BY status
    `, [userId]);

    // Get total bids on user's tenders
    const totalBidsResult = await query(`
      SELECT COUNT(b.id) as total
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      WHERE t.created_by = $1
    `, [userId]);

    // Get recent tenders
    const recentTendersResult = await query(`
      SELECT 
        t.*,
        COUNT(b.id) as bid_count
      FROM tenders t
      LEFT JOIN bids b ON t.id = b.tender_id
      WHERE t.created_by = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `, [userId]);

    // Get bid activity (last 30 days)
    const bidActivityResult = await query(`
      SELECT 
        DATE(b.created_at) as date,
        COUNT(b.id) as count
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      WHERE t.created_by = $1 AND b.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(b.created_at)
      ORDER BY date DESC
    `, [userId]);

    res.json({
      success: true,
      data: {
        tenderCounts: tenderCountsResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        totalBids: parseInt(totalBidsResult.rows[0]?.total || 0),
        recentTenders: recentTendersResult.rows,
        bidActivity: bidActivityResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        }))
      }
    });
  } catch (error) {
    logger.error('Tender creator dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
}));

// @desc    Get vendor dashboard data
// @route   GET /api/dashboard/vendor
// @access  Private/Vendor
router.get('/vendor', authenticateToken, authorizeRoles('vendor'), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get bid counts by status
    const bidCountsResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM bids
      WHERE vendor_id = $1
      GROUP BY status
    `, [userId]);

    // Get available tenders count
    const availableTendersResult = await query(`
      SELECT COUNT(*) as total
      FROM tenders t
      LEFT JOIN bids b ON t.id = b.tender_id AND b.vendor_id = $1
      WHERE t.status = 'published' 
      AND t.submission_deadline > NOW()
      AND b.id IS NULL
    `, [userId]);

    // Get recent bids
    const recentBidsResult = await query(`
      SELECT 
        b.*,
        t.title as tender_title,
        t.status as tender_status
      FROM bids b
      JOIN tenders t ON b.tender_id = t.id
      WHERE b.vendor_id = $1
      ORDER BY b.created_at DESC
      LIMIT 5
    `, [userId]);

    // Get win rate
    const winRateResult = await query(`
      SELECT 
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as won,
        COUNT(CASE WHEN status IN ('accepted', 'rejected') THEN 1 END) as total
      FROM bids
      WHERE vendor_id = $1
    `, [userId]);

    const winRate = winRateResult.rows[0].total > 0 
      ? (parseInt(winRateResult.rows[0].won) / parseInt(winRateResult.rows[0].total)) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        bidCounts: bidCountsResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        availableTenders: parseInt(availableTendersResult.rows[0].total),
        recentBids: recentBidsResult.rows,
        winRate: Math.round(winRate * 100) / 100
      }
    });
  } catch (error) {
    logger.error('Vendor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
}));

module.exports = router;
