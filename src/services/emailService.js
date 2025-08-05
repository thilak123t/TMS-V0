const nodemailer = require("nodemailer")
const fs = require("fs")
const path = require("path")
const handlebars = require("handlebars")
const logger = require("../utils/logger")

// Create reusable transporter object using SMTP transport
let transporter

// Initialize the email transporter
const initTransporter = () => {
  if (transporter) return

  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  }

  // Create the transporter
  transporter = nodemailer.createTransport(smtpConfig)

  // Verify connection configuration
  transporter.verify((error) => {
    if (error) {
      logger.error("SMTP connection error:", error)
    } else {
      logger.info("SMTP server is ready to send emails")
    }
  })
}

// Load email template and compile with Handlebars
const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`)
    const template = fs.readFileSync(templatePath, "utf8")
    return handlebars.compile(template)
  } catch (error) {
    logger.error(`Error loading email template ${templateName}:`, error)
    throw error
  }
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.context - Template context
 * @returns {Promise} - Nodemailer info object
 */
const sendEmail = async ({ to, subject, template, context }) => {
  try {
    // Initialize transporter if not already done
    initTransporter()

    // Load and compile template
    const compiledTemplate = loadTemplate(template)
    const html = compiledTemplate(context)

    // Setup email data
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    }

    // Send mail
    const info = await transporter.sendMail(mailOptions)
    logger.info(`Email sent: ${info.messageId}`)

    // Log preview URL in development
    if (process.env.NODE_ENV === "development") {
      logger.info(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }

    return info
  } catch (error) {
    logger.error("Error sending email:", error)
    throw error
  }
}

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @returns {Promise} - Nodemailer info object
 */
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: "Welcome to Tender Management System",
    template: "welcome",
    context: {
      name: `${user.first_name} ${user.last_name}`,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      role: user.role,
    },
  })
}

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} token - Reset token
 * @returns {Promise} - Nodemailer info object
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

  return sendEmail({
    to: user.email,
    subject: "Password Reset Request",
    template: "password-reset",
    context: {
      name: `${user.first_name} ${user.last_name}`,
      resetUrl,
      expiryTime: "1 hour",
    },
  })
}

/**
 * Send tender invitation email
 * @param {Object} invitation - Invitation object
 * @param {Object} tender - Tender object
 * @param {Object} vendor - Vendor user object
 * @returns {Promise} - Nodemailer info object
 */
const sendTenderInvitationEmail = async (invitation, tender, vendor) => {
  const invitationUrl = `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`

  return sendEmail({
    to: vendor.email,
    subject: `Invitation to Tender: ${tender.title}`,
    template: "tender-invitation",
    context: {
      vendorName: `${vendor.first_name} ${vendor.last_name}`,
      companyName: vendor.company_name,
      tenderTitle: tender.title,
      tenderReference: tender.reference_number,
      invitationUrl,
      submissionDeadline: new Date(tender.submission_deadline).toLocaleDateString(),
      message: invitation.message || "You have been invited to submit a bid for this tender.",
    },
  })
}

/**
 * Send bid submission confirmation email
 * @param {Object} bid - Bid object
 * @param {Object} tender - Tender object
 * @param {Object} vendor - Vendor user object
 * @returns {Promise} - Nodemailer info object
 */
const sendBidSubmissionEmail = async (bid, tender, vendor) => {
  return sendEmail({
    to: vendor.email,
    subject: `Bid Submission Confirmation: ${tender.title}`,
    template: "bid-submission",
    context: {
      vendorName: `${vendor.first_name} ${vendor.last_name}`,
      companyName: vendor.company_name,
      tenderTitle: tender.title,
      tenderReference: tender.reference_number,
      bidAmount: bid.amount,
      bidId: bid.id,
      submissionDate: new Date(bid.created_at).toLocaleDateString(),
      bidUrl: `${process.env.FRONTEND_URL}/vendor/bids/${bid.id}`,
    },
  })
}

/**
 * Send tender award notification email
 * @param {Object} tender - Tender object
 * @param {Object} bid - Winning bid object
 * @param {Object} vendor - Vendor user object
 * @returns {Promise} - Nodemailer info object
 */
const sendTenderAwardEmail = async (tender, bid, vendor) => {
  return sendEmail({
    to: vendor.email,
    subject: `Tender Award Notification: ${tender.title}`,
    template: "tender-award",
    context: {
      vendorName: `${vendor.first_name} ${vendor.last_name}`,
      companyName: vendor.company_name,
      tenderTitle: tender.title,
      tenderReference: tender.reference_number,
      bidAmount: bid.amount,
      awardDate: new Date().toLocaleDateString(),
      tenderUrl: `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`,
      message: tender.award_message || "Congratulations! Your bid has been selected.",
    },
  })
}

/**
 * Send tender rejection notification email
 * @param {Object} tender - Tender object
 * @param {Object} bid - Rejected bid object
 * @param {Object} vendor - Vendor user object
 * @returns {Promise} - Nodemailer info object
 */
const sendBidRejectionEmail = async (tender, bid, vendor) => {
  return sendEmail({
    to: vendor.email,
    subject: `Bid Status Update: ${tender.title}`,
    template: "bid-rejection",
    context: {
      vendorName: `${vendor.first_name} ${vendor.last_name}`,
      companyName: vendor.company_name,
      tenderTitle: tender.title,
      tenderReference: tender.reference_number,
      bidAmount: bid.amount,
      rejectionDate: new Date().toLocaleDateString(),
      tenderUrl: `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`,
      message: bid.rejection_reason || "Thank you for your submission. Unfortunately, your bid was not selected.",
    },
  })
}

/**
 * Send tender deadline reminder email
 * @param {Object} tender - Tender object
 * @param {Object} vendor - Vendor user object
 * @returns {Promise} - Nodemailer info object
 */
const sendTenderDeadlineReminderEmail = async (tender, vendor) => {
  const daysRemaining = Math.ceil((new Date(tender.submission_deadline) - new Date()) / (1000 * 60 * 60 * 24))

  return sendEmail({
    to: vendor.email,
    subject: `Reminder: Tender Submission Deadline Approaching - ${tender.title}`,
    template: "deadline-reminder",
    context: {
      vendorName: `${vendor.first_name} ${vendor.last_name}`,
      companyName: vendor.company_name,
      tenderTitle: tender.title,
      tenderReference: tender.reference_number,
      daysRemaining,
      submissionDeadline: new Date(tender.submission_deadline).toLocaleDateString(),
      tenderUrl: `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`,
    },
  })
}

/**
 * Send bulk notifications
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise} - Array of results
 */
const sendBulkNotifications = async (notifications) => {
  try {
    // Initialize transporter if not already done
    initTransporter()

    const promises = notifications.map(async (notification) => {
      try {
        // Load and compile template
        const compiledTemplate = loadTemplate(notification.template || "notification")
        const html = compiledTemplate(notification.context || {})

        // Setup email data
        const mailOptions = {
          from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
          to: notification.to,
          subject: notification.subject,
          html,
        }

        // Send mail
        return await transporter.sendMail(mailOptions)
      } catch (error) {
        logger.error(`Error sending notification to ${notification.to}:`, error)
        return { error, to: notification.to }
      }
    })

    return Promise.all(promises)
  } catch (error) {
    logger.error("Error sending bulk notifications:", error)
    throw error
  }
}

/**
 * Send system notification email
 * @param {Object} options - Email options
 * @returns {Promise} - Nodemailer info object
 */
const sendSystemNotificationEmail = async (options) => {
  return sendEmail({
    to: options.to,
    subject: options.subject,
    template: "system-notification",
    context: {
      name: options.name,
      message: options.message,
      actionUrl: options.actionUrl,
      actionText: options.actionText || "View Details",
    },
  })
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTenderInvitationEmail,
  sendBidSubmissionEmail,
  sendTenderAwardEmail,
  sendBidRejectionEmail,
  sendTenderDeadlineReminderEmail,
  sendBulkNotifications,
  sendSystemNotificationEmail,
}
