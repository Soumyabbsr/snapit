const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: '',
    trim: true,
    maxlength: 150
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, enum: ['❤️','😂','😮','🔥','💛','👏'] },
    reactedAt: { type: Date, default: Date.now }
  }],
  seenBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seenAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

photoSchema.index({ groupId: 1, createdAt: -1 });
photoSchema.index({ uploadedBy: 1 });
photoSchema.index({ isActive: 1 });

module.exports = mongoose.model('Photo', photoSchema);
