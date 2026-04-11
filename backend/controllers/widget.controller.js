const mongoose = require('mongoose');
const Widget = require('../models/Widget');
const Group = require('../models/Group');
const Photo = require('../models/Photo');
const GroupMember = require('../models/GroupMember');

/**
 * @route   POST /api/widgets
 * @desc    Initialize or update a widget instance for a group
 * @access  Private
 */
exports.registerWidget = async (req, res, next) => {
  try {
    const { groupId, size = 'medium' } = req.body;
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid ID format' },
      });
    }

    const membership = await GroupMember.findOne({ groupId, userId: req.user._id });
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_MEMBER', message: 'You are not a member of this group' },
      });
    }

    const widget = await Widget.findOneAndUpdate(
      { userId: req.user._id, groupId },
      { size, refreshedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const latestOtherPhoto = await Photo.findOne({
      groupId,
      uploadedBy: { $ne: req.user._id },
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name');

    if (latestOtherPhoto) {
      widget.currentPhotoId = latestOtherPhoto._id;
      widget.currentPhotoUrl = latestOtherPhoto.imageUrl;
      widget.currentPhotoUploader = latestOtherPhoto.uploadedBy?.name || '';
      widget.currentPhotoUploadedAt = latestOtherPhoto.createdAt;
      await widget.save();
    }

    res.status(200).json({ success: true, widget });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/widgets/groups
 * @desc    Groups the user belongs to (for widget picker)
 * @access  Private
 */
exports.getWidgetGroups = async (req, res) => {
  try {
    const memberships = await GroupMember.find({ userId: req.user._id }).select('groupId').lean();
    if (!memberships.length) {
      return res.json({ success: true, data: { groups: [] } });
    }

    const groupIds = memberships.map((m) => m.groupId);
    const groups = await Group.find({ _id: { $in: groupIds }, isActive: true })
      .select('_id name emoji photoCount lastPhotoAt')
      .lean();

    const result = await Promise.all(
      groups.map(async (g) => {
        const memberCount = await GroupMember.countDocuments({ groupId: g._id });
        return {
          _id: g._id,
          name: g.name,
          emoji: g.emoji || '💛',
          memberCount,
          photoCount: g.photoCount ?? 0,
          lastPhotoAt: g.lastPhotoAt ?? null,
        };
      })
    );

    return res.json({ success: true, data: { groups: result } });
  } catch (err) {
    console.error('getWidgetGroups:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_GROUPS_FAILED', message: 'Failed to load groups' },
    });
  }
};

/**
 * @route   GET /api/widgets/data/:groupId
 * @desc    Widget display payload (latest photo from another member)
 * @access  Private
 */
exports.getWidgetData = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({ _id: groupId, isActive: true }).select('name emoji').lean();
    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' },
      });
    }

    const membership = await GroupMember.findOne({ groupId, userId: req.user._id });
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_MEMBER', message: 'You are not a member of this group' },
      });
    }

    const widget = await Widget.findOne({ userId: req.user._id, groupId });
    if (!widget) {
      return res.status(404).json({
        success: false,
        error: { code: 'WIDGET_NOT_FOUND', message: 'Widget not set up for this group' },
      });
    }

    const latestOtherPhoto = await Photo.findOne({
      groupId,
      uploadedBy: { $ne: req.user._id },
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name avatar')
      .lean();

    if (!latestOtherPhoto) {
      return res.json({
        success: true,
        data: {
          hasPhoto: false,
          group: { name: group.name, emoji: group.emoji },
          message: 'Waiting for your friend to share a photo',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        hasPhoto: true,
        photo: {
          _id: latestOtherPhoto._id,
          url: latestOtherPhoto.imageUrl,
          thumbnailUrl: latestOtherPhoto.thumbnailUrl,
          uploaderName: latestOtherPhoto.uploadedBy?.name,
          uploaderAvatar: latestOtherPhoto.uploadedBy?.avatar,
          caption: latestOtherPhoto.caption,
          uploadedAt: latestOtherPhoto.createdAt,
        },
        group: { name: group.name, emoji: group.emoji },
        refreshedAt: widget.refreshedAt,
      },
    });
  } catch (err) {
    console.error('getWidgetData:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'WIDGET_DATA_FAILED', message: 'Failed to load widget data' },
    });
  }
};

/**
 * @route   POST /api/widgets/refresh/:groupId
 * @desc    Refresh widget snapshot from latest other member photo
 * @access  Private
 */
exports.refreshWidget = async (req, res) => {
  try {
    const { groupId } = req.params;

    const widget = await Widget.findOne({ userId: req.user._id, groupId });
    if (!widget) {
      return res.status(404).json({
        success: false,
        error: { code: 'WIDGET_NOT_FOUND', message: 'Widget not found' },
      });
    }

    const latestOtherPhoto = await Photo.findOne({
      groupId,
      uploadedBy: { $ne: req.user._id },
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name');

    if (latestOtherPhoto) {
      widget.currentPhotoId = latestOtherPhoto._id;
      widget.currentPhotoUrl = latestOtherPhoto.imageUrl;
      widget.currentPhotoUploader = latestOtherPhoto.uploadedBy?.name;
      widget.currentPhotoUploadedAt = latestOtherPhoto.createdAt;
      widget.refreshedAt = new Date();
      await widget.save();
    }

    return res.json({ success: true, data: { widget } });
  } catch (err) {
    console.error('refreshWidget:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'WIDGET_DATA_FAILED', message: 'Failed to load widget data' },
    });
  }
};

/**
 * @route   GET /api/widgets
 * @desc    Get all widgets configured by the user
 * @access  Private
 */
exports.getUserWidgets = async (req, res, next) => {
  try {
    const widgets = await Widget.find({ userId: req.user._id })
      .populate('groupId', 'name emoji icon')
      .populate({
        path: 'currentPhotoId',
        select: 'imageUrl thumbnailUrl caption uploadedBy',
        populate: { path: 'uploadedBy', select: 'name avatar avatarPublicId' },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, widgets });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/widgets/:id
 * @desc    Remove a widget configuration
 * @access  Private
 */
exports.deleteWidget = async (req, res, next) => {
  try {
    const widget = await Widget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });

    res.status(200).json({ success: true, message: 'Widget removed' });
  } catch (err) {
    next(err);
  }
};
