const express = require('express');
const router = express.Router();
const multer = require('multer');
const Photo = require('../models/Photo');
const Group = require('../models/Group');
const Widget = require('../models/Widget');
const authMiddleware = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const cloudinaryService = require('../services/cloudinaryService');
const socketService = require('../services/socketService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

const isMember = (group, userId) => {
  return group.members.some(member => member.userId.toString() === userId.toString());
};

const isAdmin = (group, userId) => {
  return group.members.some(member => member.userId.toString() === userId.toString() && member.role === 'admin');
};

// @route   POST /api/photos/upload
// @desc    Upload photo to group
// @access  Private
router.post('/upload', upload.single('photo'), authMiddleware, asyncHandler(async (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a photo file');
  }

  const { groupId, caption, width, height } = req.body;

  if (!groupId || !width || !height) {
    throw new ApiError(400, 'groupId, width, and height are required');
  }

  const group = await Group.findById(groupId);
  if (!group || !group.isActive || !isMember(group, req.user._id)) {
    throw new ApiError(403, 'GROUP_ACCESS_DENIED', 'Group access denied');
  }

  // Upload to Cloudinary
  const result = await cloudinaryService.uploadPhoto(req.file.buffer, groupId, req.user._id);

  try {
    const photo = new Photo({
      uploadedBy: req.user._id,
      groupId,
      cloudinaryPublicId: result.public_id,
      cdnUrl: result.secure_url,
      thumbnailUrl: cloudinaryService.generateThumbnailUrl(result.public_id),
      caption: caption || '',
      width: parseInt(width),
      height: parseInt(height)
    });

    await photo.save();

    group.photoCount += 1;
    group.lastPhotoAt = new Date();
    await group.save();

    // Upsert widgets for all members
    await Promise.all(group.members.map(member => 
      Widget.findOneAndUpdate(
        { userId: member.userId, groupId: group._id },
        { currentPhotoId: photo._id, refreshedAt: new Date() },
        { upsert: true }
      )
    ));

    const populatedPhoto = await Photo.findById(photo._id).populate('uploadedBy', 'name avatar');

    const io = req.app.get('io');
    if (io) {
      socketService.emitToGroupExcept(io, groupId, req.app.get(`socketMap:${req.user._id}`), 'photo:new', { photo: populatedPhoto, groupId });
    }

    res.status(201).json({ success: true, data: { photo: populatedPhoto } });
  } catch (error) {
    // If DB fails, delete from cloudinary to prevent leaks
    await cloudinaryService.deletePhoto(result.public_id);
    throw new ApiError(500, 'Failed to save photo to DB');
  }
}));

// @route   GET /api/photos/group/:groupId
// @desc    Get photos for a group
// @access  Private
router.get('/group/:groupId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const group = await Group.findById(groupId);
  if (!group || !isMember(group, req.user._id)) {
    throw new ApiError(403, 'GROUP_ACCESS_DENIED', 'Access denied');
  }

  const photos = await Photo.find({ groupId, isActive: true })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('uploadedBy', 'name avatar');

  const totalPhotos = await Photo.countDocuments({ groupId, isActive: true });

  res.status(200).json({ 
    success: true, 
    data: { 
      photos, 
      totalPhotos, 
      currentPage: page, 
      totalPages: Math.ceil(totalPhotos / limit),
      hasMore: page * limit < totalPhotos
    } 
  });
}));

// @route   POST /api/photos/:photoId/seen
// @desc    Mark photo as seen
// @access  Private
router.post('/:photoId/seen', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const photo = await Photo.findOne({ _id: req.params.photoId, isActive: true });
  if (!photo) {
    throw new ApiError(404, 'PHOTO_NOT_FOUND', 'Photo not found');
  }

  const group = await Group.findById(photo.groupId);
  if (!group || !isMember(group, req.user._id)) {
    throw new ApiError(403, 'NOT_MEMBER', 'Not a member of this group');
  }

  if (photo.uploadedBy.toString() === req.user._id.toString()) {
    return res.status(200).json({ success: true, data: { seenCount: photo.seenBy.length } }); // Cannot see own
  }

  const alreadySeen = photo.seenBy.some(s => s.userId.toString() === req.user._id.toString());
  if (!alreadySeen) {
    photo.seenBy.push({ userId: req.user._id, seenAt: Date.now() });
    await photo.save();

    const io = req.app.get('io');
    if (io) {
      socketService.emitToGroup(io, photo.groupId, 'photo:seen', { photoId: photo._id, userId: req.user._id, seenCount: photo.seenBy.length });
    }
  }

  res.status(200).json({ success: true, data: { seenCount: photo.seenBy.length } });
}));

// @route   POST /api/photos/:photoId/react
// @desc    Add or update reaction to photo
// @access  Private
router.post('/:photoId/react', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const { emoji } = req.body;
  const allowedEmojis = ['❤️','😂','😮','🔥','💛','👏'];

  if (!allowedEmojis.includes(emoji)) {
    throw new ApiError(400, 'INVALID_EMOJI', 'Invalid emoji');
  }

  const photo = await Photo.findOne({ _id: req.params.photoId, isActive: true });
  if (!photo) {
    throw new ApiError(404, 'PHOTO_NOT_FOUND', 'Photo not found');
  }

  const group = await Group.findById(photo.groupId);
  if (!group || !isMember(group, req.user._id)) {
    throw new ApiError(403, 'NOT_MEMBER', 'Not a member of this group');
  }

  const reactionIndex = photo.reactions.findIndex(r => r.userId.toString() === req.user._id.toString());
  if (reactionIndex > -1) {
    photo.reactions[reactionIndex].emoji = emoji;
  } else {
    photo.reactions.push({ userId: req.user._id, emoji, reactedAt: Date.now() });
  }

  await photo.save();

  const io = req.app.get('io');
  if (io) {
    socketService.emitToGroup(io, photo.groupId, 'photo:reaction', { photoId: photo._id, reactions: photo.reactions, reactorId: req.user._id });
  }

  res.status(200).json({ success: true, data: { reactions: photo.reactions } });
}));

// @route   DELETE /api/photos/:photoId/react
// @desc    Remove reaction from photo
// @access  Private
router.delete('/:photoId/react', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const photo = await Photo.findOne({ _id: req.params.photoId, isActive: true });
  if (!photo) {
    throw new ApiError(404, 'PHOTO_NOT_FOUND', 'Photo not found');
  }

  photo.reactions = photo.reactions.filter(r => r.userId.toString() !== req.user._id.toString());
  await photo.save();

  const io = req.app.get('io');
  if (io) {
    socketService.emitToGroup(io, photo.groupId, 'photo:reaction', { photoId: photo._id, reactions: photo.reactions });
  }

  res.status(200).json({ success: true, data: { reactions: photo.reactions } });
}));

// @route   DELETE /api/photos/:photoId
// @desc    Delete photo
// @access  Private
router.delete('/:photoId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const photo = await Photo.findOne({ _id: req.params.photoId, isActive: true });
  if (!photo) {
    throw new ApiError(404, 'PHOTO_NOT_FOUND', 'Photo not found');
  }

  const group = await Group.findById(photo.groupId);
  
  if (photo.uploadedBy.toString() !== req.user._id.toString() && (!group || !isAdmin(group, req.user._id))) {
    throw new ApiError(403, 'CANNOT_DELETE', 'Only the uploader or a group admin can delete this photo');
  }

  photo.isActive = false;
  await photo.save();

  if (group) {
    group.photoCount = Math.max(0, group.photoCount - 1);
    await group.save();
  }

  const io = req.app.get('io');
  if (io) {
    socketService.emitToGroup(io, photo.groupId, 'photo:deleted', { photoId: photo._id, groupId: photo.groupId });
  }

  res.status(200).json({ success: true });
}));

module.exports = router;
