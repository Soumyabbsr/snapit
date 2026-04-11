const { validationResult } = require('express-validator');
const Photo = require('../models/Photo');
const GroupMember = require('../models/GroupMember');

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

    // Validate membership
    const membership = await GroupMember.findOne({ groupId, userId: req.user.id });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member of this group.' });

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const photo = await Photo.create({
      imageUrl: base64Image,
      uploadedBy: req.user.id,
      groupId,
      caption,
      fileSize: req.file.size,
    });

    await photo.populate('uploadedBy', 'name profilePicture');

    // ─── Real-time: Emit new_photo to all group members via Socket.io ───
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('new_photo', {
        photo: photo.toObject(),
        groupId,
      });
      console.log(`📡 Emitted new_photo to group_${groupId}`);
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
      Photo.find({ groupId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name profilePicture')
        .lean(),
      Photo.countDocuments({ groupId, isDeleted: false }),
    ]);

    res.status(200).json({
      success: true,
      photos,
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
    await Photo.deleteOne({ _id: photo._id });

    // ─── Real-time: Notify group that a photo was deleted ────────────────
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('photo_deleted', { photoId: req.params.photoId, groupId });
    }

    res.status(200).json({ success: true, message: 'Photo deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
