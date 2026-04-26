// POST /api/auth/register
import bcrypt from 'bcrypt';
import db from '../_lib/db.js';
import { signToken } from '../_lib/auth.js';
import { withCors } from '../_lib/cors.js';

const SALT_ROUNDS = 10;

export default withCors(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }

    const userExists = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await db.query(
      `INSERT INTO users (username, password_hash, name, total_xp, current_level)
       VALUES ($1, $2, $3, 0, 1)
       RETURNING id, username, name, role, guild_id, total_xp, current_level`,
      [username, passwordHash, name]
    );

    const user  = newUser.rows[0];
    const token = signToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
