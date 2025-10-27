const mongoose = require('mongoose');

const bestScoreSchema = new mongoose.Schema(
  {
    wpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
  },
  { _id: false }
);

// Aggregates per time slot (and all-time)
const modeAggSchema = new mongoose.Schema(
  {
    count: { type: Number, default: 0 },   // matches in this slot
    sumWpm: { type: Number, default: 0 },  // sum of WPMs
    sumAcc: { type: Number, default: 0 },  // sum of accuracies
    bestWpm: { type: Number, default: 0 }, // highest WPM
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, default: null },
    displayName: { type: String, default: 'Anonymous' },
    avatar: { type: String, default: null },
    bio: { type: String, default: '' },
    birthdate: { type: String, default: '' },
    gender: { type: String, default: '' },

    bestWpm: { type: Number, default: 0 },
    highestAccuracy: { type: Number, default: 0 },

    matchesPlayed: { type: Number, default: 0 },
    testsCount: { type: Number, default: 0 },

    // Per-mode bests used by the current frontend
    bestScores: {
      type: Map,
      of: bestScoreSchema,
      default: () => ({
        '15s': { wpm: 0, accuracy: 0 },
        '30s': { wpm: 0, accuracy: 0 },
        '60s': { wpm: 0, accuracy: 0 },
        '120s': { wpm: 0, accuracy: 0 },
      }),
    },

    // Per-mode aggregates + all-time
    modeAgg: {
      type: Map,
      of: modeAggSchema,
      default: () => ({
        '15s': { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 },
        '30s': { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 },
        '60s': { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 },
        '120s': { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 },
        'all': { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 },
      }),
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ bestWpm: -1 });
userSchema.index({ displayName: 1 });

// Optional indexes for best-based leaderboards
userSchema.index({ 'bestScores.15s.wpm': -1 });
userSchema.index({ 'bestScores.30s.wpm': -1 });
userSchema.index({ 'bestScores.60s.wpm': -1 });
userSchema.index({ 'bestScores.120s.wpm': -1 });

module.exports = mongoose.model('User', userSchema);
