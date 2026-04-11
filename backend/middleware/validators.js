const { body } = require('express-validator');

// ─── Auth Validators ───────────────────────────────────────

exports.registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter.'),
];

exports.loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email format.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ─── Profile Validators ────────────────────────────────────

exports.updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters.'),
];

// ─── Photo Validators ──────────────────────────────────────

exports.uploadPhotoValidator = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Caption cannot exceed 300 characters.'),

  body('groupId')
    .optional()
    .isMongoId().withMessage('Invalid group ID.'),
];
