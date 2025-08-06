const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Validation error:', { error: errorMessage, property, data: req[property] });
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // User registration
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('admin', 'tender_creator', 'vendor').required(),
    company_name: Joi.string().max(100).when('role', {
      is: 'vendor',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-$$$$]{7,15}$/).optional(),
    address: Joi.string().max(255).optional()
  }),

  // User login
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Password reset request
  passwordResetRequest: Joi.object({
    email: Joi.string().email().required()
  }),

  // Password reset
  passwordReset: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  }),

  // Tender creation
  tenderCreation: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    requirements: Joi.string().max(2000).optional(),
    budget_min: Joi.number().positive().optional(),
    budget_max: Joi.number().positive().optional(),
    submission_deadline: Joi.date().greater('now').required(),
    evaluation_deadline: Joi.date().greater(Joi.ref('submission_deadline')).optional(),
    category: Joi.string().max(100).optional(),
    location: Joi.string().max(255).optional(),
    contact_person: Joi.string().max(100).optional(),
    contact_email: Joi.string().email().optional(),
    contact_phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-$$$$]{7,15}$/).optional(),
    is_public: Joi.boolean().default(true),
    documents: Joi.array().items(Joi.string()).optional()
  }),

  // Tender update
  tenderUpdate: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    requirements: Joi.string().max(2000).optional(),
    budget_min: Joi.number().positive().optional(),
    budget_max: Joi.number().positive().optional(),
    submission_deadline: Joi.date().greater('now').optional(),
    evaluation_deadline: Joi.date().optional(),
    category: Joi.string().max(100).optional(),
    location: Joi.string().max(255).optional(),
    contact_person: Joi.string().max(100).optional(),
    contact_email: Joi.string().email().optional(),
    contact_phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-$$$$]{7,15}$/).optional(),
    is_public: Joi.boolean().optional(),
    status: Joi.string().valid('draft', 'published', 'closed', 'awarded', 'cancelled').optional()
  }),

  // Bid submission
  bidSubmission: Joi.object({
    tender_id: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    proposal: Joi.string().min(10).max(2000).required(),
    delivery_timeline: Joi.string().max(500).optional(),
    technical_specifications: Joi.string().max(2000).optional(),
    documents: Joi.array().items(Joi.string()).optional(),
    validity_period: Joi.number().integer().positive().default(30) // days
  }),

  // Bid update
  bidUpdate: Joi.object({
    amount: Joi.number().positive().optional(),
    proposal: Joi.string().min(10).max(2000).optional(),
    delivery_timeline: Joi.string().max(500).optional(),
    technical_specifications: Joi.string().max(2000).optional(),
    validity_period: Joi.number().integer().positive().optional()
  }),

  // Comment creation
  commentCreation: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    parent_id: Joi.number().integer().positive().optional()
  }),

  // Vendor invitation
  vendorInvitation: Joi.object({
    vendor_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    message: Joi.string().max(500).optional()
  }),

  // Profile update
  profileUpdate: Joi.object({
    first_name: Joi.string().min(2).max(50).optional(),
    last_name: Joi.string().min(2).max(50).optional(),
    company_name: Joi.string().max(100).optional(),
    phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-$$$$]{7,15}$/).optional(),
    address: Joi.string().max(255).optional(),
    bio: Joi.string().max(500).optional(),
    website: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional()
  }),

  // Password change
  passwordChange: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).required(),
    confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
  }),

  // Query parameters for pagination
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    search: Joi.string().max(100).optional(),
    status: Joi.string().optional(),
    category: Joi.string().optional(),
    date_from: Joi.date().optional(),
    date_to: Joi.date().optional()
  })
};

module.exports = {
  validate,
  schemas
};
