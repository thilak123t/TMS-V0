const jwt = require("jsonwebtoken")
const { query } = require("../config/database")
const logger = require("../utils/logger")

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.error(`Token verification failed: ${err.message}`)
        return res.status(401).json({
          success: false,
          message: "Invalid token.",
        })
      }

      // Add user info to request
      req.user = decoded
      next()
    })
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    })
  }
}

/**
 * Middleware to check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    })
  }
}

/**
 * Middleware to check if user is tender creator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isTenderCreator = (req, res, next) => {
  if (req.user && (req.user.role === "tender_creator" || req.user.role === "admin")) {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Tender creator role required.",
    })
  }
}

/**
 * Middleware to check if user is vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isVendor = (req, res, next) => {
  if (req.user && req.user.role === "vendor") {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Vendor role required.",
    })
  }
}

/**
 * Middleware to check if user owns a resource
 * @param {string} resourceType - Type of resource (tender, bid, etc.)
 * @returns {Function} - Express middleware
 */
const isResourceOwner = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id
      const userId = req.user.id

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: "Resource ID is required.",
        })
      }

      let queryText

      switch (resourceType) {
        case "tender":
          queryText = "SELECT * FROM tenders WHERE id = $1 AND creator_id = $2"
          break
        case "bid":
          queryText = "SELECT * FROM bids WHERE id = $1 AND vendor_id = $2"
          break
        case "comment":
          queryText = "SELECT * FROM comments WHERE id = $1 AND user_id = $2"
          break
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid resource type.",
          })
      }

      const result = await query(queryText, [resourceId, userId])

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You do not own this resource.",
        })
      }

      next()
    } catch (error) {
      logger.error(`Resource owner check error: ${error.message}`)
      return res.status(500).json({
        success: false,
        message: "Server error while checking resource ownership.",
      })
    }
  }
}

/**
 * Middleware to check if user is active
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isActiveUser = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await query("SELECT status FROM users WHERE id = $1", [userId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      })
    }

    if (result.rows[0].status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active. Please contact an administrator.",
      })
    }

    next()
  } catch (error) {
    logger.error(`Active user check error: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Server error while checking user status.",
    })
  }
}

module.exports = {
  verifyToken,
  isAdmin,
  isTenderCreator,
  isVendor,
  isResourceOwner,
  isActiveUser,
}
