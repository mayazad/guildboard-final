const db    = require('../db');
const crypto = require('crypto');

/**
 * Generate a unique, readable 6-character alphanumeric invite code.
 */
const generateInviteCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);

// ─── POST /api/guilds ─────────────────────────────────────────────────────────
// Creates a new guild. The requesting user becomes the Leader.
const createGuild = async (req, res) => {
  try {
    const { name } = req.body;
    const userId   = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Guild name is required' });
    }

    if (req.user.guild_id) {
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

        // Assign user as leader of this guild
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
        // 23505 = unique_violation — retry with new code
        if (err.code !== '23505') throw err;
      }
    }
  } catch (error) {
    console.error('Error creating guild:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── POST /api/guilds/join ────────────────────────────────────────────────────
// Joins an existing guild using an invite code. User becomes a Member.
const joinGuild = async (req, res) => {
  try {
    const { invite_code } = req.body;
    const userId = req.user.id;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    if (req.user.guild_id) {
      return res.status(409).json({ error: 'You already belong to a guild' });
    }

    const guildRes = await db.query(
      `SELECT * FROM guilds WHERE invite_code = $1`,
      [invite_code.toUpperCase().trim()]
    );

    if (guildRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code. No guild found.' });
    }

    const guild = guildRes.rows[0];

    await db.query(
      `UPDATE users SET guild_id = $1, role = 'member' WHERE id = $2`,
      [guild.id, userId]
    );

    const updatedUser = await db.query(
      `SELECT id, username, name, role, guild_id, total_xp, current_level FROM users WHERE id = $1`,
      [userId]
    );

    res.json({ guild, user: updatedUser.rows[0] });
  } catch (error) {
    console.error('Error joining guild:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── GET /api/guilds/me ───────────────────────────────────────────────────────
// Returns the current user's guild, members list, and invite code (leaders only).
const getMyGuild = async (req, res) => {
  try {
    const { guild_id, role, id: userId } = req.user;

    if (!guild_id) {
      return res.status(404).json({ error: 'You are not in a guild' });
    }

    const guildRes = await db.query(`SELECT * FROM guilds WHERE id = $1`, [guild_id]);
    const guild    = guildRes.rows[0];

    const membersRes = await db.query(
      `SELECT id, name, username, role, total_xp, current_level FROM users WHERE guild_id = $1 ORDER BY role DESC, total_xp DESC`,
      [guild_id]
    );

    res.json({
      guild: {
        ...guild,
        // Only expose invite code to the leader
        invite_code: role === 'leader' ? guild.invite_code : undefined,
      },
      members: membersRes.rows,
    });
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createGuild, joinGuild, getMyGuild };
