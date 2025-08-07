const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection on startup
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.warn('Email service connection failed:', error.message);
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@tms.com',
        to: user.email,
        subject: 'Welcome to Tender Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome ${user.first_name}!</h1>
            <p>Thank you for joining our Tender Management System.</p>
            <p>Your account has been created successfully with the role: <strong>${user.role}</strong></p>
            <p>You can now log in and start using the platform.</p>
            <br>
            <p>Best regards,<br>TMS Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending welcome email:', error);
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@tms.com',
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>Hello ${user.first_name},</p>
            <p>You requested a password reset for your account.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>TMS Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending password reset email:', error);
    }
  }

  // Send bid submission email
  async sendBidSubmissionEmail(bid, tender, vendor) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@tms.com',
        to: tender.creator_email,
        subject: `New Bid Submitted for "${tender.title}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Bid Submitted</h1>
            <p>A new bid has been submitted for your tender:</p>
            <h2>${tender.title}</h2>
            <p><strong>Vendor:</strong> ${vendor.company_name || vendor.first_name + ' ' + vendor.last_name}</p>
            <p><strong>Bid Amount:</strong> ${bid.currency || 'USD'} ${bid.amount}</p>
            <p><strong>Submitted:</strong> ${new Date(bid.created_at).toLocaleDateString()}</p>
            <p>You can review this bid in your dashboard.</p>
            <br>
            <p>Best regards,<br>TMS Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Bid submission email sent for tender ${tender.id}`);
    } catch (error) {
      logger.error('Error sending bid submission email:', error);
    }
  }

  // Send tender award email
  async sendTenderAwardEmail(bid, winner, otherVendors) {
    try {
      // Send email to winner
      const winnerMailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@tms.com',
        to: winner.email,
        subject: `Congratulations! Your bid has been accepted`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #28a745;">Congratulations!</h1>
            <p>Hello ${winner.first_name},</p>
            <p>We're pleased to inform you that your bid has been accepted for the tender:</p>
            <h2>${bid.title}</h2>
            <p><strong>Your Bid Amount:</strong> ${bid.currency || 'USD'} ${bid.amount}</p>
            <p>We will contact you soon with further details.</p>
            <br>
            <p>Best regards,<br>TMS Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(winnerMailOptions);

      // Send emails to other vendors
      for (const vendor of otherVendors) {
        const otherVendorMailOptions = {
          from: process.env.FROM_EMAIL || 'noreply@tms.com',
          to: vendor.email,
          subject: `Tender Award Notification`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Tender Award Notification</h1>
              <p>Hello ${vendor.first_name},</p>
              <p>Thank you for your interest and bid submission for:</p>
              <h2>${bid.title}</h2>
              <p>After careful consideration, we have selected another vendor for this project.</p>
              <p>We appreciate your participation and encourage you to bid on future opportunities.</p>
              <br>
              <p>Best regards,<br>TMS Team</p>
            </div>
          `
        };

        await this.transporter.sendMail(otherVendorMailOptions);
      }

      logger.info(`Tender award emails sent for tender ${bid.tender_id}`);
    } catch (error) {
      logger.error('Error sending tender award emails:', error);
    }
  }

  // Send tender invitation email
  async sendTenderInvitationEmail(vendor, tender, inviter) {
    try {
      const tenderUrl = `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@tms.com',
        to: vendor.email,
        subject: `Invitation to Bid: ${tender.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Tender Invitation</h1>
            <p>Hello ${vendor.first_name},</p>
            <p>You have been invited to submit a bid for the following tender:</p>
            <h2>${tender.title}</h2>
            <p><strong>Category:</strong> ${tender.category}</p>
            <p><strong>Budget:</strong> ${tender.currency || 'USD'} ${tender.budget}</p>
            <p><strong>Deadline:</strong> ${new Date(tender.deadline).toLocaleDateString()}</p>
            <p><strong>Invited by:</strong> ${inviter.first_name} ${inviter.last_name}</p>
            <br>
            <p>Click the link below to view the tender details and submit your bid:</p>
            <a href="${tenderUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Tender</a>
            <br><br>
            <p>Best regards,<br>TMS Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Tender invitation email sent to ${vendor.email}`);
    } catch (error) {
      logger.error('Error sending tender invitation email:', error);
    }
  }
}

module.exports = new EmailService();
