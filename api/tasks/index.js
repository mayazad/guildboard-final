// GET /api/tasks   — all tasks for the caller's guild
// POST /api/tasks  — create a new task
import db from '../_lib/db.js';
import { withAuth, requireGuild } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (!requireGuild(res, user)) return;

    // ── GET /api/tasks ──────────────────────────────────────────────────────
    if (req.method === 'GET') {
      try {
        const result = await db.query(`
          SELECT
            t.*,
            u.name        AS assignee_name,
            u.role        AS assignee_role,
            c.name        AS creator_name,
            c.role        AS creator_role,
            COUNT(r.id) FILTER (WHERE r.approved = true) AS approval_count
          FROM tasks t
          LEFT JOIN users u  ON t.assigned_to = u.id
          LEFT JOIN users c  ON t.created_by  = c.id
          LEFT JOIN reviews r ON t.id = r.task_id
          WHERE t.guild_id = $1
          GROUP BY t.id, u.name, u.role, c.name, c.role
          ORDER BY t.created_at DESC
        `, [user.guild_id]);
        return res.json(result.rows);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    // ── POST /api/tasks ─────────────────────────────────────────────────────
    if (req.method === 'POST') {
      try {
        const { title, description, assigned_to, deadline } = req.body;
        const { id: created_by, guild_id } = user;

        if (!title || !assigned_to) {
          return res.status(400).json({ error: 'Title and Assignee are required' });
        }

        // Ensure assignee is in the same guild
        const assigneeCheck = await db.query(
          'SELECT id FROM users WHERE id = $1 AND guild_id = $2',
          [assigned_to, guild_id]
        );
        if (assigneeCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Assignee does not belong to your guild' });
        }

        const result = await db.query(
          `INSERT INTO tasks (title, description, assigned_to, created_by, guild_id, deadline, status, base_xp)
           VALUES ($1, $2, $3, $4, $5, $6, 'assigned', 100) RETURNING *`,
          [title, description, assigned_to, created_by, guild_id, deadline]
        );

        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  })
);
