const { validationResult } = require('express-validator');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────
// @route   GET /api/users/me
// @access  Private
// ─────────────────────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// @route   PUT /api/users/me
// @access  Private
// ─────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // ── Update text fields ──────────────────────────────
    if (req.body.name !== undefined) user.name = req.body.name.trim();
    if (req.body.bio !== undefined) user.bio = req.body.bio.trim();

    // ── Handle profile picture upload ───────────────────
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Save directly as a string instead of object with publicId
      user.profilePicture = {
        url: base64Image,
      };
    }

    await user.save();

    res.status(200).json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};
