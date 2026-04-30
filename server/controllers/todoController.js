const db = require('../db');

// ─── GET /api/todos ────────────────────────────────────────────────────────────
const getTodos = async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const result = await db.query(`
      SELECT * FROM todos
      WHERE user_id = $1
      ORDER BY
        completed ASC,
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high'   THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        due_date ASC NULLS LAST,
        created_at DESC
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/todos ───────────────────────────────────────────────────────────
const createTodo = async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const { title, notes, priority, due_date } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const result = await db.query(`
      INSERT INTO todos (user_id, title, notes, priority, due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, title.trim(), notes || '', priority || 'normal', due_date || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PATCH /api/todos/:id ──────────────────────────────────────────────────────
const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const { title, notes, priority, due_date, completed } = req.body;

    const check = await db.query('SELECT id FROM todos WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (!check.rows.length) return res.status(403).json({ error: 'Not found or not yours' });

    const result = await db.query(`
      UPDATE todos SET
        title        = COALESCE($1, title),
        notes        = COALESCE($2, notes),
        priority     = COALESCE($3, priority),
        due_date     = CASE WHEN $4::text IS NOT NULL THEN $4::date ELSE due_date END,
        completed    = COALESCE($5, completed),
        completed_at = CASE WHEN $5 = true AND completed = false THEN NOW()
                            WHEN $5 = false THEN NULL
                            ELSE completed_at END,
        updated_at   = NOW()
      WHERE id = $6
      RETURNING *
    `, [title?.trim() || null, notes ?? null, priority || null, due_date || null, completed ?? null, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── DELETE /api/todos/:id ─────────────────────────────────────────────────────
const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;

    const check = await db.query('SELECT id FROM todos WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (!check.rows.length) return res.status(403).json({ error: 'Not found or not yours' });

    await db.query('DELETE FROM todos WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
