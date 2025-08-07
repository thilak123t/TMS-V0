const Joi = require('joi');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// UUID validation
const validateUUID = (req, res, next) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  next();
};

// Pagination validation
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  if (isNaN(page) || page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive number'
    });
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  next();
};

// Validation schemas
const schemas = {
  // User registration schema
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('admin', 'tender-creator', 'vendor').required(),
    company_name: Joi.string().max(255).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().optional()
  }),

  // User login schema
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Tender creation schema
  createTender: Joi.object({
    title: Joi.string().min(5).max(255).required(),
    description: Joi.string().min(10).required(),
    category: Joi.string().max(100).required(),
    budget: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('USD'),
    deadline: Joi.date().greater('now').required(),
    location: Joi.string().max(255).optional(),
    requirements: Joi.object().optional(),
    attachments: Joi.array().items(Joi.object()).optional()
  }),

  // Tender update schema
  updateTender: Joi.object({
    title: Joi.string().min(5).max(255).optional(),
    description: Joi.string().min(10).optional(),
    category: Joi.string().max(100).optional(),
    budget: Joi.number().positive().optional(),
    currency: Joi.string().length(3).optional(),
    deadline: Joi.date().greater('now').optional(),
    location: Joi.string().max(255).optional(),
    requirements: Joi.object().optional(),
    attachments: Joi.array().items(Joi.object()).optional(),
    status: Joi.string().valid('draft', 'published', 'closed', 'awarded', 'cancelled').optional()
  }),

  // Bid creation schema
  createBid: Joi.object({
    tender_id: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).default('USD'),
    delivery_time: Joi.number().integer().min(1).required(),
    proposal: Joi.string().min(10).required(),
    documents: Joi.array().items(Joi.object({
      file_name: Joi.string().required(),
      file_path: Joi.string().required(),
      file_size: Joi.number().positive().required(),
      file_type: Joi.string().required()
    })).optional()
  }),

  // Bid update schema
  updateBid: Joi.object({
    amount: Joi.number().positive().optional(),
    currency: Joi.string().length(3).optional(),
    delivery_time: Joi.number().integer().min(1).optional(),
    proposal: Joi.string().min(10).optional(),
    documents: Joi.array().items(Joi.object({
      file_name: Joi.string().required(),
      file_path: Joi.string().required(),
      file_size: Joi.number().positive().required(),
      file_type: Joi.string().required()
    })).optional()
  }),

  // Vendor invitation schema
  inviteVendors: Joi.object({
    vendorIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    message: Joi.string().max(500).optional()
  }),

  // Comment creation schema
  createComment: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    parent_id: Joi.string().uuid().optional()
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().max(100).optional(),
    status: Joi.string().optional(),
    category: Joi.string().optional(),
    unread_only: Joi.boolean().optional()
  })
};

// Specific validation functions
const validateTenderCreation = validate(schemas.createTender);
const validateTenderUpdate = validate(schemas.updateTender);
const validateVendorInvitation = validate(schemas.inviteVendors);

module.exports = {
  validate,
  validateUUID,
  validatePagination,
  validateTenderCreation,
  validateTenderUpdate,
  validateVendorInvitation,
  schemas
};
