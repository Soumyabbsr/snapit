const express = require('express');
const router = express.Router();

const { uploadPhoto, getGroupPhotos, deletePhoto } = require('../controllers/photo.controller');
const { protect } = require('../middleware/auth.middleware');
const { handleUpload } = require('../middleware/upload.middleware');
const { uploadPhotoValidator } = require('../middleware/validators');
const { uploadLimiter } = require('../middleware/security.middleware');

// POST /api/photos/upload
router.post('/upload', protect, uploadLimiter, handleUpload('image'), uploadPhotoValidator, uploadPhoto);

// DELETE /api/photos/:photoId
router.delete('/:photoId', protect, deletePhoto);

// GET /api/groups/:groupId/photos (Note: Need to map this in server.js or group routes)
router.get('/group/:groupId', protect, getGroupPhotos);

module.exports = router;
