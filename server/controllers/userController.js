const db = require('../db');

// ─── GET /api/users ───────────────────────────────────────────────────────────
// Returns all members of the current user's guild (for assignee dropdowns, etc.)
const getUsers = async (req, res) => {
  try {
    const { guild_id } = req.user;
    const result = await db.query(
      `SELECT id, name, username, role, total_xp, current_level
       FROM users WHERE guild_id = $1 ORDER BY role DESC, name ASC`,
      [guild_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/users/me ────────────────────────────────────────────────────────
// Returns the current user's basic profile (used by DashboardLayout HUD)
const getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, username, role, guild_id, total_xp, current_level FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/users/profile ───────────────────────────────────────────────────
// Returns rich profile stats for the current user
const getProfile = async (req, res) => {
  try {
    const { id: userId, guild_id } = req.user;

    // Basic user info
    const userRes = await db.query(
      `SELECT id, name, username, role, guild_id, total_xp, current_level, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Guild info
    let guild = null;
    let inviteCode = null;
    if (guild_id) {
      const guildRes = await db.query(`SELECT * FROM guilds WHERE id = $1`, [guild_id]);
      guild = guildRes.rows[0];
      if (user.role === 'leader') inviteCode = guild?.invite_code;

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
        COUNT(*) FILTER (WHERE approved = true)                         AS reviews_given,
        COUNT(*) FILTER (WHERE approved = true AND quality_multiplier = 1.2) AS flawless_given
      FROM reviews WHERE reviewer_id = $1
    `, [userId]);
    const reviewStats = reviewStatsRes.rows[0];

    // Guild rank (by XP, within same guild)
    let rank = null;
    if (guild_id) {
      const rankRes = await db.query(`
        SELECT COUNT(*) + 1 AS rank
        FROM users
        WHERE guild_id = $1 AND total_xp > $2
      `, [guild_id, user.total_xp]);
      rank = parseInt(rankRes.rows[0].rank, 10);
    }

    res.json({
      ...user,
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
};

module.exports = { getUsers, getMe, getProfile };
