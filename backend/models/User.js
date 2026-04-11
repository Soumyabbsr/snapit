const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  avatarPublicId: {
    type: String,
    default: null
  },
  inviteCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  partners: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    connectedAt: { type: Date, default: Date.now }
  }],
  groupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  refreshToken: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('profilePicture').get(function() {
  if (!this.avatar) return null;
  return {
    url: this.avatar,
    publicId: this.avatarPublicId
  };
});

userSchema.pre('save', async function(next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


// ─── Instance Methods ──────────────────────────────────────

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.avatar ? { url: this.avatar, publicId: this.avatarPublicId } : null,
    inviteCode: this.inviteCode,
    isActive: this.isActive,
    groupIds: this.groupIds
  };
};

module.exports = mongoose.model('User', userSchema);
