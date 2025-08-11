const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
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
    .withMessage('Role must be admin, tender-creator, or vendor'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Tender validation rules
const validateTender = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters long'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('budget_min')
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget_max')
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number')
    .custom((value, { req }) => {
      if (parseFloat(value) <= parseFloat(req.body.budget_min)) {
        throw new Error('Maximum budget must be greater than minimum budget');
      }
      return true;
    }),
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  handleValidationErrors
];

// Bid validation rules
const validateBid = [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Bid amount must be a positive number'),
  body('proposal')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Proposal must be at least 50 characters long'),
  body('delivery_time')
    .isInt({ min: 1 })
    .withMessage('Delivery time must be at least 1 day'),
  handleValidationErrors
];

// Comment validation rules
const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be between 5 and 1000 characters'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];
// Vendor invitation validation
const validateVendorInvitation = [
  body('vendorIds')
    .isArray({ min: 1 })
    .withMessage('Vendor IDs must be a non-empty array'),
  body('vendorIds.*')
    .isUUID()
    .withMessage('Each vendor ID must be a valid UUID'),
  body('message')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Message must be less than 1000 characters'),
  handleValidationErrors
];
// Tender creation validation
const validateTenderCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters long'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  body('requirements')
    .optional()
    .isString()
    .withMessage('Requirements must be a string'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  handleValidationErrors
];

// Tender update validation (all optional fields, but validated if present)
const validateTenderUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters long'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  body('requirements')
    .optional()
    .isString()
    .withMessage('Requirements must be a string'),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  handleValidationErrors
];

// UUID parameter validator
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid UUID format'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateTender,
  validateTenderCreation,
  validateTenderUpdate,
  validateBid,
  validateComment,
  validateId,
  validatePagination,
  validateVendorInvitation,
  handleValidationErrors
};
