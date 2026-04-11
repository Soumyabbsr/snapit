const { validationResult } = require('express-validator');
const Photo = require('../models/Photo');
const GroupMember = require('../models/GroupMember');
const cloudinaryService = require('../services/cloudinaryService');

// ─────────────────────────────────────────────────────────
// @route   POST /api/photos/upload
// @access  Private
// ─────────────────────────────────────────────────────────
exports.uploadPhoto = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });

    const { caption = '', groupId } = req.body;
    if (!groupId) return res.status(400).json({ success: false, message: 'Group ID is required.' });

    // 1. Validate membership
    const membership = await GroupMember.findOne({ groupId, userId: req.user.id });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member of this group.' });

    // 2. "One photo per day" check
    // Look for any active photo by this user in this group in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingPhoto = await Photo.findOne({
      groupId,
      uploadedBy: req.user.id,
      isActive: true,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (existingPhoto) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only post one photo per day in this group. Delete your current photo to post a new one.' 
      });
    }

    // 3. Upload to Cloudinary
    const result = await cloudinaryService.uploadPhoto(req.file.buffer, groupId, req.user.id);
    const thumbnailUrl = cloudinaryService.generateThumbnailUrl(result.public_id);

    // 3. Save to MongoDB using correct Model fields
    const photo = await Photo.create({
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      thumbnailUrl: thumbnailUrl,
      uploadedBy: req.user.id,
      groupId,
      caption,
      width: result.width,
      height: result.height,
    });

    await photo.populate('uploadedBy', 'name avatar avatarPublicId');

    // ─── Update Associated Widgets ─────────────────────────────
    // When a new photo is posted, ensure all widgets linked to this group
    // are updated to show the latest photo ID immediately.
    try {
      await require('../models/Widget').updateMany(
        { groupId },
        { currentPhotoId: photo._id, refreshedAt: new Date() }
      );
      console.log(`🖼️ Updated widgets for group: ${groupId}`);
    } catch (widgetErr) {
      console.error('Widget sync failed:', widgetErr.message);
      // Non-blocking error
    }

    // 4. Real-time: Emit new_photo to correctly named room (group:ID)
    const io = req.app.get('io');
    if (io) {
      io.to(`group:${groupId}`).emit('new_photo', {
        photo: photo.toObject(),
        groupId,
      });
      console.log(`📡 Emitted new_photo to group:${groupId}`);
    }

    res.status(201).json({ success: true, photo });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// @route   GET /api/groups/:groupId/photos
// @access  Private
// ─────────────────────────────────────────────────────────
exports.getGroupPhotos = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const membership = await GroupMember.findOne({ groupId, userId: req.user.id });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member of this group.' });

    const [photos, total] = await Promise.all([
      Photo.find({ groupId, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name avatar avatarPublicId')
        .lean({ virtuals: true }),
      Photo.countDocuments({ groupId, isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      photos,
      total,
      hasMore: skip + photos.length < total
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────
// @route   DELETE /api/photos/:photoId
// @access  Private
// ─────────────────────────────────────────────────────────
exports.deletePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.photoId, uploadedBy: req.user.id });
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found or unauthorized.' });

    const groupId = photo.groupId;
    
    // Cloudinary cleanup
    if (photo.cloudinaryPublicId) {
      await cloudinaryService.deletePhoto(photo.cloudinaryPublicId);
    }
    
    await Photo.deleteOne({ _id: photo._id });

    // ─── Real-time: Notify group that a photo was deleted ────────────────
    const io = req.app.get('io');
    if (io) {
      io.to(`group:${groupId}`).emit('photo_deleted', { photoId: req.params.photoId, groupId });
    }

    res.status(200).json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
