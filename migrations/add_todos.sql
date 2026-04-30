-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS todos (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  notes        TEXT    NOT NULL DEFAULT '',
  priority     TEXT    NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('urgent', 'high', 'medium', 'normal')),
  due_date     DATE    DEFAULT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
