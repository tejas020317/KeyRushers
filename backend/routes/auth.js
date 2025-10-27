// server/middleware/auth.js
const admin = require('../config/firebaseAdmin');

module.exports = async function verifyFirebaseAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const [, token] = auth.split(' ');
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
      picture: decoded.picture || null,
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
