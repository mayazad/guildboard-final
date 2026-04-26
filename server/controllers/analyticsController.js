const db = require('../db');

const getAnalytics = async (req, res) => {
  try {
    const { guild_id } = req.user;

    // Leaderboard 1: Highest XP in this guild
    const leaderboardXp = await db.query(`
      SELECT id, name, role, total_xp, current_level
      FROM users WHERE guild_id = $1
      ORDER BY total_xp DESC
    `, [guild_id]);

    // Leaderboard 2: The Perfectionist — most Flawless (1.2x) reviews in this guild
    const leaderboardPerfectionist = await db.query(`
      SELECT u.id, u.name, COUNT(r.id) AS flawless_count
      FROM users u
      LEFT JOIN reviews r ON r.reviewer_id = u.id AND r.quality_multiplier = 1.2 AND r.approved = true
      WHERE u.guild_id = $1
      GROUP BY u.id, u.name
      ORDER BY flawless_count DESC
    `, [guild_id]);

    // Leaderboard 3: The Speedster — tasks verified 24h+ before deadline in this guild
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
    `, [guild_id]);

    // XP Over Time — approximate from verified tasks in this guild
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

    // Per-user stat cards in this guild
    const userStats = await db.query(`
      SELECT
        u.id, u.name, u.role, u.total_xp, u.current_level,
        COUNT(t.id) FILTER (WHERE t.status = 'verified')      AS tasks_completed,
        COUNT(t.id) FILTER (WHERE t.status != 'verified')     AS tasks_active
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id AND t.guild_id = $1
      WHERE u.guild_id = $1
      GROUP BY u.id, u.name, u.role, u.total_xp, u.current_level
      ORDER BY u.total_xp DESC
    `, [guild_id]);

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
};

const getMonthlyAnalytics = async (req, res) => {
  try {
    const { guild_id } = req.user;
    const now   = new Date();
    const year  = parseInt(req.query.year  || now.getFullYear(),  10);
    const month = parseInt(req.query.month || now.getMonth() + 1, 10);

    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    // first day of next month
    const endDate   = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2,'0')}-01`;

    // Per-member stats for this month
    const result = await db.query(`
      SELECT
        u.id,
        u.name,
        u.role,
        -- Quests assigned to this member that were created this month
        COUNT(DISTINCT t_assigned.id)                          AS quests_assigned,
        -- Quests this member verified (completed) this month
        COUNT(DISTINCT t_done.id)                              AS quests_completed,
        -- XP earned from quests verified this month
        COALESCE(SUM(
          CASE WHEN t_done.id IS NOT NULL THEN
            ROUND(
              t_done.base_xp
              * CASE
                  WHEN t_done.deadline IS NOT NULL AND t_done.updated_at < t_done.deadline - INTERVAL '24 hours' THEN 1.2
                  WHEN t_done.deadline IS NOT NULL AND t_done.updated_at > t_done.deadline THEN 0.7
                  ELSE 1.0
                END
              * COALESCE(
                  (SELECT AVG(r2.quality_multiplier) FROM reviews r2
                   WHERE r2.task_id = t_done.id AND r2.approved = true),
                  1.0
                )
            )
          END
        ), 0)                                                 AS xp_earned,
        -- Early completions this month
        COUNT(DISTINCT t_done.id) FILTER (
          WHERE t_done.deadline IS NOT NULL
            AND t_done.updated_at < t_done.deadline - INTERVAL '24 hours'
        )                                                      AS early_count,
        -- Flawless reviews GIVEN this month
        COUNT(DISTINCT rv.id) FILTER (
          WHERE rv.quality_multiplier = 1.2 AND rv.approved = true
            AND rv.created_at >= $2 AND rv.created_at < $3
        )                                                      AS flawless_given
      FROM users u
      -- All tasks assigned to this user, created this month
      LEFT JOIN tasks t_assigned
        ON t_assigned.assigned_to = u.id
        AND t_assigned.guild_id   = $1
        AND t_assigned.created_at >= $2
        AND t_assigned.created_at <  $3
      -- Tasks this user COMPLETED (verified) this month
      LEFT JOIN tasks t_done
        ON t_done.assigned_to = u.id
        AND t_done.guild_id   = $1
        AND t_done.status     = 'verified'
        AND t_done.updated_at >= $2
        AND t_done.updated_at <  $3
      -- Reviews given by this user
      LEFT JOIN reviews rv ON rv.reviewer_id = u.id
      WHERE u.guild_id = $1
      GROUP BY u.id, u.name, u.role
      ORDER BY u.total_xp DESC
    `, [guild_id, startDate, endDate]);

    // Add derived fields: completion_rate, avg_xp_per_quest, performance_score
    const MAX_XP_PER_QUEST = 144; // base 100 × 1.2 timing × 1.2 quality
    const members = result.rows.map(row => {
      const assigned  = parseInt(row.quests_assigned,  10) || 0;
      const completed = parseInt(row.quests_completed, 10) || 0;
      const xp        = parseFloat(row.xp_earned)          || 0;

      const completionRate    = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      const avgXpPerQuest     = completed > 0 ? Math.round(xp / completed) : 0;
      const maxPossible       = assigned * MAX_XP_PER_QUEST;
      const performanceScore  = maxPossible > 0
        ? Math.min(100, Math.round((xp / maxPossible) * 100))
        : 0;

      return {
        ...row,
        quests_assigned:   assigned,
        quests_completed:  completed,
        xp_earned:         Math.round(xp),
        early_count:       parseInt(row.early_count,   10) || 0,
        flawless_given:    parseInt(row.flawless_given, 10) || 0,
        completion_rate:   completionRate,
        avg_xp_per_quest:  avgXpPerQuest,
        performance_score: performanceScore,
      };
    });

    res.json({ year, month, members });
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAnalytics, getMonthlyAnalytics };
