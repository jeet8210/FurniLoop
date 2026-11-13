import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function requireUser(req, res, next) {
  try {
    const token = req.cookies?.furniloop_token || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email role status favorites');
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
    if (user.status !== 'ACTIVE') return res.status(403).json({ message: 'This account is unavailable. Contact FurniLoop support.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Please sign in to continue.' });
  }
}
