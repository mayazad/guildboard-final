// Shared PostgreSQL pool — points to Supabase via PgBouncer Session-mode pooler
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required by Supabase
  max: 1, // serverless: keep pool tiny to avoid exhausting connections
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

const db = {
  query: (text, params) => pool.query(text, params),
};

export default db;
