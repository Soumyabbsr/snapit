const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const cloudinaryService = require('../services/cloudinaryService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('partners.userId', 'name avatar')
    .populate('groupIds', 'name emoji photoCount');

  res.status(200).json({ success: true, data: user });
}));

// @route   PATCH /api/users/me
// @desc    Update current user profile
// @access  Private
router.patch('/me', authMiddleware, asyncHandler(async (req, res, next) => {
  const { name, avatar } = req.body;
  const updates = {};

  if (name) {
    if (name.length < 2 || name.length > 50) {
      throw new ApiError(400, 'Name must be between 2 and 50 characters');
    }
    updates.name = name;
  }
  
  if (avatar) {
    updates.avatar = avatar;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user });
}));

// @route   POST /api/users/me/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/me/avatar', authMiddleware, upload.single('avatar'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image file');
  }

  // File size validation occurs at multer level (5MB limit)

  // Upload to Cloudinary
  const result = await cloudinaryService.uploadAvatar(req.file.buffer, req.user._id);

  // Update User
  const user = await User.findById(req.user._id);
  user.avatar = result.secure_url;
  user.avatarPublicId = result.public_id;
  await user.save();

  res.status(200).json({ success: true, data: user });
}));

module.exports = router;
