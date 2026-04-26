-- ============================================================
-- GuildBoard Schema v2 — Multi-Tenant Guild System
-- ============================================================

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS guilds CASCADE;

-- Guilds (Teams / Workspaces)
CREATE TABLE guilds (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    invite_code VARCHAR(10)  UNIQUE NOT NULL,
    created_by  INTEGER,     -- FK added after users table
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users — role & guild_id are nullable until guild setup is complete
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  CHECK (role IN ('leader', 'member')), -- nullable until guild joined
    guild_id      INTEGER      REFERENCES guilds(id) ON DELETE SET NULL,
    total_xp      INTEGER      DEFAULT 0,
    current_level INTEGER      DEFAULT 1,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add the deferred FK from guilds.created_by → users.id
ALTER TABLE guilds ADD CONSTRAINT guilds_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Tasks — every task belongs to a guild
CREATE TABLE tasks (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    assigned_to  INTEGER REFERENCES users(id)  ON DELETE SET NULL,
    created_by   INTEGER REFERENCES users(id)  ON DELETE SET NULL,
    guild_id     INTEGER NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    deadline     TIMESTAMP WITH TIME ZONE,
    status       VARCHAR(50) CHECK (status IN ('assigned', 'in_progress', 'pending_council', 'in_review', 'verified')) DEFAULT 'assigned',
    base_xp      INTEGER DEFAULT 100,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id                 SERIAL PRIMARY KEY,
    task_id            INTEGER      REFERENCES tasks(id)  ON DELETE CASCADE,
    reviewer_id        INTEGER      REFERENCES users(id)  ON DELETE CASCADE,
    quality_multiplier NUMERIC(3,2) CHECK (quality_multiplier IN (0.8, 1.0, 1.2)),
    approved           BOOLEAN      NOT NULL DEFAULT FALSE,
    comments           TEXT,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (task_id, reviewer_id)
);
