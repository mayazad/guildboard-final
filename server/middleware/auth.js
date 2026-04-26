const jwt = require('jsonwebtoken');
const db  = require('../db');

/**
 * Middleware: authenticate JWT and attach a FRESH user record from the DB.
 * This ensures guild_id and role are always up-to-date without issuing new tokens.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Always fetch fresh user data — captures guild_id and role changes immediately
    const result = await db.query(
      'SELECT id, username, name, role, guild_id, total_xp, current_level FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware: require the user to already belong to a guild.
 * Use on any route that needs guild-scoped data.
 */
const requireGuild = (req, res, next) => {
  if (!req.user.guild_id) {
    return res.status(403).json({ error: 'You must create or join a guild first.' });
  }
  next();
};

module.exports = { authenticateToken, requireGuild };
