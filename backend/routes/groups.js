const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Photo = require('../models/Photo');
const Invite = require('../models/Invite');
const authMiddleware = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const generateCode = require('../utils/generateCode');
const socketService = require('../services/socketService');

const isMember = (group, userId) => {
  return group.members.some(member => member.userId.toString() === userId.toString());
};

const isAdmin = (group, userId) => {
  return group.members.some(member => member.userId.toString() === userId.toString() && member.role === 'admin');
};

// @route   GET /api/groups
// @desc    Get user's groups
// @access  Private
router.get('/', authMiddleware, asyncHandler(async (req, res, next) => {
  let groups = await Group.find({ 'members.userId': req.user._id, isActive: true })
    .populate('members.userId', 'name avatar');

  groups = await Promise.all(groups.map(async (group) => {
    const latestPhoto = await Photo.findOne({ groupId: group._id, isActive: true }).sort({ createdAt: -1 });
    return { ...group.toObject(), latestPhoto };
  }));

  groups.sort((a, b) => {
    if (!a.lastPhotoAt && !b.lastPhotoAt) return 0;
    if (!a.lastPhotoAt) return 1;
    if (!b.lastPhotoAt) return -1;
    return b.lastPhotoAt - a.lastPhotoAt;
  });

  res.status(200).json({ success: true, data: { groups } });
}));

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', authMiddleware, asyncHandler(async (req, res, next) => {
  const { name, emoji } = req.body;

  if (!name || name.length > 40) {
    throw new ApiError(400, 'Group name is required (max 40 chars)');
  }

  const group = new Group({
    name,
    emoji: emoji || '💛',
    createdBy: req.user._id,
    members: [{ userId: req.user._id, role: 'admin' }]
  });

  await group.save();

  req.user.groupIds.push(group._id);
  await req.user.save();

  res.status(201).json({ success: true, data: { group } });
}));

// @route   GET /api/groups/:groupId
// @desc    Get group details by ID
// @access  Private
router.get('/:groupId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const group = await Group.findOne({ _id: req.params.groupId, isActive: true })
    .populate('members.userId', 'name avatar');

  if (!group) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  if (!isMember(group, req.user._id)) {
    throw new ApiError(403, 'NOT_MEMBER', 'Not a member of this group');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const totalPhotos = await Photo.countDocuments({ groupId: group._id, isActive: true });
  const photos = await Photo.find({ groupId: group._id, isActive: true })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('uploadedBy', 'name avatar');

  res.status(200).json({ 
    success: true, 
    data: { 
      group, 
      photos, 
      totalPhotos, 
      currentPage: page, 
      totalPages: Math.ceil(totalPhotos / limit) 
    } 
  });
}));

// @route   PATCH /api/groups/:groupId
// @desc    Update group details
// @access  Private
router.patch('/:groupId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const { name, emoji } = req.body;

  const group = await Group.findById(req.params.groupId);
  if (!group || !group.isActive) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  if (!isAdmin(group, req.user._id)) {
    throw new ApiError(403, 'NOT_ADMIN', 'Only admins can edit group settings');
  }

  if (name) group.name = name;
  if (emoji) group.emoji = emoji;

  await group.save();

  res.status(200).json({ success: true, data: group });
}));

// @route   POST /api/groups/:groupId/invite
// @desc    Generate an invite code for the group
// @access  Private
router.post('/:groupId/invite', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.groupId);
  if (!group || !group.isActive) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  if (!isAdmin(group, req.user._id)) {
    throw new ApiError(403, 'NOT_ADMIN', 'Only admins can generate group invites');
  }

  let code;
  let isUnique = false;
  while (!isUnique) {
    code = generateCode(8);
    const existing = await Invite.findOne({ code });
    if (!existing) isUnique = true;
  }

  const invite = new Invite({
    code,
    type: 'group',
    createdBy: req.user._id,
    groupId: group._id,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  });

  await invite.save();

  res.status(201).json({ 
    success: true, 
    data: { 
      code, 
      expiresAt: invite.expiresAt,
      deepLink: 'snapit://invite/' + code 
    } 
  });
}));

// @route   DELETE /api/groups/:groupId/members/:memberId
// @desc    Remove a member from the group
// @access  Private
router.delete('/:groupId/members/:memberId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const { groupId, memberId } = req.params;

  if (memberId.toString() === req.user._id.toString()) {
     throw new ApiError(400, 'SELF_REMOVE', 'Use /leave endpoint to leave group');
  }

  const group = await Group.findById(groupId);
  if (!group || !group.isActive) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  if (!isAdmin(group, req.user._id)) {
    throw new ApiError(403, 'NOT_ADMIN', 'Only admins can remove members');
  }

  const memberIndex = group.members.findIndex(m => m.userId.toString() === memberId.toString());
  if (memberIndex === -1) {
    throw new ApiError(404, 'MEMBER_NOT_FOUND', 'User is not a member of this group');
  }

  group.members.splice(memberIndex, 1);
  await group.save();

  await User.findByIdAndUpdate(memberId, { $pull: { groupIds: groupId } });

  // Access IO from app (setup in server.js/socket.js)
  const io = req.app.get('io');
  if (io) {
    socketService.emitToUser(io, memberId, 'group:memberRemoved', { groupId });
  }

  res.status(200).json({ success: true });
}));

// @route   POST /api/groups/:groupId/leave
// @desc    Leave a group
// @access  Private
router.post('/:groupId/leave', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;

  const group = await Group.findById(groupId);
  if (!group || !group.isActive) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  if (!isMember(group, req.user._id)) {
    throw new ApiError(403, 'NOT_MEMBER', 'Not a member of this group');
  }

  const adminMembers = group.members.filter(m => m.role === 'admin');
  const isOnlyAdmin = adminMembers.length === 1 && adminMembers[0].userId.toString() === req.user._id.toString();

  if (isOnlyAdmin) {
    throw new ApiError(400, 'LAST_ADMIN', 'You are the only admin. Promote another member before leaving.');
  }

  group.members = group.members.filter(m => m.userId.toString() !== req.user._id.toString());
  await group.save();

  req.user.groupIds = req.user.groupIds.filter(id => id.toString() !== groupId.toString());
  await req.user.save();

  const io = req.app.get('io');
  if (io) {
    socketService.emitToGroup(io, groupId, 'group:memberLeft', { groupId, userId: req.user._id, userName: req.user.name });
  }

  res.status(200).json({ success: true });
}));

// @route   PATCH /api/groups/:groupId/members/:memberId/role
// @desc    Update a member's role
// @access  Private
router.patch('/:groupId/members/:memberId/role', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  const { groupId, memberId } = req.params;

  if (role !== 'admin' && role !== 'member') {
    throw new ApiError(400, 'INVALID_ROLE', 'Role must be admin or member');
  }

  const group = await Group.findById(groupId);
  if (!group || !group.isActive) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  if (!isAdmin(group, req.user._id)) {
    throw new ApiError(403, 'NOT_ADMIN', 'Only admins can change roles');
  }

  const member = group.members.find(m => m.userId.toString() === memberId.toString());
  if (!member) {
    throw new ApiError(404, 'MEMBER_NOT_FOUND', 'User is not a member of this group');
  }

  member.role = role;
  await group.save();

  res.status(200).json({ success: true, data: { member } });
}));

// @route   DELETE /api/groups/:groupId
// @desc    Delete a group
// @access  Private
router.delete('/:groupId', authMiddleware, validateObjectId, asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId;

  const group = await Group.findById(groupId);
  if (!group || !group.isActive) {
    throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  if (!isAdmin(group, req.user._id)) {
    throw new ApiError(403, 'NOT_ADMIN', 'Only admins can delete group');
  }

  group.isActive = false;
  await group.save();

  await Photo.updateMany({ groupId }, { isActive: false });
  await User.updateMany({ groupIds: groupId }, { $pull: { groupIds: groupId } });

  const io = req.app.get('io');
  if (io) {
     socketService.emitToGroup(io, groupId, 'group:deleted', { groupId });
  }

  res.status(200).json({ success: true });
}));

module.exports = router;
