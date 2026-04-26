// POST /api/guilds/join — join an existing guild with an invite code
import db from '../_lib/db.js';
import { withAuth } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { invite_code } = req.body;
      const userId = user.id;

      if (!invite_code) {
        return res.status(400).json({ error: 'Invite code is required' });
      }

      if (user.guild_id) {
        return res.status(409).json({ error: 'You already belong to a guild' });
      }

      const guildRes = await db.query(
        `SELECT * FROM guilds WHERE invite_code = $1`,
        [invite_code.toUpperCase().trim()]
      );

      if (guildRes.rows.length === 0) {
        return res.status(404).json({ error: 'Invalid invite code. No guild found.' });
      }

      const guild = guildRes.rows[0];

      await db.query(
        `UPDATE users SET guild_id = $1, role = 'member' WHERE id = $2`,
        [guild.id, userId]
      );

      const updatedUser = await db.query(
        `SELECT id, username, name, role, guild_id, total_xp, current_level FROM users WHERE id = $1`,
        [userId]
      );

      res.json({ guild, user: updatedUser.rows[0] });
    } catch (error) {
      console.error('Error joining guild:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);
