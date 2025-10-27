const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    uid: { type: String, index: true, required: true },
    wpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    actualAccuracy: { type: Number, required: true },
    durationSec: { type: Number, required: true },
    words: { type: Number, required: true },
    chars: { type: Number, required: true },
    mode: { type: String, default: 'time-60' },
    userSnapshot: {
      displayName: String,
      avatar: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

scoreSchema.index({ wpm: -1, createdAt: -1 });

module.exports = mongoose.model('Score', scoreSchema);
