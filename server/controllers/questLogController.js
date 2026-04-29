const db = require('../db');

// ─── GET /api/activities (guild-wide chronicle feed) ──────────────────────────
const getGuildActivities = async (req, res) => {
  try {
    const { guild_id } = req.user;

    const result = await db.query(`
      SELECT
        a.id,
        a.task_id,
        a.action_type,
        a.details,
        a.created_at,
        u.name   AS actor_name,
        u.role   AS actor_role,
        t.title  AS task_title
      FROM task_activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN tasks t ON a.task_id = t.id
      WHERE t.guild_id = $1
      ORDER BY a.created_at DESC
      LIMIT 100
    `, [guild_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching guild activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/notes/mine (personal notes feed, all quests) ────────────────────
const getMyNotes = async (req, res) => {
  try {
    const { id: user_id, guild_id } = req.user;

    const result = await db.query(`
      SELECT
        n.id,
        n.task_id,
        n.content,
        n.created_at,
        n.updated_at,
        t.title  AS task_title,
        t.status AS task_status
      FROM task_notes n
      LEFT JOIN tasks t ON n.task_id = t.id
      WHERE n.user_id = $1
        AND t.guild_id = $2
        AND n.content <> ''
      ORDER BY n.updated_at DESC
    `, [user_id, guild_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching personal notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getGuildActivities, getMyNotes };
