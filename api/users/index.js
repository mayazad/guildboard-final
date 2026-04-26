// GET /api/users — all members in the caller's guild (for assignee dropdowns)
import db from '../_lib/db.js';
import { withAuth } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const result = await db.query(
        `SELECT id, name, username, role, total_xp, current_level
         FROM users WHERE guild_id = $1 ORDER BY role DESC, name ASC`,
        [user.guild_id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);
