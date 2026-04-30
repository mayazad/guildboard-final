const db = require('../db');

// ─── GET /api/notes — All guild notes (all members) ──────────────────────────
const getAllNotes = async (req, res) => {
  try {
    const { guild_id } = req.user;

    const result = await db.query(`
      SELECT
        pn.id,
        pn.title,
        pn.content,
        pn.created_at,
        pn.updated_at,
        pn.user_id,
        u.name     AS author_name,
        u.username AS author_username,
        u.role     AS author_role
      FROM personal_notes pn
      JOIN users u ON pn.user_id = u.id
      WHERE pn.guild_id = $1
      ORDER BY pn.updated_at DESC
    `, [guild_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/notes — Create a new note ─────────────────────────────────────
const createNote = async (req, res) => {
  try {
    const { id: user_id, guild_id } = req.user;
    const { title, content } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await db.query(`
      INSERT INTO personal_notes (user_id, guild_id, title, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user_id, guild_id, title.trim(), content || '']);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/notes/:id — Update your own note ───────────────────────────────
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id, guild_id } = req.user;
    const { title, content } = req.body;

    // Ownership check
    const check = await db.query(
      'SELECT id FROM personal_notes WHERE id = $1 AND user_id = $2 AND guild_id = $3',
      [id, user_id, guild_id]
    );
    if (!check.rows.length) {
      return res.status(403).json({ error: 'You can only edit your own notes' });
    }

    const result = await db.query(`
      UPDATE personal_notes
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [title?.trim() || null, content ?? null, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE /api/notes/:id — Delete your own note ────────────────────────────
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id, guild_id } = req.user;

    const check = await db.query(
      'SELECT id FROM personal_notes WHERE id = $1 AND user_id = $2 AND guild_id = $3',
      [id, user_id, guild_id]
    );
    if (!check.rows.length) {
      return res.status(403).json({ error: 'You can only delete your own notes' });
    }

    await db.query('DELETE FROM personal_notes WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getAllNotes, createNote, updateNote, deleteNote };
