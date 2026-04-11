const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invite = require('../models/Invite');
const Group = require('../models/Group');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const generateCode = require('../utils/generateCode');
const socketService = require('../services/socketService');

// @route   POST /api/invites/generate
// @desc    Generate an invite code
// @access  Private
router.post('/generate', authMiddleware, asyncHandler(async (req, res, next) => {
  const { type, groupId } = req.body;

  if (type !== 'partner' && type !== 'group') {
    throw new ApiError(400, 'Invalid invite type');
  }

  if (type === 'group') {
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, 'Valid groupId required for group invite');
    }
    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, 'Group not found');
    
    const isAdmin = group.members.some(m => m.userId.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) throw new ApiError(403, 'Only admins can generate group invites');
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
    type,
    createdBy: req.user._id,
    groupId: type === 'group' ? groupId : null,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
  });

  await invite.save();

  res.status(201).json({ 
    success: true, 
    data: { 
      code, 
      type, 
      expiresAt: invite.expiresAt,
      deepLink: 'snapit://invite/' + code 
    } 
  });
}));

// @route   GET /api/invites/validate/:code
// @desc    Validate an invite code
// @access  Public
router.get('/validate/:code', asyncHandler(async (req, res, next) => {
  const invite = await Invite.findOne({ code: req.params.code })
    .populate('createdBy', 'name avatar')
    .populate('groupId', 'name emoji');

  if (!invite) {
    throw new ApiError(404, 'INVITE_NOT_FOUND', 'Invite not found');
  }

  if (invite.status === 'used') {
    throw new ApiError(400, 'INVITE_USED', 'This invite has already been used');
  }

  if (invite.expiresAt < new Date()) {
    invite.status = 'expired';
    await invite.save();
    throw new ApiError(400, 'INVITE_EXPIRED', 'This invite has expired');
  }

  res.status(200).json({ 
    success: true, 
    data: { 
      valid: true, 
      type: invite.type, 
      createdBy: invite.createdBy, 
      group: invite.groupId 
    } 
  });
}));

// @route   POST /api/invites/accept/:code
// @desc    Accept an invite code
// @access  Private
router.post('/accept/:code', authMiddleware, asyncHandler(async (req, res, next) => {
  const invite = await Invite.findOne({ code: req.params.code });

  if (!invite) throw new ApiError(404, 'INVITE_NOT_FOUND', 'Invite not found');
  if (invite.status === 'used') throw new ApiError(400, 'INVITE_USED', 'This invite has already been used');
  
  if (invite.expiresAt < new Date()) {
    invite.status = 'expired';
    await invite.save();
    throw new ApiError(400, 'INVITE_EXPIRED', 'This invite has expired');
  }

  if (invite.createdBy.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'SELF_INVITE', 'You cannot accept your own invite');
  }

  const creator = await User.findById(invite.createdBy);
  if (!creator) throw new ApiError(404, 'User who created the invite not found');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let responseGroup;

    if (invite.type === 'partner') {
      const alreadyPartners = req.user.partners.some(p => p.userId.toString() === creator._id.toString());
      if (alreadyPartners) throw new ApiError(409, 'ALREADY_CONNECTED', 'You are already connected with this user');

      // Update both users' partner arrays
      req.user.partners.push({ userId: creator._id });
      creator.partners.push({ userId: req.user._id });

      // Create new Group
      const newGroup = new Group({
        name: creator.name + ' & ' + req.user.name,
        emoji: '💛',
        createdBy: creator._id, // Set the creator of the invite as group creator
        isPartnerGroup: true,
        members: [
          { userId: creator._id, role: 'admin' },
          { userId: req.user._id, role: 'admin' }
        ]
      });

      await newGroup.save({ session });
      
      req.user.groupIds.push(newGroup._id);
      creator.groupIds.push(newGroup._id);

      await req.user.save({ session });
      await creator.save({ session });

      responseGroup = newGroup;

    } else if (invite.type === 'group') {
      const group = await Group.findById(invite.groupId).session(session);
      if (!group) throw new ApiError(404, 'GROUP_NOT_FOUND', 'Group not found');

      const alreadyMember = group.members.some(m => m.userId.toString() === req.user._id.toString());
      if (alreadyMember) throw new ApiError(409, 'ALREADY_MEMBER', 'You are already a member of this group');

      group.members.push({ userId: req.user._id, role: 'member' });
      await group.save({ session });

      req.user.groupIds.push(group._id);
      await req.user.save({ session });

      responseGroup = group;
    }

    invite.status = 'used';
    invite.usedBy = req.user._id;
    invite.usedAt = new Date();
    await invite.save({ session });

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get('io');
    if (io) {
      socketService.emitToUser(io, invite.createdBy, 'invite:accepted', { 
        acceptorName: req.user.name, 
        group: { _id: responseGroup._id, name: responseGroup.name, emoji: responseGroup.emoji, photoCount: responseGroup.photoCount } 
      });
    }

    res.status(200).json({ success: true, data: { group: { _id: responseGroup._id, name: responseGroup.name, emoji: responseGroup.emoji } } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}));

// @route   GET /api/invites/my-invites
// @desc    Get user's generated invites
// @access  Private
router.get('/my-invites', authMiddleware, asyncHandler(async (req, res, next) => {
  const invites = await Invite.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate('usedBy', 'name');

  res.status(200).json({ success: true, data: { invites } });
}));

module.exports = router;
