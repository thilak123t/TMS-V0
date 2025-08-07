const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.templates = {};
    this.loadTemplates();
  }

  createTransporter() {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };

    const transporter = nodemailer.createTransport(config);

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        logger.error('Email service configuration error:', error);
      } else {
        logger.info('Email service is ready to send messages');
      }
    });

    return transporter;
  }

  loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Default templates
    this.templates = {
      welcome: handlebars.compile(`
        <h1>Welcome to Tender Management System</h1>
        <p>Hello {{name}},</p>
        <p>Welcome to our tender management platform. Your account has been created successfully.</p>
        <p>You can now log in and start managing tenders.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `),
      passwordReset: handlebars.compile(`
        <h1>Password Reset Request</h1>
        <p>Hello {{name}},</p>
        <p>You have requested to reset your password. Click the link below to reset it:</p>
        <p><a href="{{resetLink}}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `),
      tenderInvitation: handlebars.compile(`
        <h1>Tender Invitation</h1>
        <p>Hello {{vendorName}},</p>
        <p>You have been invited to participate in a tender:</p>
        <h2>{{tenderTitle}}</h2>
        <p><strong>Description:</strong> {{tenderDescription}}</p>
        <p><strong>Deadline:</strong> {{deadline}}</p>
        <p><a href="{{tenderLink}}">View Tender Details</a></p>
        <p>Best regards,<br>Tender Management Team</p>
      `),
      bidSubmitted: handlebars.compile(`
        <h1>Bid Submitted Successfully</h1>
        <p>Hello {{vendorName}},</p>
        <p>Your bid for the tender "{{tenderTitle}}" has been submitted successfully.</p>
        <p><strong>Bid Amount:</strong> ${{bidAmount}}</p>
        <p><strong>Submitted At:</strong> {{submittedAt}}</p>
        <p>You will be notified once the tender evaluation is complete.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `),
      tenderAwarded: handlebars.compile(`
        <h1>Congratulations! Tender Awarded</h1>
        <p>Hello {{vendorName}},</p>
        <p>Congratulations! Your bid for the tender "{{tenderTitle}}" has been selected.</p>
        <p><strong>Winning Bid Amount:</strong> ${{bidAmount}}</p>
        <p>Our team will contact you soon with further details.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `)
    };
  }

  async sendEmail(to, subject, template, data) {
    try {
      const html = this.templates[template](data);
      
      const mailOptions = {
        from: `"Tender Management System" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail(
      user.email,
      'Welcome to Tender Management System',
      'welcome',
      { name: user.name }
    );
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    return this.sendEmail(
      user.email,
      'Password Reset Request',
      'passwordReset',
      { name: user.name, resetLink }
    );
  }

  async sendTenderInvitationEmail(vendor, tender, inviter) {
    const tenderLink = `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`;
    return this.sendEmail(
      vendor.email,
      `Tender Invitation: ${tender.title}`,
      'tenderInvitation',
      {
        vendorName: `${vendor.first_name} ${vendor.last_name}`,
        tenderTitle: tender.title,
        tenderDescription: tender.description,
        deadline: new Date(tender.submission_deadline).toLocaleDateString(),
        tenderLink
      }
    );
  }

  async sendBidSubmissionEmail(bid, tender, vendor) {
    return this.sendEmail(
      vendor.email,
      `Bid Submitted: ${tender.title}`,
      'bidSubmitted',
      {
        vendorName: `${vendor.first_name} ${vendor.last_name}`,
        tenderTitle: tender.title,
        bidAmount: bid.amount,
        submittedAt: new Date(bid.created_at).toLocaleString()
      }
    );
  }

  async sendTenderAwardEmail(bid, winner, otherVendors) {
    // Send congratulations email to winner
    await this.sendEmail(
      winner.email,
      `Tender Awarded: ${bid.title}`,
      'tenderAwarded',
      {
        vendorName: `${winner.first_name} ${winner.last_name}`,
        tenderTitle: bid.title,
        bidAmount: bid.amount
      }
    );

    // Send notification emails to other vendors
    for (const vendor of otherVendors) {
      await this.sendEmail(
        vendor.email,
        `Tender Update: ${bid.title}`,
        'bidRejected',
        {
          vendorName: `${vendor.first_name} ${vendor.last_name}`,
          tenderTitle: bid.title
        }
      );
    }
  }
}

module.exports = new EmailService();
