const admin = require('../config/firebaseAdmin');

module.exports = async function verifyFirebaseAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing token' });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
      picture: decoded.picture || null,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
