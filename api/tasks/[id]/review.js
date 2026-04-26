// POST /api/tasks/[id]/review — submit a review + XP award logic
import db from '../../_lib/db.js';
import { withAuth, requireGuild } from '../../_lib/auth.js';
import { withCors } from '../../_lib/cors.js';

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireGuild(res, user)) return;

    try {
      const taskId = req.query.id;
      const { quality_multiplier, approved, comments } = req.body;
      const { id: reviewer_id, guild_id } = user;

      if (![0.8, 1.0, 1.2].includes(Number(quality_multiplier))) {
        return res.status(400).json({ error: 'Invalid quality multiplier' });
      }

      // Insert / upsert review
      await db.query(
        `INSERT INTO reviews (task_id, reviewer_id, quality_multiplier, approved, comments)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (task_id, reviewer_id)
         DO UPDATE SET quality_multiplier = $3, approved = $4, comments = $5, created_at = CURRENT_TIMESTAMP`,
        [taskId, reviewer_id, quality_multiplier, approved, comments]
      );

      if (!approved) {
        const updatedTask = await db.query(
          `UPDATE tasks SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
          [taskId]
        );
        return res.json({ message: 'Task rejected and returned to In Progress', task: updatedTask.rows[0] });
      }

      // Fetch task + assignee/creator roles
      const taskRes = await db.query(`
        SELECT t.*, u.role AS assignee_role, c.role AS creator_role
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users c ON t.created_by  = c.id
        WHERE t.id = $1
      `, [taskId]);
      const task = taskRes.rows[0];
      if (!task) return res.status(404).json({ error: 'Task not found' });

      // ── Dynamic Council Threshold ─────────────────────────────────────────
      const requiresCouncil = task.assignee_role === 'leader' || task.creator_role === 'leader';
      let requiredApprovals = 1;
      if (requiresCouncil) {
        const memberCountRes = await db.query(
          `SELECT COUNT(*) AS cnt FROM users WHERE guild_id = $1 AND role = 'member'`,
          [guild_id]
        );
        requiredApprovals = parseInt(memberCountRes.rows[0].cnt, 10) || 1;
      }

      const approvalsRes = await db.query(
        `SELECT * FROM reviews WHERE task_id = $1 AND approved = true`,
        [taskId]
      );
      const approvals = approvalsRes.rows;

      if (approvals.length < requiredApprovals) {
        if (requiresCouncil && approvals.length >= 1) {
          await db.query(`UPDATE tasks SET status = 'pending_council' WHERE id = $1`, [taskId]);
        }
        return res.json({
          message:  `Review recorded. Awaiting more approvals (${approvals.length}/${requiredApprovals}).`,
          approvals: approvals.length,
          required:  requiredApprovals,
        });
      }

      // ── XP Math Engine ────────────────────────────────────────────────────
      let timeMultiplier = 1.0;
      if (task.deadline) {
        const diffHrs = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
        if (diffHrs >= 24) timeMultiplier = 1.2;
        else if (diffHrs < 0) timeMultiplier = 0.7;
      }

      const avgQuality = approvals.reduce((acc, r) => acc + Number(r.quality_multiplier), 0) / approvals.length;
      const finalXp    = Math.round(task.base_xp * timeMultiplier * avgQuality);

      // Update assignee XP + level
      const userRes    = await db.query('SELECT total_xp FROM users WHERE id = $1', [task.assigned_to]);
      const newTotalXp = userRes.rows[0].total_xp + finalXp;
      const newLevel   = Math.floor(newTotalXp / 500) + 1;

      await db.query(
        'UPDATE users SET total_xp = $1, current_level = $2 WHERE id = $3',
        [newTotalXp, newLevel, task.assigned_to]
      );

      const updatedTask = await db.query(
        `UPDATE tasks SET status = 'verified', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [taskId]
      );

      res.json({
        message: 'Task verified and XP awarded!',
        task: updatedTask.rows[0],
        awardedXp: finalXp,
        newTotalXp,
        newLevel,
      });
    } catch (error) {
      console.error('Error reviewing task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);
