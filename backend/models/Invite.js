const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['partner', 'group'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'used', 'expired'],
    default: 'pending'
  }
}, {
  timestamps: true
});

inviteSchema.index({ createdBy: 1 });
inviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
