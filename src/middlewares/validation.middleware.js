const { body, validationResult, query, param, sanitizeBody, sanitizeQuery, sanitizeParam } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  // Sanitize common fields
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace and escape HTML characters
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Trim whitespace and escape HTML characters
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        // Trim whitespace and escape HTML characters
        req.params[key] = req.params[key].trim();
      }
    });
  }
  
  next();
};

// Validation rules for different entities
const validationRules = {
  // User validation rules
  user: {
    register: [
      body('name').notEmpty().withMessage('Name is required').trim().escape(),
      body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    login: [
      body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
      body('password').notEmpty().withMessage('Password is required')
    ],
    invite: [
      body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
      body('role').isIn(['editor', 'reporter']).withMessage('Role must be either editor or reporter')
    ]
  },

  // News validation rules
  news: {
    create: [
      body('title').notEmpty().withMessage('Title is required').trim().escape(),
      body('content').notEmpty().withMessage('Content is required').trim().escape(),
      body('tags').optional().isArray().withMessage('Tags must be an array')
    ],
    update: [
      body('title').optional().notEmpty().withMessage('Title cannot be empty').trim().escape(),
      body('content').optional().notEmpty().withMessage('Content cannot be empty').trim().escape(),
      body('tags').optional().isArray().withMessage('Tags must be an array')
    ],
    add: [
      body('title').notEmpty().withMessage('Title is required').trim().escape(),
      body('description').notEmpty().withMessage('Description is required').trim().escape(),
      body('link').isURL().withMessage('Please provide a valid URL').trim()
    ]
  },

  // Subscription validation rules
  subscription: {
    subscribe: [
      body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail()
    ],
    verifyOtp: [
      body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
      body('otp').notEmpty().withMessage('OTP is required').trim().escape()
    ]
  },

  // NGO validation rules
  ngo: {
    story: [
      body('title').notEmpty().withMessage('Title is required').trim().escape(),
      body('description').notEmpty().withMessage('Description is required').trim().escape()
    ],
    gallery: [
      body('type').isIn(['photo', 'video']).withMessage('Type must be either photo or video'),
      body('caption').optional().notEmpty().withMessage('Caption cannot be empty').trim().escape()
    ],
    donation: [
      body('amount').isFloat({ min: 1 }).withMessage('Amount must be a positive number')
    ]
  }
};

module.exports = {
  validate,
  sanitize,
  validationRules
};