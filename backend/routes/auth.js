const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Shared utility to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authRateLimiter, asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } });
  }

  const user = new User({ name, email, password });
  
  // Hash refresh token
  const { accessToken, refreshToken: rawRefreshToken } = generateTokens(user);
  const salt = await bcrypt.genSalt(10);
  user.refreshToken = await bcrypt.hash(rawRefreshToken, salt);

  await user.save();

  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        inviteCode: user.inviteCode
      },
      accessToken,
      refreshToken: rawRefreshToken
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authRateLimiter, asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, error: { code: 'ACCOUNT_DISABLED', message: 'Account disabled. Contact support.' } });
  }

  const { accessToken, refreshToken: rawRefreshToken } = generateTokens(user);
  const salt = await bcrypt.genSalt(10);
  user.refreshToken = await bcrypt.hash(rawRefreshToken, salt);

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        inviteCode: user.inviteCode
      },
      accessToken,
      refreshToken: rawRefreshToken
    }
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } });
  }

  const user = await User.findById(decoded._id);
  if (!user || (!user.refreshToken)) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }

  const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token mismatch' } });
  }

  const { accessToken, refreshToken: newRawRefreshToken } = generateTokens(user);
  const salt = await bcrypt.genSalt(10);
  user.refreshToken = await bcrypt.hash(newRawRefreshToken, salt);

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRawRefreshToken
    }
  });
}));

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware, asyncHandler(async (req, res, next) => {
  req.user.refreshToken = null;
  await req.user.save();

  res.status(200).json({ success: true, message: 'Logged out successfully' });
}));

module.exports = router;
