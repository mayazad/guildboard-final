// GET /api/users/me — basic profile (used by DashboardLayout HUD)
import db from '../_lib/db.js';
import { withAuth } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const result = await db.query(
        `SELECT id, name, username, role, guild_id, total_xp, current_level FROM users WHERE id = $1`,
        [user.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);
