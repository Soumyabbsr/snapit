const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  currentPhotoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    default: null
  },
  refreshedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

widgetSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = mongoose.model('Widget', widgetSchema);
