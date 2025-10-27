// backend/routes/me.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyFirebaseAuth = require('../middleware/auth');

// Helper: strict date validation YYYY-MM-DD
function isValidDate(dateString) {
  if (dateString === undefined || dateString === null || dateString === '') return true; // [web:22]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false; // [web:22]
  const date = new Date(dateString); // [web:22]
  if (Number.isNaN(date.getTime())) return false; // [web:22]
  // Ensure components match to avoid 2023-02-31 normalizing
  const [y, m, d] = dateString.split('-').map(Number); // [web:22]
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() + 1 === m &&
    date.getUTCDate() === d
  ); // [web:22]
}

// Helper: compute byte length for avatar strings
function getByteLength(str) {
  return Buffer.byteLength(str || '', 'utf8'); // [web:63]
}

// Helper: get base64 payload length in bytes (data:image/...;base64,<payload>)
function getBase64PayloadBytes(dataUri) {
  const idx = dataUri.indexOf('base64,'); // [web:100]
  if (idx === -1) return getByteLength(dataUri); // [web:100]
  const b64 = dataUri.slice(idx + 7); // [web:100]
  // Base64 decoded size approximate: (len * 3) / 4 minus padding
  // Safer: compute using formula without decoding whole payload
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0); // [web:90][web:100]
}

// GET /api/me - Get current user profile (create if missing)
router.get('/', verifyFirebaseAuth, async (req, res) => {
  try {
    // req.user assumed from middleware: { uid, email, name, picture }
    let user = await User.findOne({ uid: req.user.uid }); // [web:22]

    if (!user) {
      user = new User({
        uid: req.user.uid,
        email: req.user.email || null,
        displayName: (req.user.name || 'Anonymous').trim().slice(0, 50),
        avatar: req.user.picture || null,
      }); // [web:22]
      await user.save(); // [web:22]
    }

    res.json({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      birthdate: user.birthdate,
      gender: user.gender,
      bestWpm: user.bestWpm,
      testsCount: user.testsCount,
      createdAt: user.createdAt,
    }); // [web:22]
  } catch (err) {
    console.error('GET /api/me error:', err); // [web:22]
    res.status(500).json({ error: 'Failed to fetch profile' }); // [web:22]
  }
});

// PATCH /api/me - Update user profile (no upsert)
router.patch('/', verifyFirebaseAuth, async (req, res) => {
  try {
    const { displayName, bio, birthdate, gender, avatar } = req.body; // [web:22]
    const updates = {}; // [web:22]

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.trim().length > 50) {
        return res.status(400).json({ error: 'Invalid display name (1-50 characters)' });
      } // [web:22]
      updates.displayName = displayName.trim(); // [web:22]
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 500) {
        return res.status(400).json({ error: 'Bio too long (max 500 characters)' });
      } // [web:22]
      updates.bio = bio.trim(); // [web:22]
    }

    if (birthdate !== undefined) {
      if (birthdate && !isValidDate(birthdate)) {
        return res.status(400).json({ error: 'Invalid birthdate format (expected YYYY-MM-DD)' });
      } // [web:22]
      updates.birthdate = birthdate || null; // [web:22]
    }

    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'non-binary', 'other', '', null]; // [web:22]
      if (!validGenders.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender value' });
      } // [web:22]
      updates.gender = gender || null; // [web:22]
    }

    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Invalid avatar format' });
      } // [web:22]
      if (typeof avatar === 'string' && avatar.length > 0) {
        // Accept HTTPS URLs or data URIs
        const isUrl = avatar.startsWith('http://') || avatar.startsWith('https://'); // [web:22]
        const isDataUri = avatar.startsWith('data:image/'); // [web:19]
        if (!isUrl && !isDataUri) {
          return res.status(400).json({ error: 'Invalid avatar format (must be https URL or data:image/* base64)' });
        } // [web:22]

        // Enforce 2MB limit by bytes, not characters
        const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
        const sizeBytes = isDataUri ? getBase64PayloadBytes(avatar) : getByteLength(avatar);
        if (sizeBytes > MAX_BYTES) {
          return res.status(400).json({
            error: 'Avatar too large (max 5MB). Please use a smaller image or choose a preset avatar.',
          });
        }
      }
      updates.avatar = avatar || null; // [web:22]
    }

    // Require an existing user; don’t upsert via PATCH
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    ); // [web:22]

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } // [web:22]

    res.json({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      birthdate: user.birthdate,
      gender: user.gender,
      bestWpm: user.bestWpm,
      testsCount: user.testsCount,
    }); // [web:22]
  } catch (err) {
    console.error('PATCH /api/me error:', err); // [web:22]
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: err.message || 'Validation failed.',
      }); // [web:22]
    }
    res.status(500).json({ error: 'Failed to update profile' }); // [web:22]
  }
});

module.exports = router; // [web:22]
