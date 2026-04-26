// JWT auth helper — replaces Express middleware for Vercel serverless functions
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Wraps a Vercel function handler with JWT authentication.
 * Fetches a fresh user row so guild_id and role are always current.
 *
 * Usage:
 *   export default withAuth(async (req, res, user) => { ... });
 */
export function withAuth(handler) {
  return async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Always fetch fresh — captures guild_id and role changes immediately
      const result = await db.query(
        'SELECT id, username, name, role, guild_id, total_xp, current_level FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      return handler(req, res, result.rows[0]);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };
}

/**
 * requireGuild — pass as a guard after withAuth resolves.
 * Usage: if (!requireGuild(res, user)) return;
 */
export function requireGuild(res, user) {
  if (!user.guild_id) {
    res.status(403).json({ error: 'You must create or join a guild first.' });
    return false;
  }
  return true;
}

export function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}
