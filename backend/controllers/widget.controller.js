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
    if (!groupId) return res.status(400).json({ success: false, message: 'Group ID is required' });

    // Verify membership
    const membership = await GroupMember.findOne({ groupId, userId: req.user.id });
    if (!membership) return res.status(403).json({ success: false, message: 'Access denied to this group' });

    // Find latest photo
    const latestPhoto = await Photo.findOne({ groupId, isActive: true }).sort({ createdAt: -1 });

    // Create or update widget mapping
    const widget = await Widget.findOneAndUpdate(
      { userId: req.user.id, groupId },
      { size, currentPhotoId: latestPhoto ? latestPhoto._id : null, refreshedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, widget });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/widgets/data/:groupId
 * @desc    Get latest data for a specific group widget
 * @access  Private
 */
exports.getWidgetData = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const widget = await Widget.findOne({ userId: req.user.id, groupId })
      .populate('groupId', 'name emoji icon')
      .populate({
        path: 'currentPhotoId',
        select: 'imageUrl thumbnailUrl caption uploadedBy createdAt',
        populate: { path: 'uploadedBy', select: 'name avatar avatarPublicId' }
      });

    if (!widget) {
      // If no widget record, try to return basic group data
      const group = await Group.findById(groupId).select('name emoji icon');
      return res.status(200).json({ 
        success: true, 
        message: 'Widget record not found, showing basic data',
        group,
        photo: null 
      });
    }

    res.status(200).json({ 
      success: true, 
      group: widget.groupId, 
      photo: widget.currentPhotoId, 
      refreshedAt: widget.refreshedAt 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/widgets
 * @desc    Get all widgets configured by the user
 * @access  Private
 */
exports.getUserWidgets = async (req, res, next) => {
  try {
    const widgets = await Widget.find({ userId: req.user.id })
      .populate('groupId', 'name emoji icon')
      .populate({
        path: 'currentPhotoId',
        select: 'imageUrl thumbnailUrl caption uploadedBy',
        populate: { path: 'uploadedBy', select: 'name avatar avatarPublicId' }
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
    const widget = await Widget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });

    res.status(200).json({ success: true, message: 'Widget removed' });
  } catch (err) {
    next(err);
  }
};
