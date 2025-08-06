const { body, query, param, validationResult } = require('express-validator');

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors
    });
  };
};

// Common validation schemas
const schemas = {
  // User registration validation
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('first_name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('First name must be at least 2 characters long'),
    body('last_name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Last name must be at least 2 characters long'),
    body('role')
      .isIn(['admin', 'tender-creator', 'vendor'])
      .withMessage('Role must be admin, tender-creator, or vendor')
  ],

  // User login validation
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Update profile validation
  updateProfile: [
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('First name must be at least 2 characters long'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Last name must be at least 2 characters long'),
    body('company_name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Company name must be at least 2 characters long'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number')
  ],

  // Change password validation
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],

  // Tender creation validation
  createTender: [
    body('title')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Title must be at least 5 characters long'),
    body('description')
      .trim()
      .isLength({ min: 20 })
      .withMessage('Description must be at least 20 characters long'),
    body('budget')
      .isNumeric()
      .withMessage('Budget must be a number'),
    body('deadline')
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
  ],

  // Bid creation validation
  createBid: [
    body('amount')
      .isNumeric()
      .withMessage('Bid amount must be a number'),
    body('proposal')
      .trim()
      .isLength({ min: 50 })
      .withMessage('Proposal must be at least 50 characters long'),
    body('delivery_time')
      .isInt({ min: 1 })
      .withMessage('Delivery time must be a positive number')
  ],

  // Comment validation
  createComment: [
    body('content')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Comment must be at least 5 characters long')
  ],

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isIn(['created_at', 'updated_at', 'title', 'budget', 'deadline'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc')
  ],

  // ID parameter validation
  mongoId: [
    param('id')
      .isUUID()
      .withMessage('Invalid ID format')
  ]
};

module.exports = {
  validate,
  schemas
};
