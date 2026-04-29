const db = require('../db');

// ─── GET /api/tasks/:id/journey ───────────────────────────────────────────────
const getJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const { guild_id } = req.user;

    // Security: ensure the task belongs to this guild
    const taskCheck = await db.query(
      'SELECT id FROM tasks WHERE id = $1 AND guild_id = $2',
      [id, guild_id]
    );
    if (!taskCheck.rows.length) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const result = await db.query(`
      SELECT
        a.id,
        a.task_id,
        a.action_type,
        a.details,
        a.created_at,
        u.name AS actor_name,
        u.role AS actor_role
      FROM task_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.task_id = $1
      ORDER BY a.created_at ASC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getJourney };
