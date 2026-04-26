// GET /api/guilds/me — alias kept for backwards compatibility with frontend calls
// Delegates to /api/guilds (GET)
import db from '../_lib/db.js';
import { withAuth } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { guild_id, role } = user;

      if (!guild_id) {
        return res.status(404).json({ error: 'You are not in a guild' });
      }

      const guildRes   = await db.query(`SELECT * FROM guilds WHERE id = $1`, [guild_id]);
      const guild      = guildRes.rows[0];
      const membersRes = await db.query(
        `SELECT id, name, username, role, total_xp, current_level
         FROM users WHERE guild_id = $1 ORDER BY role DESC, total_xp DESC`,
        [guild_id]
      );

      res.json({
        guild: {
          ...guild,
          invite_code: role === 'leader' ? guild.invite_code : undefined,
        },
        members: membersRes.rows,
      });
    } catch (error) {
      console.error('Error fetching guild:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);
