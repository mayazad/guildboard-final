const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../db');

const JWT_SECRET  = process.env.JWT_SECRET || 'fallback_secret';
const SALT_ROUNDS = 10;

const register = async (req, res) => {
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

    // Role and guild_id are NULL until the user completes Guild Setup
    const newUser = await db.query(
      `INSERT INTO users (username, password_hash, name, total_xp, current_level)
       VALUES ($1, $2, $3, 0, 1)
       RETURNING id, username, name, role, guild_id, total_xp, current_level`,
      [username, passwordHash, name]
    );

    const user  = newUser.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user   = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    delete user.password_hash;
    res.status(200).json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login };
