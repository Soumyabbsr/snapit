const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40
  },
  emoji: {
    type: String,
    default: '💛',
    maxlength: 2
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  inviteCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  photoCount: {
    type: Number,
    default: 0
  },
  lastPhotoAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPartnerGroup: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ createdBy: 1 });

groupSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
