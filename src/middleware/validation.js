const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Validation error:', { error: errorMessage, data: req[property] });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    first_name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    last_name: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    role: Joi.string().valid('admin', 'tender-creator', 'vendor').required().messages({
      'any.only': 'Role must be one of: admin, tender-creator, vendor',
      'any.required': 'Role is required'
    }),
    company_name: Joi.string().max(100).when('role', {
      is: 'vendor',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'string.max': 'Company name cannot exceed 100 characters',
      'any.required': 'Company name is required for vendors'
    }),
    phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-$$$$]{7,15}$/).optional().messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().min(2).max(50).optional(),
    last_name: Joi.string().min(2).max(50).optional(),
    company_name: Joi.string().max(100).optional(),
    phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-$$$$]{7,15}$/).optional(),
    bio: Joi.string().max(500).optional()
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
  })
};

// Tender validation schemas
const tenderSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required().messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
    description: Joi.string().min(20).max(2000).required().messages({
      'string.min': 'Description must be at least 20 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required'
    }),
    category: Joi.string().max(100).required().messages({
      'string.max': 'Category cannot exceed 100 characters',
      'any.required': 'Category is required'
    }),
    budget_min: Joi.number().positive().required().messages({
      'number.positive': 'Minimum budget must be a positive number',
      'any.required': 'Minimum budget is required'
    }),
    budget_max: Joi.number().positive().greater(Joi.ref('budget_min')).required().messages({
      'number.positive': 'Maximum budget must be a positive number',
      'number.greater': 'Maximum budget must be greater than minimum budget',
      'any.required': 'Maximum budget is required'
    }),
    submission_deadline: Joi.date().greater('now').required().messages({
      'date.greater': 'Submission deadline must be in the future',
      'any.required': 'Submission deadline is required'
    }),
    requirements: Joi.string().max(1000).optional(),
    location: Joi.string().max(200).optional()
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(20).max(2000).optional(),
    category: Joi.string().max(100).optional(),
    budget_min: Joi.number().positive().optional(),
    budget_max: Joi.number().positive().optional(),
    submission_deadline: Joi.date().greater('now').optional(),
    requirements: Joi.string().max(1000).optional(),
    location: Joi.string().max(200).optional(),
    status: Joi.string().valid('draft', 'published', 'closed', 'awarded').optional()
  })
};

// Bid validation schemas
const bidSchemas = {
  create: Joi.object({
    tender_id: Joi.number().integer().positive().required().messages({
      'number.integer': 'Tender ID must be an integer',
      'number.positive': 'Tender ID must be positive',
      'any.required': 'Tender ID is required'
    }),
    amount: Joi.number().positive().required().messages({
      'number.positive': 'Bid amount must be a positive number',
      'any.required': 'Bid amount is required'
    }),
    proposal: Joi.string().min(50).max(2000).required().messages({
      'string.min': 'Proposal must be at least 50 characters long',
      'string.max': 'Proposal cannot exceed 2000 characters',
      'any.required': 'Proposal is required'
    }),
    delivery_timeline: Joi.string().max(200).optional(),
    notes: Joi.string().max(500).optional()
  }),

  update: Joi.object({
    amount: Joi.number().positive().optional(),
    proposal: Joi.string().min(50).max(2000).optional(),
    delivery_timeline: Joi.string().max(200).optional(),
    notes: Joi.string().max(500).optional()
  })
};

module.exports = {
  validate,
  userSchemas,
  tenderSchemas,
  bidSchemas
};
