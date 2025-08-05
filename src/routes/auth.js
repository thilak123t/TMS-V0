const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { query, transaction } = require("../config/database")
const { validate, userSchemas } = require("../middleware/validation")
const { authenticateToken } = require("../middleware/auth")
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../services/emailService")
const logger = require("../utils/logger")

const router = express.Router()

// Register new user
router.post("/register", validate(userSchemas.register), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, companyName, phone } = req.body

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await query(
      `INSERT INTO users (firstName, lastName, email, password, role, companyName, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, firstName, lastName, email, role, companyName, phone, createdAt`,
      [firstName, lastName, email, hashedPassword, role, companyName, phone],
    )

    const user = result.rows[0]

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    })

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user).catch((err) => logger.error("Failed to send welcome email:", err))

    logger.info(`New user registered: ${user.email} (${user.role})`)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          role: user.role,
          companyName: user.companyname,
          phone: user.phone,
        },
        token,
      },
    })
  } catch (error) {
    logger.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: "Registration failed",
    })
  }
})

// Login user
router.post("/login", validate(userSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body

    // Get user from database
    const result = await query(
      "SELECT id, firstName, lastName, email, password, role, companyName, phone, isActive FROM users WHERE email = $1",
      [email],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    const user = result.rows[0]

    // Check if account is active
    if (!user.isactive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Update last login
    await query("UPDATE users SET lastLogin = NOW() WHERE id = $1", [user.id])

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    })

    logger.info(`User logged in: ${user.email}`)

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          role: user.role,
          companyName: user.companyname,
          phone: user.phone,
        },
        token,
      },
    })
  } catch (error) {
    logger.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Login failed",
    })
  }
})

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, firstName, lastName, email, role, companyName, phone, createdAt, lastLogin FROM users WHERE id = $1",
      [req.user.id],
    )

    const user = result.rows[0]

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          role: user.role,
          companyName: user.companyname,
          phone: user.phone,
          createdAt: user.createdat,
          lastLogin: user.lastlogin,
        },
      },
    })
  } catch (error) {
    logger.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    })
  }
})

// Update user profile
router.put("/profile", authenticateToken, validate(userSchemas.updateProfile), async (req, res) => {
  try {
    const { firstName, lastName, companyName, phone } = req.body
    const userId = req.user.id

    const result = await query(
      `UPDATE users 
       SET firstName = COALESCE($1, firstName),
           lastName = COALESCE($2, lastName),
           companyName = COALESCE($3, companyName),
           phone = COALESCE($4, phone),
           updatedAt = NOW()
       WHERE id = $5
       RETURNING id, firstName, lastName, email, role, companyName, phone`,
      [firstName, lastName, companyName, phone, userId],
    )

    const user = result.rows[0]

    logger.info(`User profile updated: ${user.email}`)

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user.id,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          role: user.role,
          companyName: user.companyname,
          phone: user.phone,
        },
      },
    })
  } catch (error) {
    logger.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    })
  }
})

// Change password
router.put("/change-password", authenticateToken, validate(userSchemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // Get current password hash
    const result = await query("SELECT password FROM users WHERE id = $1", [userId])
    const user = result.rows[0]

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await query("UPDATE users SET password = $1, updatedAt = NOW() WHERE id = $2", [hashedPassword, userId])

    logger.info(`Password changed for user: ${req.user.email}`)

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    logger.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    })
  }
})

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }

    // Check if user exists
    const result = await query("SELECT id, firstName, lastName, email FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent",
      })
    }

    const user = result.rows[0]

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Save reset token
    await query("UPDATE users SET resetToken = $1, resetTokenExpiry = $2 WHERE id = $3", [
      resetToken,
      resetTokenExpiry,
      user.id,
    ])

    // Send reset email
    await sendPasswordResetEmail(user, resetToken)

    logger.info(`Password reset requested for: ${email}`)

    res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent",
    })
  } catch (error) {
    logger.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    })
  }
})

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      })
    }

    // Find user with valid reset token
    const result = await query("SELECT id, email FROM users WHERE resetToken = $1 AND resetTokenExpiry > NOW()", [
      token,
    ])

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    const user = result.rows[0]

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password and clear reset token
    await query(
      "UPDATE users SET password = $1, resetToken = NULL, resetTokenExpiry = NULL, updatedAt = NOW() WHERE id = $2",
      [hashedPassword, user.id],
    )

    logger.info(`Password reset completed for: ${user.email}`)

    res.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    logger.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    })
  }
})

// Logout (client-side token removal, but we can log it)
router.post("/logout", authenticateToken, (req, res) => {
  logger.info(`User logged out: ${req.user.email}`)

  res.json({
    success: true,
    message: "Logged out successfully",
  })
})

module.exports = router
