const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String },
    provider: { type: String, enum: ['local', 'google', 'facebook', 'linkedin', 'github'], default: 'local' },
    googleId: { type: String, index: true },
    facebookId: { type: String, index: true },
    linkedinId: { type: String, index: true },
    githubId: { type: String, index: true },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);