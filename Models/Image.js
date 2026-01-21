const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    prompt: { type: String, required: true },
    data: { type: String, required: true }, // base64 PNG data
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);