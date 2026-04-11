const express = require('express');
const router = express.Router();

const { getProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { handleUpload } = require('../middleware/upload.middleware');
const { updateProfileValidator } = require('../middleware/validators');

// GET /api/users/me
router.get('/me', protect, getProfile);

// PUT /api/users/me  (with optional image upload)
router.put('/me', protect, handleUpload('image'), updateProfileValidator, updateProfile);

module.exports = router;
