const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.templates = this.loadTemplates();
  }

  createTransporter() {
    const config = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    const transporter = nodemailer.createTransport(config);

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('Email transporter is ready to send messages');
      }
    });

    return transporter;
  }

  loadTemplates() {
    return {
      welcome: handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Tender Management System</h2>
          <p>Hello {{firstName}} {{lastName}},</p>
          <p>Welcome to our Tender Management System! Your account has been successfully created.</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Account Details:</h3>
            <p><strong>Email:</strong> {{email}}</p>
            <p><strong>Role:</strong> {{role}}</p>
            <p><strong>Company:</strong> {{companyName}}</p>
          </div>
          <p>You can now log in to your account and start using our platform.</p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>Tender Management System Team</p>
        </div>
      `),

      passwordReset: handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello {{firstName}} {{lastName}},</p>
          <p>You have requested to reset your password for your Tender Management System account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>Tender Management System Team</p>
        </div>
      `),

      tenderInvitation: handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Tender Invitation</h2>
          <p>Hello {{firstName}} {{lastName}},</p>
          <p>You have been invited to submit a bid for the following tender:</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>{{tenderTitle}}</h3>
            <p><strong>Category:</strong> {{tenderCategory}}</p>
            <p><strong>Budget:</strong> $` + `{{tenderBudget}}` + `</p>
            <p><strong>Submission Deadline:</strong> {{submissionDeadline}}</p>
            <p><strong>Description:</strong> {{tenderDescription}}</p>
          </div>
          {{#if message}}
          <div style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #007bff;">
            <p><strong>Message from {{inviterName}}:</strong></p>
            <p>{{message}}</p>
          </div>
          {{/if}}
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{tenderLink}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Tender & Submit Bid</a>
          </div>
          <p>Please log in to your account to view the complete tender details and submit your bid.</p>
          <p>Best regards,<br>Tender Management System Team</p>
        </div>
      `),

      bidSubmitted: handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Bid Submitted Successfully</h2>
          <p>Hello {{firstName}} {{lastName}},</p>
          <p>Your bid has been successfully submitted for the following tender:</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>{{tenderTitle}}</h3>
            <p><strong>Your Bid Amount:</strong> $` + `{{bidAmount}}` + `</p>
            <p><strong>Delivery Time:</strong> {{deliveryTime}} days</p>
            <p><strong>Submitted On:</strong> {{submissionDate}}</p>
          </div>
          <p>Your bid is now under review. You will be notified once the tender creator makes a decision.</p>
          <p>You can track the status of your bid by logging into your account.</p>
          <p>Best regards,<br>Tender Management System Team</p>
        </div>
      `),

      bidAwarded: handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Congratulations! Your Bid Won</h2>
          <p>Hello {{firstName}} {{lastName}},</p>
          <p>Great news! Your bid has been selected for the following tender:</p>
          <div style="background-color: #d4edda; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #c3e6cb;">
            <h3>{{tenderTitle}}</h3>
            <p><strong>Winning Bid Amount:</strong> $` + `{{bidAmount}}` + `</p>
            <p><strong>Delivery Time:</strong> {{deliveryTime}} days</p>
            <p><strong>Award Date:</strong> {{awardDate}}</p>
          </div>
          <p>The tender creator will contact you soon to discuss the next steps and project details.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{projectLink}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Project Details</a>
          </div>
          <p>Congratulations once again on winning this tender!</p>
          <p>Best regards,<br>Tender Management System Team</p>
        </div>
      `),

      bidRejected: handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Bid Update</h2>
          <p>Hello {{firstName}} {{lastName}},</p>
          <p>Thank you for your interest in the following tender:</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>{{tenderTitle}}</h3>
            <p><strong>Your Bid Amount:</strong> $` + `{{bidAmount}}` + `</p>
            <p><strong>Decision Date:</strong> {{decisionDate}}</p>
          </div>
          <p>Unfortunately, your bid was not selected for this project. However, we encourage you to continue participating in future tenders.</p>
          <p>Thank you for your participation, and we look forward to your future bids.</p>
          <p>Best regards,<br>Tender Management System Team</p>
        </div>
      `),

      tenderPublished: handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Tender Published Successfully</h2>
          <p>Hello {{firstName}} {{lastName}},</p>
          <p>Your tender has been successfully published and is now live on our platform:</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>{{tenderTitle}}</h3>
            <p><strong>Category:</strong> {{tenderCategory}}</p>
            <p><strong>Budget:</strong> $` + `{{tenderBudget}}` + `</p>
            <p><strong>Submission Deadline:</strong> {{submissionDeadline}}</p>
            <p><strong>Published On:</strong> {{publishDate}}</p>
          </div>
          <p>Vendors can now view your tender and submit their bids. You will receive notifications as bids are submitted.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{tenderLink}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Tender</a>
          </div>
          <p>Best regards,<br>Tender Management System Team</p>
        </div>
      `)
    };
  }

  async sendEmail(to, subject, template, data) {
    try {
      const html = this.templates[template](data);
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${subject}`);
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
      {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyName: user.companyName || 'N/A'
      }
    );
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail(
      user.email,
      'Password Reset Request',
      'passwordReset',
      {
        firstName: user.firstName,
        lastName: user.lastName,
        resetLink
      }
    );
  }

  async sendTenderInvitationEmail(vendor, tender, inviter, message = '') {
    const tenderLink = `${process.env.FRONTEND_URL}/tenders/${tender.id}`;
    
    return this.sendEmail(
      vendor.email,
      `Tender Invitation: ${tender.title}`,
      'tenderInvitation',
      {
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        tenderTitle: tender.title,
        tenderCategory: tender.category,
        tenderBudget: tender.budget,
        tenderDescription: tender.description,
        submissionDeadline: new Date(tender.submissionDeadline).toLocaleDateString(),
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        message,
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
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        tenderTitle: tender.title,
        bidAmount: bid.amount,
        deliveryTime: bid.deliveryTime,
        submissionDate: new Date(bid.createdAt).toLocaleDateString()
      }
    );
  }

  async sendBidAwardedEmail(vendor, tender, bid) {
    const projectLink = `${process.env.FRONTEND_URL}/projects/${tender.id}`;
    
    return this.sendEmail(
      vendor.email,
      `Congratulations! Your bid won: ${tender.title}`,
      'bidAwarded',
      {
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        tenderTitle: tender.title,
        bidAmount: bid.amount,
        deliveryTime: bid.deliveryTime,
        awardDate: new Date().toLocaleDateString(),
        projectLink
      }
    );
  }

  async sendBidRejectedEmail(vendor, tender, bid) {
    return this.sendEmail(
      vendor.email,
      `Bid Update: ${tender.title}`,
      'bidRejected',
      {
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        tenderTitle: tender.title,
        bidAmount: bid.amount,
        decisionDate: new Date().toLocaleDateString()
      }
    );
  }

  async sendTenderPublishedEmail(creator, tender) {
    const tenderLink = `${process.env.FRONTEND_URL}/tenders/${tender.id}`;
    
    return this.sendEmail(
      creator.email,
      `Tender Published: ${tender.title}`,
      'tenderPublished',
      {
        firstName: creator.firstName,
        lastName: creator.lastName,
        tenderTitle: tender.title,
        tenderCategory: tender.category,
        tenderBudget: tender.budget,
        submissionDeadline: new Date(tender.submissionDeadline).toLocaleDateString(),
        publishDate: new Date().toLocaleDateString(),
        tenderLink
      }
    );
  }
}

module.exports = new EmailService();
