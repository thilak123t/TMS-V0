const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.createTransporter();
    this.loadTemplates();
  }

  createTransporter() {
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    this.transporter = nodemailer.createTransport(config);
  }

  loadTemplates() {
    // Welcome email template
    this.templates.welcome = handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Tender Management System</h2>
        <p>Hello {{firstName}} {{lastName}},</p>
        <p>Welcome to our Tender Management System! Your account has been successfully created.</p>
        <p><strong>Your Role:</strong> {{role}}</p>
        <p>You can now log in to your account and start using our platform.</p>
        <p>Best regards,<br>TMS Team</p>
      </div>
    `);

    // Password reset template
    this.templates.passwordReset = handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello {{firstName}},</p>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="{{resetLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>TMS Team</p>
      </div>
    `);

    // Tender invitation template
    this.templates.tenderInvitation = handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Tender Invitation</h2>
        <p>Hello {{firstName}} {{lastName}},</p>
        <p>You have been invited to submit a bid for the following tender:</p>
        <h3>{{tenderTitle}}</h3>
        <p><strong>Description:</strong> {{tenderDescription}}</p>
        <p><strong>Deadline:</strong> {{deadline}}</p>
        <p><strong>Invited by:</strong> {{inviterName}}</p>
        {{#if message}}
        <p><strong>Message:</strong> {{message}}</p>
        {{/if}}
        <a href="{{tenderLink}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Tender</a>
        <p>Best regards,<br>TMS Team</p>
      </div>
    `);

    // Bid submission confirmation template
    this.templates.bidSubmission = handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bid Submission Confirmation</h2>
        <p>Hello {{firstName}} {{lastName}},</p>
        <p>Your bid has been successfully submitted for the following tender:</p>
        <h3>{{tenderTitle}}</h3>
        <p><strong>Bid Amount:</strong> $` + `{{bidAmount}}` + `</p>
        <p><strong>Submission Date:</strong> {{submissionDate}}</p>
        <p>You will be notified once the tender evaluation is complete.</p>
        <p>Best regards,<br>TMS Team</p>
      </div>
    `);

    // Tender award notification template
    this.templates.tenderAward = handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations! Your Bid Won</h2>
        <p>Hello {{firstName}} {{lastName}},</p>
        <p>We are pleased to inform you that your bid has been selected for the following tender:</p>
        <h3>{{tenderTitle}}</h3>
        <p><strong>Winning Bid Amount:</strong> $` + `{{bidAmount}}` + `</p>
        <p><strong>Award Date:</strong> {{awardDate}}</p>
        <p>The tender creator will contact you soon to discuss the next steps.</p>
        <p>Congratulations and best regards,<br>TMS Team</p>
      </div>
    `);

    // Bid rejection notification template
    this.templates.bidRejection = handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bid Update Notification</h2>
        <p>Hello {{firstName}} {{lastName}},</p>
        <p>Thank you for your interest in the following tender:</p>
        <h3>{{tenderTitle}}</h3>
        <p>Unfortunately, your bid was not selected this time. We encourage you to participate in future tenders.</p>
        <p>Best regards,<br>TMS Team</p>
      </div>
    `);
  }

  async sendEmail(to, subject, template, data) {
    try {
      if (!this.templates[template]) {
        throw new Error(`Template ${template} not found`);
      }

      const html = this.templates[template](data);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@tms.com',
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail(
      user.email,
      'Welcome to Tender Management System',
      'welcome',
      {
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        role: user.role
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
        firstName: user.firstName || user.first_name,
        resetLink
      }
    );
  }

  async sendTenderInvitationEmail(vendor, tender, inviter) {
    const tenderLink = `${process.env.FRONTEND_URL}/vendor/tenders/${tender.id}`;
    
    return this.sendEmail(
      vendor.email,
      'Tender Invitation',
      'tenderInvitation',
      {
        firstName: vendor.firstName || vendor.first_name,
        lastName: vendor.lastName || vendor.last_name,
        tenderTitle: tender.title,
        tenderDescription: tender.description,
        deadline: new Date(tender.deadline).toLocaleDateString(),
        inviterName: `${inviter.firstName || inviter.first_name} ${inviter.lastName || inviter.last_name}`,
        message: tender.invitationMessage,
        tenderLink
      }
    );
  }

  async sendBidSubmissionEmail(vendor, tender, bid) {
    return this.sendEmail(
      vendor.email,
      'Bid Submission Confirmation',
      'bidSubmission',
      {
        firstName: vendor.firstName || vendor.first_name,
        lastName: vendor.lastName || vendor.last_name,
        tenderTitle: tender.title,
        bidAmount: bid.amount,
        submissionDate: new Date(bid.created_at).toLocaleDateString()
      }
    );
  }

  async sendTenderAwardEmail(vendor, tender, bid) {
    return this.sendEmail(
      vendor.email,
      'Congratulations! Your Bid Won',
      'tenderAward',
      {
        firstName: vendor.firstName || vendor.first_name,
        lastName: vendor.lastName || vendor.last_name,
        tenderTitle: tender.title,
        bidAmount: bid.amount,
        awardDate: new Date().toLocaleDateString()
      }
    );
  }

  async sendBidRejectionEmail(vendor, tender) {
    return this.sendEmail(
      vendor.email,
      'Bid Update Notification',
      'bidRejection',
      {
        firstName: vendor.firstName || vendor.first_name,
        lastName: vendor.lastName || vendor.last_name,
        tenderTitle: tender.title
      }
    );
  }
}

module.exports = new EmailService();
