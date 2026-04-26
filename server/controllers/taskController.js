const db    = require('../db');
const axios = require('axios');

// Discord notification helper — fire-and-forget
const notifyDiscord = async (embed) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, { embeds: [embed] });
  } catch (err) {
    console.error('[Discord] Webhook failed:', err?.message);
  }
};

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const { guild_id } = req.user;
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
    `, [guild_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── PUT /api/tasks/:id/status ────────────────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  try {
    const { id }    = req.params;
    const { status } = req.body;
    const { guild_id } = req.user;

    if (!['assigned', 'in_progress', 'pending_council', 'in_review', 'verified'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND guild_id = $3 RETURNING *`,
      [status, id, guild_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = result.rows[0];

    if (status === 'in_review' || status === 'pending_council') {
      const isCouncil = status === 'pending_council';
      notifyDiscord({
        title:       isCouncil ? '⚔️ Council Action Required!' : '🛡️ Quest Submitted for Review!',
        description: isCouncil
          ? `A quest is now **Pending Council** and requires team approval.\n\n**Quest:** ${updatedTask.title}`
          : `A quest has been submitted for review.\n\n**Quest:** ${updatedTask.title}`,
        color:     isCouncil ? 0xf59e0b : 0x6366f1,
        footer:    { text: 'GuildBoard · Council Notification' },
        timestamp: new Date().toISOString(),
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { title, description, assigned_to, deadline } = req.body;
    const { id: created_by, guild_id } = req.user;

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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/tasks/:id/review ───────────────────────────────────────────────
const reviewTask = async (req, res) => {
  try {
    const { id }    = req.params;
    const { quality_multiplier, approved, comments } = req.body;
    const { id: reviewer_id, guild_id } = req.user;

    if (![0.8, 1.0, 1.2].includes(Number(quality_multiplier))) {
      return res.status(400).json({ error: 'Invalid quality multiplier' });
    }

    // Insert / update review
    await db.query(
      `INSERT INTO reviews (task_id, reviewer_id, quality_multiplier, approved, comments)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (task_id, reviewer_id)
       DO UPDATE SET quality_multiplier = $3, approved = $4, comments = $5, created_at = CURRENT_TIMESTAMP`,
      [id, reviewer_id, quality_multiplier, approved, comments]
    );

    if (!approved) {
      const updatedTask = await db.query(
        `UPDATE tasks SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id]
      );
      return res.json({ message: 'Task rejected and returned to In Progress', task: updatedTask.rows[0] });
    }

    // Fetch task + roles
    const taskRes = await db.query(`
      SELECT t.*, u.role AS assignee_role, c.role AS creator_role
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by  = c.id
      WHERE t.id = $1
    `, [id]);
    const task = taskRes.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // ── Dynamic Council Threshold ────────────────────────────────────────────
    // Leader tasks: all non-leader members in the guild must approve
    // Member tasks: only 1 approval needed (from the leader)
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
      [id]
    );
    const approvals = approvalsRes.rows;

    if (approvals.length < requiredApprovals) {
      if (requiresCouncil && approvals.length >= 1) {
        await db.query(`UPDATE tasks SET status = 'pending_council' WHERE id = $1`, [id]);
      }
      return res.json({
        message:  `Review recorded. Awaiting more approvals (${approvals.length}/${requiredApprovals}).`,
        approvals: approvals.length,
        required:  requiredApprovals,
      });
    }

    // ── XP Math Engine ───────────────────────────────────────────────────────
    let timeMultiplier = 1.0;
    if (task.deadline) {
      const diffHrs = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
      if (diffHrs >= 24) timeMultiplier = 1.2;
      else if (diffHrs < 0) timeMultiplier = 0.7;
    }

    const avgQuality = approvals.reduce((acc, r) => acc + Number(r.quality_multiplier), 0) / approvals.length;
    const finalXp    = Math.round(task.base_xp * timeMultiplier * avgQuality);

    // Update assignee XP + level
    const userRes   = await db.query('SELECT total_xp FROM users WHERE id = $1', [task.assigned_to]);
    const newTotalXp = userRes.rows[0].total_xp + finalXp;
    const newLevel   = Math.floor(newTotalXp / 500) + 1;

    await db.query(
      'UPDATE users SET total_xp = $1, current_level = $2 WHERE id = $3',
      [newTotalXp, newLevel, task.assigned_to]
    );

    const updatedTask = await db.query(
      `UPDATE tasks SET status = 'verified', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ message: 'Task verified and XP awarded!', task: updatedTask.rows[0], awardedXp: finalXp, newTotalXp, newLevel });
  } catch (error) {
    console.error('Error reviewing task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getTasks, updateTaskStatus, createTask, reviewTask };
