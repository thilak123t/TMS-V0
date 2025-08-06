const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['admin', 'tender_creator', 'vendor']).withMessage('Invalid role'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateTender = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('budget').isNumeric().withMessage('Budget must be a number'),
  body('deadline').isISO8601().withMessage('Invalid deadline format'),
  handleValidationErrors
];

const validateBid = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('proposal').notEmpty().withMessage('Proposal is required'),
  handleValidationErrors
];

const validateComment = [
  body('content').notEmpty().withMessage('Content is required'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTender,
  validateBid,
  validateComment,
  handleValidationErrors
};
