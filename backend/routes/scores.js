const router = require('express').Router();
const z = require('zod');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Score = require('../models/Score');

// Validate incoming score
const scoreSchema = z.object({
  wpm: z.number().min(0).max(500),
  accuracy: z.number().min(0).max(100),
  actualAccuracy: z.number().min(0).max(100),
  durationSec: z.number().int().refine((v) => [15, 30, 60, 120].includes(v), {
    message: 'Duration must be one of 15, 30, 60, 120',
  }),
  words: z.number().int().min(1).max(5000),
  chars: z.number().int().min(1).max(200000),
  mode: z.string().optional(),
});

// Submit a score
router.post('/', auth, async (req, res) => {
  const parsed = scoreSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid score', details: parsed.error.issues });
  }

  const { uid, email, name, picture } = req.user;
  const p = parsed.data;
  const modeKey = `${p.durationSec}s`;

  // Softer plausibility during development
  const plausibleWpm = Math.round((p.chars / 5 / p.durationSec) * 60 * 1.5);
  if (p.wpm > 500 || p.wpm > plausibleWpm) {
    console.warn('Suspicious WPM, accepting for testing:', { wpm: p.wpm, plausibleWpm, uid, modeKey });
  }

  try {
    // Ensure user exists or create
    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({
        uid,
        email: email || null,
        displayName: name || 'Anonymous',
        avatar: picture || null,
      });
    } else {
      // Only sync email if provider email exists and user email is missing
      if (email && !user.email) {
        user.email = email;
      }
    }

    // Save raw score with current user snapshot
    const score = await Score.create({
      uid,
      wpm: p.wpm,
      accuracy: p.accuracy,
      actualAccuracy: p.actualAccuracy,
      durationSec: p.durationSec,
      words: p.words,
      chars: p.chars,
      mode: p.mode || `time-${p.durationSec}`,
      userSnapshot: {
        displayName: user.displayName,
        avatar: user.avatar,
      },
    });

    // Update global bests
    if (p.wpm > (user.bestWpm || 0)) user.bestWpm = p.wpm;
    if (p.accuracy > (user.highestAccuracy || 0)) user.highestAccuracy = p.accuracy;

    // Update per-mode best with accuracy tie-break
    const currentModeBest = user.bestScores.get(modeKey) || { wpm: 0, accuracy: 0 };
    const isBetter =
      p.wpm > (currentModeBest.wpm || 0) ||
      (p.wpm === (currentModeBest.wpm || 0) && p.accuracy > (currentModeBest.accuracy || 0));

    if (isBetter) {
      user.bestScores.set(modeKey, { wpm: p.wpm, accuracy: p.accuracy });
    }

    // Maintain per-mode aggregates (+ all-time)
    user.modeAgg = user.modeAgg || new Map();
    const modeAgg = user.modeAgg;

    const getAgg = (key) => {
      return (modeAgg instanceof Map ? modeAgg.get(key) : modeAgg[key]) || {
        count: 0,
        sumWpm: 0,
        sumAcc: 0,
        bestWpm: 0,
      };
    };

    const setAgg = (key, agg) => {
      if (modeAgg instanceof Map) modeAgg.set(key, agg);
      else modeAgg[key] = agg;
    };

    const bump = (key, wpm, acc) => {
      const agg = getAgg(key);
      agg.count = (agg.count || 0) + 1;
      agg.sumWpm = (agg.sumWpm || 0) + wpm;
      agg.sumAcc = (agg.sumAcc || 0) + acc;
      agg.bestWpm = Math.max(agg.bestWpm || 0, wpm);
      setAgg(key, agg);
    };

    // Apply to the specific time slot and to 'all'
    bump(modeKey, p.wpm, p.accuracy);
    bump('all', p.wpm, p.accuracy);

    user.modeAgg = modeAgg;

    // Increment counters
    user.matchesPlayed = (user.matchesPlayed || 0) + 1;
    user.testsCount = (user.testsCount || 0) + 1;

    await user.save();

    return res.status(201).json({
      message: 'Score submitted',
      id: score._id.toString(),
      wpm: p.wpm,
      accuracy: p.accuracy,
      durationSec: p.durationSec,
      mode: modeKey,
    });
  } catch (e) {
    console.error('POST /api/scores error:', e);
    return res.status(500).json({ error: 'Failed to save score' });
  }
});

// Leaderboard: top 100 by WPM (per mode or all)
router.get('/leaderboard', async (req, res) => {
  const mode = (req.query.mode || 'all').trim();
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 100);

  try {
    if (mode === 'all') {
      const users = await User.find({ bestWpm: { $gt: 0 } })
        .sort({ bestWpm: -1, highestAccuracy: -1 })
        .limit(limit)
        .select('uid displayName avatar bestWpm highestAccuracy modeAgg')
        .lean();

      const leaderboard = users.map((u, i) => {
        const rawAgg = u.modeAgg || {};
        const aggMap = rawAgg instanceof Map ? rawAgg : new Map(Object.entries(rawAgg));
        const allBucket = aggMap.get('all') || { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 };
        const count = allBucket.count || 0;
        const avgWpm = count ? Math.round(allBucket.sumWpm / count) : 0;
        const avgAccuracy = count ? Math.round(allBucket.sumAcc / count) : 0;

        return {
          rank: i + 1,
          userId: u.uid,
          displayName: u.displayName,
          avatar: u.avatar,
          wpm: allBucket.bestWpm || u.bestWpm,
          avgWpm,
          avgAccuracy,
          matchesPlayed: count,
        };
      });

      return res.json(leaderboard);
    }

    if (!['15s', '30s', '60s', '120s'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const users = await User.find()
      .select('uid displayName avatar bestScores modeAgg')
      .lean();

    const filtered = users
      .map((u) => {
        const bs = u.bestScores || {};
        const best = (bs instanceof Map ? bs.get(mode) : bs[mode]) || { wpm: 0, accuracy: 0 };

        const rawAgg = u.modeAgg || {};
        const aggMap = rawAgg instanceof Map ? rawAgg : new Map(Object.entries(rawAgg));
        const bucket = aggMap.get(mode) || { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 };

        const count = bucket.count || 0;
        const avgWpm = count ? Math.round(bucket.sumWpm / count) : 0;
        const avgAccuracy = count ? Math.round(bucket.sumAcc / count) : 0;

        return {
          uid: u.uid,
          displayName: u.displayName,
          avatar: u.avatar,
          highestWpm: bucket.bestWpm || best.wpm || 0,
          tieAcc: best.accuracy || 0,
          avgWpm,
          avgAccuracy,
          matches: count,
        };
      })
      .filter((u) => u.highestWpm > 0)
      .sort((a, b) => {
        if (b.highestWpm !== a.highestWpm) return b.highestWpm - a.highestWpm;
        if (b.tieAcc !== a.tieAcc) return b.tieAcc - a.tieAcc;
        return (b.matches || 0) - (a.matches || 0);
      })
      .slice(0, limit);

    const leaderboard = filtered.map((u, i) => ({
      rank: i + 1,
      userId: u.uid,
      displayName: u.displayName,
      avatar: u.avatar,
      wpm: u.highestWpm,
      avgWpm: u.avgWpm,
      avgAccuracy: u.avgAccuracy,
      matchesPlayed: u.matches,
    }));

    return res.json(leaderboard);
  } catch (e) {
    console.error('GET /api/scores/leaderboard error:', e);
    return res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// Stats: average and highest WPM per mode or all
router.get('/stats', async (req, res) => {
  const mode = (req.query.mode || 'all').trim();

  try {
    if (mode === 'all') {
      const users = await User.find({ bestWpm: { $gt: 0 } })
        .select('bestWpm highestAccuracy')
        .lean();

      const w = users.map((u) => u.bestWpm).filter((n) => n > 0);
      const avgWpm = w.length ? Math.round(w.reduce((a, b) => a + b, 0) / w.length) : 0;
      const highestWpm = w.length ? Math.max(...w) : 0;

      const a = users.map((u) => u.highestAccuracy).filter((n) => n > 0);
      const avgAccuracy = a.length
        ? Math.round(a.reduce((x, y) => x + y, 0) / a.length)
        : 0;

      return res.json({ avgWpm, highestWpm, avgAccuracy });
    }

    if (!['15s', '30s', '60s', '120s'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const users = await User.find().select('modeAgg bestScores').lean();

    let haveAgg = false;
    let totalAvgWpm = 0;
    let totalAvgAcc = 0;
    let contributors = 0;
    let highestWpm = 0;

    users.forEach((u) => {
      const agg = u.modeAgg?.[mode] || (u.modeAgg instanceof Map ? u.modeAgg.get(mode) : null);
      if (agg && agg.count > 0) {
        haveAgg = true;
        totalAvgWpm += agg.sumWpm / agg.count;
        totalAvgAcc += agg.sumAcc / agg.count;
        highestWpm = Math.max(highestWpm, agg.bestWpm || 0);
        contributors += 1;
      }
    });

    if (haveAgg) {
      const avgWpm = contributors ? Math.round(totalAvgWpm / contributors) : 0;
      const avgAccuracy = contributors ? Math.round(totalAvgAcc / contributors) : 0;
      return res.json({ avgWpm, highestWpm, avgAccuracy });
    }

    // Fallback: average of bests
    const vals = [];
    const accs = [];
    users.forEach((u) => {
      const bs = u.bestScores || {};
      const entry =
        (bs instanceof Map ? bs.get(mode) : bs[mode]) || { wpm: 0, accuracy: 0 };
      if (entry.wpm > 0) vals.push(entry.wpm);
      if (entry.accuracy > 0) accs.push(entry.accuracy);
    });

    const avgWpm = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const highest = vals.length ? Math.max(...vals) : 0;
    const avgAccuracy = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0;

    return res.json({ avgWpm, highestWpm: highest, avgAccuracy });
  } catch (e) {
    console.error('GET /api/scores/stats error:', e);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Current user rank for mode or all
router.get('/user-rank', auth, async (req, res) => {
  const mode = (req.query.mode || 'all').trim();
  const { uid } = req.user;

  try {
    const user = await User.findOne({ uid })
      .select('uid displayName avatar bestWpm highestAccuracy matchesPlayed bestScores modeAgg')
      .lean();

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (mode === 'all') {
      const w = user.bestWpm || 0;
      const a = user.highestAccuracy || 0;

      const rawAgg = user.modeAgg || {};
      const aggMap = rawAgg instanceof Map ? rawAgg : new Map(Object.entries(rawAgg));
      const allBucket = aggMap.get('all') || { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 };
      const count = allBucket.count || 0;
      const avgWpm = count ? Math.round(allBucket.sumWpm / count) : 0;
      const avgAccuracy = count ? Math.round(allBucket.sumAcc / count) : 0;

      const above = await User.countDocuments({
        $or: [{ bestWpm: { $gt: w } }, { bestWpm: w, highestAccuracy: { $gt: a } }],
      });

      return res.json({
        rank: above + 1,
        wpm: allBucket.bestWpm || w,
        accuracy: a,
        matches: count,
        avgWpm,
        avgAccuracy,
        displayName: user.displayName,
        avatar: user.avatar,
      });
    }

    if (!['15s', '30s', '60s', '120s'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const bs = user.bestScores || {};
    const entry = (bs instanceof Map ? bs.get(mode) : bs[mode]) || { wpm: 0, accuracy: 0 };
    const w = entry.wpm || 0;
    const a = entry.accuracy || 0;

    const rawAgg = user.modeAgg || {};
    const aggMap = rawAgg instanceof Map ? rawAgg : new Map(Object.entries(rawAgg));
    const bucket = aggMap.get(mode) || { count: 0, sumWpm: 0, sumAcc: 0, bestWpm: 0 };
    const count = bucket.count || 0;
    const avgWpm = count ? Math.round(bucket.sumWpm / count) : 0;
    const avgAccuracy = count ? Math.round(bucket.sumAcc / count) : 0;

    const users = await User.find().select('bestScores').lean();

    let above = 0;
    users.forEach((u) => {
      const m =
        (u.bestScores instanceof Map ? u.bestScores.get(mode) : u.bestScores?.[mode]) ||
        { wpm: 0, accuracy: 0 };
      if (m.wpm > w) above += 1;
      else if (m.wpm === w && (m.accuracy || 0) > (a || 0)) above += 1;
    });

    return res.json({
      rank: above + 1,
      wpm: bucket.bestWpm || w,
      accuracy: a,
      matches: count,
      avgWpm,
      avgAccuracy,
      displayName: user.displayName,
      avatar: user.avatar,
    });
  } catch (e) {
    console.error('GET /api/scores/user-rank error:', e);
    return res.status(500).json({ error: 'Failed to load rank' });
  }
});

module.exports = router;
