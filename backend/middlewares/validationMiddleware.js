const { body, validationResult } = require('express-validator');
const AppError = require('../utils/appError');

// Common validation rules
const validateEmail = () => {
  return body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail();
};

const validatePassword = () => {
  return body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)'
    );
};

const validateFullName = () => {
  return body('username')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters long');
};

const validatePhone = () => {
  return body('contact_info')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Allow empty phone
      const phoneRegex = /^[\d\s\-()+]+$/;
      if (!phoneRegex.test(value) || value.length < 7) {
        throw new Error('Please enter a valid phone number (minimum 7 digits)');
      }
      return true;
    });
};

// Validation rule sets
const registerValidation = [
  validateFullName(),
  validateEmail(),
  validatePassword(),
  validatePhone(),
];

const loginValidation = [
  validateEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const itemValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters long'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters long'),

  body('type')
    .isIn(['lost', 'found'])
    .withMessage('Type must be either "lost" or "found"'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters long'),

  body('date_lost_or_found')
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
];

const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters long'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return next(new AppError(errorMessages.join('. '), 400));
  }

  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  itemValidation,
  categoryValidation,
  handleValidationErrors,
  validateEmail,
  validatePassword,
  validateFullName,
  validatePhone,
};
