const db = require('../db');

// GET /api/messages — last 50 messages for the user's guild
const getMessages = async (req, res) => {
  try {
    const { guild_id } = req.user;
    if (!guild_id) return res.status(403).json({ error: 'You must be in a guild' });

    const result = await db.query(`
      SELECT m.id, m.content, m.created_at,
             u.id AS user_id, u.name, u.username
      FROM messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.guild_id = $1
      ORDER BY m.created_at ASC
      LIMIT 50
    `, [guild_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/messages — send a message
const sendMessage = async (req, res) => {
  try {
    const { guild_id, id: user_id } = req.user;
    const { content } = req.body;

    if (!guild_id) return res.status(403).json({ error: 'You must be in a guild' });
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
    if (content.trim().length > 1000) return res.status(400).json({ error: 'Message too long (max 1000 chars)' });

    const result = await db.query(`
      INSERT INTO messages (guild_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `, [guild_id, user_id, content.trim()]);

    res.status(201).json({
      ...result.rows[0],
      user_id,
      name:     req.user.name,
      username: req.user.username,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getMessages, sendMessage };
