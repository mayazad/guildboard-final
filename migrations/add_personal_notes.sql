-- Run this in your Supabase SQL editor to create the personal_notes table

CREATE TABLE IF NOT EXISTS personal_notes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  guild_id   INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL DEFAULT 'Untitled',
  content    TEXT    NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast guild-scoped lookups
CREATE INDEX IF NOT EXISTS idx_personal_notes_guild ON personal_notes(guild_id);
CREATE INDEX IF NOT EXISTS idx_personal_notes_user  ON personal_notes(user_id);
