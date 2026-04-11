const DeviceToken = require('../models/DeviceToken');

exports.registerToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    // Update if it already exists, or insert new
    await DeviceToken.findOneAndUpdate(
      { userId: req.user.id, token },
      { userId: req.user.id, token, platform: platform || 'android' },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Device token registered successfully' });
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({ success: false, message: 'Server error registering token' });
  }
};
