// PUT /api/tasks/[id]/status — drag-and-drop status update
import axios from 'axios';
import db from '../../_lib/db.js';
import { withAuth, requireGuild } from '../../_lib/auth.js';
import { withCors } from '../../_lib/cors.js';

const VALID_STATUSES = ['assigned', 'in_progress', 'pending_council', 'in_review', 'verified'];

const notifyDiscord = async (embed) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await axios.post(webhookUrl, { embeds: [embed] });
  } catch (err) {
    console.error('[Discord] Webhook failed:', err?.message);
  }
};

export default withCors(
  withAuth(async (req, res, user) => {
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireGuild(res, user)) return;

    try {
      const taskId     = req.query.id;
      const { status } = req.body;
      const { guild_id } = user;

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const result = await db.query(
        `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND guild_id = $3 RETURNING *`,
        [status, taskId, guild_id]
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
  })
);
