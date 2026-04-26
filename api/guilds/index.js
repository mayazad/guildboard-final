// GET /api/guilds/me — current user's guild + members
// POST /api/guilds    — create a new guild (becomes leader)
import crypto from 'crypto';
import db from '../_lib/db.js';
import { withAuth } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

const generateInviteCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);

export default withCors(
  withAuth(async (req, res, user) => {
    // ── GET /api/guilds — return this user's guild + members ────────────────
    if (req.method === 'GET') {
      try {
        const { guild_id, role } = user;

        if (!guild_id) {
          return res.status(404).json({ error: 'You are not in a guild' });
        }

        const guildRes   = await db.query(`SELECT * FROM guilds WHERE id = $1`, [guild_id]);
        const guild      = guildRes.rows[0];
        const membersRes = await db.query(
          `SELECT id, name, username, role, total_xp, current_level
           FROM users WHERE guild_id = $1 ORDER BY role DESC, total_xp DESC`,
          [guild_id]
        );

        return res.json({
          guild: {
            ...guild,
            invite_code: role === 'leader' ? guild.invite_code : undefined,
          },
          members: membersRes.rows,
        });
      } catch (error) {
        console.error('Error fetching guild:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    // ── POST /api/guilds — create a new guild ───────────────────────────────
    if (req.method === 'POST') {
      try {
        const { name } = req.body;
        const userId   = user.id;

        if (!name || !name.trim()) {
          return res.status(400).json({ error: 'Guild name is required' });
        }

        if (user.guild_id) {
          return res.status(409).json({ error: 'You already belong to a guild' });
        }

        // Generate unique invite code (retry on collision)
        let inviteCode, inserted = false;
        while (!inserted) {
          inviteCode = generateInviteCode();
          try {
            const guild = await db.query(
              `INSERT INTO guilds (name, invite_code, created_by) VALUES ($1, $2, $3) RETURNING *`,
              [name.trim(), inviteCode, userId]
            );
            await db.query(
              `UPDATE users SET guild_id = $1, role = 'leader' WHERE id = $2`,
              [guild.rows[0].id, userId]
            );
            const updatedUser = await db.query(
              `SELECT id, username, name, role, guild_id, total_xp, current_level FROM users WHERE id = $1`,
              [userId]
            );
            inserted = true;
            return res.status(201).json({
              guild:      guild.rows[0],
              user:       updatedUser.rows[0],
              inviteCode: guild.rows[0].invite_code,
            });
          } catch (err) {
            if (err.code !== '23505') throw err; // retry only on unique_violation
          }
        }
      } catch (error) {
        console.error('Error creating guild:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  })
);
