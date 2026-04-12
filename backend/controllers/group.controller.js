const { validationResult } = require('express-validator');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Invite = require('../models/Invite');
const Photo = require('../models/Photo');
const { generateUniqueInviteCode } = require('../utils/generateInviteCode');

// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res, next) => {
  try {
    const { name, icon = '' } = req.body;
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, message: 'Group name must be at least 2 characters' });
    }

    const inviteCode = await generateUniqueInviteCode();

    const group = await Group.create({
      name,
      icon,
      createdBy: req.user.id,
      inviteCode,
    });

    await GroupMember.create({
      groupId: group._id,
      userId: req.user.id,
      role: 'creator',
    });

    res.status(201).json({ success: true, group });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/groups
// @access  Private
exports.getUserGroups = async (req, res, next) => {
  try {
    const memberships = await GroupMember.find({ userId: req.user.id });
    const groupIds = memberships.map((m) => m.groupId);

    const groups = await Group.find({ _id: { $in: groupIds } })
      .populate('createdBy', 'name')
      .lean();

    // Attach member count and latest photo
    for (const group of groups) {
      group.memberCount = await GroupMember.countDocuments({ groupId: group._id });
      const latestPhoto = await Photo.findOne({ groupId: group._id, isActive: true })
        .sort({ createdAt: -1 })
        .select('imageUrl thumbnailUrl createdAt')
        .lean();
      group.latestPhoto = latestPhoto || null;
    }

    res.status(200).json({ success: true, groups });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/groups/:id
// @access  Private
exports.getGroupDetails = async (req, res, next) => {
  try {
    const membership = await GroupMember.findOne({ groupId: req.params.id, userId: req.user.id });
    if (!membership) return res.status(403).json({ success: false, message: 'Not a member of this group' });

    const group = await Group.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const members = await GroupMember.find({ groupId: req.params.id })
      .populate('userId', 'name profilePicture email')
      .sort({ role: 1, joinedAt: 1 })
      .lean();
    
    group.members = members;

    res.status(200).json({ success: true, group });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/groups/join
// @access  Private
exports.joinGroupByCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Invite code is required' });

    const upperCode = code.toUpperCase();
    
    // Check group invite code first
    let group = await Group.findOne({ inviteCode: upperCode });
    
    // If not group code, check temp invites
    if (!group) {
      const invite = await Invite.findOne({ code: upperCode });
      if (!invite) return res.status(404).json({ success: false, message: 'Invalid or expired invite code' });
      group = await Group.findById(invite.groupId);
    }

    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const existingMember = await GroupMember.findOne({ groupId: group._id, userId: req.user.id });
    if (existingMember) return res.status(400).json({ success: false, message: 'Already a member of this group' });

    await GroupMember.create({
      groupId: group._id,
      userId: req.user.id,
      role: 'member',
    });

    res.status(200).json({ success: true, group });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/groups/:id/leave
// @access  Private
exports.leaveGroup = async (req, res, next) => {
  try {
    const member = await GroupMember.findOne({ groupId: req.params.id, userId: req.user.id });
    if (!member) return res.status(400).json({ success: false, message: 'You are not a member' });

    if (member.role === 'creator') {
      const otherMembers = await GroupMember.find({ groupId: req.params.id, userId: { $ne: req.user.id } });
      if (otherMembers.length > 0) {
        // Transfer ownership
        otherMembers[0].role = 'creator';
        await otherMembers[0].save();
      } else {
        // Delete group entirely
        await Group.findByIdAndDelete(req.params.id);
        await Photo.deleteMany({ groupId: req.params.id });
      }
    }

    await GroupMember.findByIdAndDelete(member._id);
    res.status(200).json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    next(err);
  }
};
