const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { registerValidator, loginValidator } = require('../middleware/validators');
const { authLimiter } = require('../middleware/security.middleware');

// POST /api/auth/register
router.post('/register', authLimiter, registerValidator, register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidator, login);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

module.exports = router;
