const db = require('../db');

// ─── GET /api/tasks/:id/notes ─────────────────────────────────────────────────
const getNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id, guild_id } = req.user;

    const taskCheck = await db.query(
      'SELECT id FROM tasks WHERE id = $1 AND guild_id = $2',
      [id, guild_id]
    );
    if (!taskCheck.rows.length) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const result = await db.query(
      'SELECT * FROM task_notes WHERE task_id = $1 AND user_id = $2',
      [id, user_id]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/tasks/:id/notes ────────────────────────────────────────────────
const saveNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { id: user_id, guild_id } = req.user;

    const taskCheck = await db.query(
      'SELECT id FROM tasks WHERE id = $1 AND guild_id = $2',
      [id, guild_id]
    );
    if (!taskCheck.rows.length) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    const result = await db.query(`
      INSERT INTO task_notes (task_id, user_id, content)
      VALUES ($1, $2, $3)
      ON CONFLICT (task_id, user_id)
      DO UPDATE SET content = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [id, user_id, content]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getNotes, saveNote };
