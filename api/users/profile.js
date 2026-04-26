// GET /api/users/profile — rich profile with stats, guild info, rank
import db from '../_lib/db.js';
import { withAuth } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { id: userId, guild_id } = user;

      // Basic user info
      const userRes = await db.query(
        `SELECT id, name, username, role, guild_id, total_xp, current_level, created_at
         FROM users WHERE id = $1`,
        [userId]
      );
      const userRow = userRes.rows[0];
      if (!userRow) return res.status(404).json({ error: 'User not found' });

      // Guild info
      let guild = null;
      let inviteCode = null;
      if (guild_id) {
        const guildRes = await db.query(`SELECT * FROM guilds WHERE id = $1`, [guild_id]);
        guild = guildRes.rows[0];
        if (userRow.role === 'leader') inviteCode = guild?.invite_code;

        const memberCountRes = await db.query(
          `SELECT COUNT(*) AS cnt FROM users WHERE guild_id = $1`, [guild_id]
        );
        guild.member_count = parseInt(memberCountRes.rows[0].cnt, 10);
      }

      // Task stats
      const taskStatsRes = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'verified')                          AS tasks_completed,
          COUNT(*) FILTER (WHERE status NOT IN ('verified'))                    AS tasks_active,
          COUNT(*) FILTER (WHERE status = 'verified' AND deadline IS NOT NULL
                           AND updated_at < deadline - INTERVAL '24 hours')    AS early_completions
        FROM tasks WHERE assigned_to = $1
      `, [userId]);
      const taskStats = taskStatsRes.rows[0];

      // Review stats
      const reviewStatsRes = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE approved = true)                              AS reviews_given,
          COUNT(*) FILTER (WHERE approved = true AND quality_multiplier = 1.2) AS flawless_given
        FROM reviews WHERE reviewer_id = $1
      `, [userId]);
      const reviewStats = reviewStatsRes.rows[0];

      // Guild rank (by XP)
      let rank = null;
      if (guild_id) {
        const rankRes = await db.query(`
          SELECT COUNT(*) + 1 AS rank
          FROM users
          WHERE guild_id = $1 AND total_xp > $2
        `, [guild_id, userRow.total_xp]);
        rank = parseInt(rankRes.rows[0].rank, 10);
      }

      res.json({
        ...userRow,
        guild,
        invite_code:       inviteCode,
        rank,
        tasks_completed:   parseInt(taskStats.tasks_completed, 10),
        tasks_active:      parseInt(taskStats.tasks_active, 10),
        early_completions: parseInt(taskStats.early_completions, 10),
        reviews_given:     parseInt(reviewStats.reviews_given, 10),
        flawless_given:    parseInt(reviewStats.flawless_given, 10),
      });
    } catch (error) {
      console.error('Error fetching full profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);
