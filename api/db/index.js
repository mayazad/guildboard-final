const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/guildboard',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
