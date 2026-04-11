const express = require('express');
const router = express.Router();
const Widget = require('../models/Widget');
const Group = require('../models/Group');
const Photo = require('../models/Photo');
const authMiddleware = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const isMember = (group, userId) => {
  return group.members.some(member => member.userId.toString() === userId.toString());
};

// @route   POST /api/widgets
// @desc    Create or update widget setup
// @access  Private
router.post('/', authMiddleware, asyncHandler(async (req, res, next) => {
  const { groupId, size } = req.body;

  if (!['small', 'medium', 'large'].includes(size)) {
     throw new ApiError(400, 'Invalid widget size');
  }

  const group = await Group.findById(groupId);
  if (!group || !isMember(group, req.user._id)) {
     throw new ApiError(403, 'GROUP_ACCESS_DENIED', 'Group access denied');
  }

  const latestPhoto = await Photo.findOne({ groupId, isActive: true }).sort({ createdAt: -1 });

  const widget = await Widget.findOneAndUpdate(
    { userId: req.user._id, groupId },
    { size, currentPhotoId: latestPhoto ? latestPhoto._id : null, refreshedAt: new Date() },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, data: { widget } });
}));

// @route   GET /api/widgets
// @desc    Get user's widgets
// @access  Private
router.get('/', authMiddleware, asyncHandler(async (req, res, next) => {
  const widgets = await Widget.find({ userId: req.user._id })
    .populate('groupId', 'name emoji')
    .populate({
      path: 'currentPhotoId',
      select: 'cdnUrl thumbnailUrl caption uploadedBy',
      populate: { path: 'uploadedBy', select: 'name avatar' }
    });

  res.status(200).json({ success: true, data: { widgets } });
}));

// @route   GET /api/widgets/data/:groupId
// @desc    Get data for a specific group's widget
// @access  Private
router.get('/data/:groupId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const widget = await Widget.findOne({ userId: req.user._id, groupId: req.params.groupId })
    .populate('groupId', 'name emoji')
    .populate({
      path: 'currentPhotoId',
      select: 'cdnUrl thumbnailUrl caption uploadedBy',
      populate: { path: 'uploadedBy', select: 'name avatar' }
    });

  if (!widget) {
    throw new ApiError(404, 'WIDGET_NOT_FOUND', 'Widget not found');
  }

  res.status(200).json({ 
    success: true, 
    data: { 
      group: widget.groupId, 
      photo: widget.currentPhotoId, 
      refreshedAt: widget.refreshedAt 
    } 
  });
}));

// @route   POST /api/widgets/refresh/:groupId
// @desc    Refresh widget data
// @access  Private
router.post('/refresh/:groupId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const widget = await Widget.findOne({ userId: req.user._id, groupId: req.params.groupId });
  if (!widget) {
    throw new ApiError(404, 'WIDGET_NOT_FOUND', 'Widget not found');
  }

  const latestPhoto = await Photo.findOne({ groupId: req.params.groupId, isActive: true }).sort({ createdAt: -1 });

  widget.currentPhotoId = latestPhoto ? latestPhoto._id : null;
  widget.refreshedAt = new Date();
  await widget.save();

  res.status(200).json({ success: true, data: { widget } });
}));

// @route   PATCH /api/widgets/:widgetId
// @desc    Update widget size
// @access  Private
router.patch('/:widgetId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const { size } = req.body;

  if (!['small', 'medium', 'large'].includes(size)) {
    throw new ApiError(400, 'Invalid widget size');
  }

  const widget = await Widget.findOne({ _id: req.params.widgetId, userId: req.user._id });
  if (!widget) {
    throw new ApiError(403, 'WIDGET_NOT_FOUND', 'Widget access denied or not found');
  }

  widget.size = size;
  await widget.save();

  res.status(200).json({ success: true, data: { widget } });
}));

// @route   DELETE /api/widgets/:widgetId
// @desc    Delete widget
// @access  Private
router.delete('/:widgetId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const widget = await Widget.findOneAndDelete({ _id: req.params.widgetId, userId: req.user._id });
  if (!widget) {
    throw new ApiError(403, 'WIDGET_NOT_FOUND', 'Widget access denied or not found');
  }

  res.status(200).json({ success: true });
}));

module.exports = router;
