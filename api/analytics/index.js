// GET /api/analytics — leaderboards + XP over time + user stat cards
import db from '../_lib/db.js';
import { withAuth, requireGuild } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireGuild(res, user)) return;

    try {
      const { guild_id } = user;

      // Leaderboard 1: Highest XP
      const leaderboardXp = await db.query(`
        SELECT id, name, role, total_xp, current_level
        FROM users WHERE guild_id = $1
        ORDER BY total_xp DESC
      `, [guild_id]);

      // Leaderboard 2: The Perfectionist — most Flawless (1.2x) reviews
      const leaderboardPerfectionist = await db.query(`
        SELECT u.id, u.name, COUNT(r.id) AS flawless_count
        FROM users u
        LEFT JOIN reviews r ON r.reviewer_id = u.id AND r.quality_multiplier = 1.2 AND r.approved = true
        WHERE u.guild_id = $1
        GROUP BY u.id, u.name
        ORDER BY flawless_count DESC
      `, [guild_id]);

      // Leaderboard 3: The Speedster — tasks verified 24h+ before deadline
      const leaderboardSpeedster = await db.query(`
        SELECT u.id, u.name, COUNT(t.id) AS early_count
        FROM users u
        LEFT JOIN tasks t
          ON t.assigned_to = u.id
          AND t.guild_id = $1
          AND t.status = 'verified'
          AND t.deadline IS NOT NULL
          AND t.updated_at < t.deadline - INTERVAL '24 hours'
        WHERE u.guild_id = $1
        GROUP BY u.id, u.name
        ORDER BY early_count DESC
      `, [guild_id, guild_id]);

      // XP Over Time — from verified tasks
      const xpOverTime = await db.query(`
        SELECT
          u.name,
          DATE(t.updated_at AT TIME ZONE 'UTC') AS date,
          SUM(
            ROUND(
              t.base_xp
              * CASE
                  WHEN t.deadline IS NOT NULL AND t.updated_at < t.deadline - INTERVAL '24 hours' THEN 1.2
                  WHEN t.deadline IS NOT NULL AND t.updated_at > t.deadline THEN 0.7
                  ELSE 1.0
                END
              * COALESCE(
                  (SELECT AVG(r2.quality_multiplier) FROM reviews r2 WHERE r2.task_id = t.id AND r2.approved = true),
                  1.0
                )
            )
          ) AS xp_earned
        FROM tasks t
        JOIN users u ON u.id = t.assigned_to
        WHERE t.status = 'verified' AND t.guild_id = $1
        GROUP BY u.name, DATE(t.updated_at AT TIME ZONE 'UTC')
        ORDER BY date ASC
      `, [guild_id]);

      // Per-user stat cards
      const userStats = await db.query(`
        SELECT
          u.id, u.name, u.role, u.total_xp, u.current_level,
          COUNT(t.id) FILTER (WHERE t.status = 'verified')  AS tasks_completed,
          COUNT(t.id) FILTER (WHERE t.status != 'verified') AS tasks_active
        FROM users u
        LEFT JOIN tasks t ON t.assigned_to = u.id AND t.guild_id = $1
        WHERE u.guild_id = $1
        GROUP BY u.id, u.name, u.role, u.total_xp, u.current_level
        ORDER BY u.total_xp DESC
      `, [guild_id, guild_id]);

      res.json({
        leaderboards: {
          highestLevel:  leaderboardXp.rows,
          perfectionist: leaderboardPerfectionist.rows,
          speedster:     leaderboardSpeedster.rows,
        },
        xpOverTime: xpOverTime.rows,
        userStats:  userStats.rows,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);
