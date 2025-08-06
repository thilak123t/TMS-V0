const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Create transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
      } else {
        // Use Ethereal for development
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      logger.error(`Failed to load email template ${templateName}:`, error);
      // Return a basic template if file doesn't exist
      return this.getBasicTemplate(templateName, data);
    }
  }

  getBasicTemplate(templateName, data) {
    const templates = {
      welcome: `
        <h2>Welcome to Tender Management System</h2>
        <p>Hello ${data.name},</p>
        <p>Welcome to our tender management platform. Your account has been created successfully.</p>
        <p>You can now log in and start managing tenders.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `,
      passwordReset: `
        <h2>Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${data.resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `,
      tenderInvitation: `
        <h2>Tender Invitation</h2>
        <p>Hello ${data.vendorName},</p>
        <p>You have been invited to participate in a tender:</p>
        <p><strong>Tender:</strong> ${data.tenderTitle}</p>
        <p><strong>Deadline:</strong> ${data.deadline}</p>
        <p><strong>Description:</strong> ${data.description}</p>
        <p><a href="${data.tenderLink}">View Tender Details</a></p>
        <p>Best regards,<br>Tender Management Team</p>
      `,
      bidSubmitted: `
        <h2>Bid Submitted Successfully</h2>
        <p>Hello ${data.vendorName},</p>
        <p>Your bid has been submitted successfully for:</p>
        <p><strong>Tender:</strong> ${data.tenderTitle}</p>
        <p><strong>Bid Amount:</strong> $${data.bidAmount}</p>
        <p><strong>Submitted At:</strong> ${data.submittedAt}</p>
        <p>You will be notified once the evaluation is complete.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `,
      tenderAwarded: `
        <h2>Congratulations! Tender Awarded</h2>
        <p>Hello ${data.vendorName},</p>
        <p>Congratulations! Your bid has been selected for:</p>
        <p><strong>Tender:</strong> ${data.tenderTitle}</p>
        <p><strong>Winning Bid:</strong> $${data.bidAmount}</p>
        <p>We will contact you soon with further details.</p>
        <p>Best regards,<br>Tender Management Team</p>
      `
    };
    return templates[templateName] || `<p>Email content for ${templateName}</p>`;
  }

  async sendEmail(to, subject, templateName, data) {
    try {
      const html = await this.loadTemplate(templateName, data);
      
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@tendermanagement.com',
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Preview URL: ' + nodemailer.getTestMessageUrl(info));
      }
      
      logger.info(`Email sent successfully to ${to}`);
      return info;
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

  async sendTenderInvitationEmail(vendor, tender) {
    const tenderLink = `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`;
    return this.sendEmail(
      vendor.email,
      `Tender Invitation: ${tender.title}`,
      'tenderInvitation',
      {
        vendorName: vendor.name,
        tenderTitle: tender.title,
        deadline: new Date(tender.deadline).toLocaleDateString(),
        description: tender.description,
        tenderLink
      }
    );
  }

  async sendBidSubmittedEmail(vendor, tender, bid) {
    return this.sendEmail(
      vendor.email,
      `Bid Submitted: ${tender.title}`,
      'bidSubmitted',
      {
        vendorName: vendor.name,
        tenderTitle: tender.title,
        bidAmount: bid.amount,
        submittedAt: new Date(bid.created_at).toLocaleString()
      }
    );
  }

  async sendTenderAwardedEmail(vendor, tender, bid) {
    return this.sendEmail(
      vendor.email,
      `Tender Awarded: ${tender.title}`,
      'tenderAwarded',
      {
        vendorName: vendor.name,
        tenderTitle: tender.title,
        bidAmount: bid.amount
      }
    );
  }

  async sendBulkEmails(emails) {
    const results = [];
    for (const emailData of emails) {
      try {
        const result = await this.sendEmail(
          emailData.to,
          emailData.subject,
          emailData.template,
          emailData.data
        );
        results.push({ success: true, email: emailData.to, result });
      } catch (error) {
        results.push({ success: false, email: emailData.to, error: error.message });
      }
    }
    return results;
  }
}

module.exports = new EmailService();
