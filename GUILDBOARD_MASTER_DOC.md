# 🏰 GuildBoard — Master Project Documentation

> *An RPG-themed, AI-powered task management platform for software development teams.*
> Built by **MayazAD** for the **Beyond Limiter Guild**.

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Architecture](#database-architecture)
4. [Backend API](#backend-api)
5. [Frontend Pages & Components](#frontend-pages--components)
6. [Core Features (Implemented)](#core-features-implemented)
7. [Gamification System](#gamification-system)
8. [AI System — Current & Planned](#ai-system--current--planned)
9. [Future Roadmap](#future-roadmap)
10. [Git & Project Hygiene](#git--project-hygiene)

---

## 🌍 Project Overview

**GuildBoard** is a full-stack, multi-tenant task management platform wrapped in a rich RPG narrative. Instead of plain project management, every action is treated as a guild quest:

- Tasks become **Bounties** and **Quests**
- Teams become **Guilds**
- Users have **Classes**, **Levels**, and **XP**
- Managers are the **High Council**
- The AI assistant is the **Guild Dungeon Master**

The platform is designed for small-to-medium software development teams who want a more engaging and gamified alternative to Jira or Linear.

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | ^19.2.5 | UI Framework |
| Vite | ^8.0.9 | Build Tool & Dev Server |
| React Router DOM | ^7.14.2 | Client-side Routing |
| Tailwind CSS | ^3.4.19 | Utility-first Styling |
| Framer Motion | ^12.38.0 | Animations & Transitions |
| GSAP | ^3.15.0 | Advanced Animations |
| DnD Kit | ^6.3.1 | Drag-and-Drop Board |
| Recharts | ^3.8.1 | Analytics Charts |
| Lucide React | ^1.8.0 | Icon Library |
| Axios | ^1.15.2 | HTTP Client |

### Backend
| Library | Version | Purpose |
|---|---|---|
| Express | ^5.2.1 | REST API Framework |
| Node.js | Runtime | Server Runtime |
| PostgreSQL (`pg`) | ^8.20.0 | Primary Database |
| JSON Web Token | ^9.0.3 | Authentication |
| bcryptjs | ^2.4.3 | Password Hashing |
| dotenv | ^17.4.2 | Environment Variables |
| CORS | ^2.8.6 | Cross-Origin Policy |

### AI
| Tool | Purpose |
|---|---|
| Custom Fine-Tuned LLaMA | Guild Dungeon Master — primary AI engine |
| Ollama | Local model serving (inference runtime) |
| Unsloth / Axolotl | Fine-tuning pipeline (LoRA/QLoRA) |

### Deployment
- **Frontend**: Vercel (`vercel.json` configured)
- **Backend**: Express server (self-hosted / Railway / Render)
- **Database**: PostgreSQL (Neon / Supabase / Railway)

---

## 🗄️ Database Architecture

**Schema Version:** v2 — Multi-Tenant Guild System

### Tables

#### `guilds` — Workspaces / Teams
```sql
id          SERIAL PRIMARY KEY
name        VARCHAR(100) NOT NULL
invite_code VARCHAR(10) UNIQUE NOT NULL   -- Unique code to join the guild
created_by  INTEGER REFERENCES users(id)
created_at  TIMESTAMP WITH TIME ZONE
```

#### `users` — Guild Members
```sql
id            SERIAL PRIMARY KEY
username      VARCHAR(50) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
name          VARCHAR(100) NOT NULL
role          VARCHAR(20) CHECK (role IN ('leader', 'member'))
guild_id      INTEGER REFERENCES guilds(id)
total_xp      INTEGER DEFAULT 0
current_level INTEGER DEFAULT 1
created_at    TIMESTAMP WITH TIME ZONE
```

#### `tasks` — Quests / Bounties
```sql
id           SERIAL PRIMARY KEY
title        VARCHAR(255) NOT NULL
description  TEXT
assigned_to  INTEGER REFERENCES users(id)
created_by   INTEGER REFERENCES users(id)
guild_id     INTEGER NOT NULL REFERENCES guilds(id)
deadline     TIMESTAMP WITH TIME ZONE
status       VARCHAR(50) CHECK (status IN (
               'assigned', 'in_progress', 'pending_council',
               'in_review', 'verified'))
base_xp      INTEGER DEFAULT 100
submitted_at TIMESTAMP WITH TIME ZONE
created_at   TIMESTAMP WITH TIME ZONE
updated_at   TIMESTAMP WITH TIME ZONE
```

#### `reviews` — Council Review System
```sql
id                 SERIAL PRIMARY KEY
task_id            INTEGER REFERENCES tasks(id)
reviewer_id        INTEGER REFERENCES users(id)
quality_multiplier NUMERIC(3,2) CHECK (quality_multiplier IN (0.8, 1.0, 1.2))
approved           BOOLEAN NOT NULL DEFAULT FALSE
comments           TEXT
created_at         TIMESTAMP WITH TIME ZONE
UNIQUE (task_id, reviewer_id)   -- One review per reviewer per task
```

#### `messages` — Guild Chat
```sql
id         SERIAL PRIMARY KEY
guild_id   INTEGER NOT NULL REFERENCES guilds(id)
user_id    INTEGER NOT NULL REFERENCES users(id)
content    TEXT NOT NULL CHECK (char_length(content) <= 1000)
created_at TIMESTAMP WITH TIME ZONE
```

#### `task_activities` — Quest Journey / Activity Log
```sql
id          SERIAL PRIMARY KEY
task_id     INTEGER NOT NULL REFERENCES tasks(id)
user_id     INTEGER REFERENCES users(id)
action_type VARCHAR(50) NOT NULL   -- e.g. 'started', 'submitted', 'approved'
details     TEXT
created_at  TIMESTAMP WITH TIME ZONE
```

#### `task_notes` — Adventurer's Journal (Per-User Notes)
```sql
id         SERIAL PRIMARY KEY
task_id    INTEGER NOT NULL REFERENCES tasks(id)
user_id    INTEGER NOT NULL REFERENCES users(id)
content    TEXT NOT NULL DEFAULT ''
created_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
UNIQUE (task_id, user_id)   -- One note per user per task
```

---

## 🔌 Backend API

### Controllers & Routes

#### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login, returns JWT |

#### Tasks (`/api/tasks`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all tasks for the authenticated user's guild |
| POST | `/` | Create a new task (quest) |
| PUT | `/:id/status` | Update task status (triggers XP & Discord) |
| PUT | `/:id` | Update task metadata |
| DELETE | `/:id` | Delete a task |
| POST | `/generate-subquests` | AI — generate subquests for a task |

#### Reviews (`/api/tasks/:id/review`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/:id/review` | Submit a council review (approve/reject + multiplier) |

#### Guilds (`/api/guilds`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/create` | Create a new guild |
| POST | `/join` | Join a guild via invite code |
| GET | `/:id` | Get guild details |
| GET | `/:id/members` | Get all guild members |

#### Users (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update user profile |
| GET | `/:id` | Get a specific user |

#### Analytics (`/api/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/leaderboard` | Guild XP leaderboard |
| GET | `/stats` | Task completion stats |
| GET | `/xp-history` | XP over time |
| GET | `/overview` | General guild overview |

#### Quest Log (`/api/quest-log`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all verified/completed tasks for the guild |

#### Journey (`/api/journey`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/:taskId` | Get the activity timeline for a specific task |

#### Messages (`/api/messages`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/:guildId` | Get guild chat messages |
| POST | `/:guildId` | Post a message to guild chat |

#### AI (`/api/ai`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/generate-subquests` | Generate 3-5 subquests via the Guild Dungeon Master model |

### Key Backend Logic

**XP Calculation on Task Verification:**
```
Final XP = base_xp × quality_multiplier
- quality_multiplier: 0.8 (below standard), 1.0 (standard), 1.2 (exceptional)
```

**Discord Webhook Notifications:**
- Fires on every task status change
- Sends rich embed with task name, new status, and assignee
- Configured via `DISCORD_WEBHOOK_URL` env variable

**Activity Logging:**
- Every status transition is recorded in `task_activities`
- Visible in the "Quest Journey" timeline on the task detail modal

**Multi-Tenancy:**
- Every query is scoped by `guild_id` from the authenticated user's JWT
- Users cannot see tasks or members from other guilds

---

## 🖥️ Frontend Pages & Components

### Pages

| File | Route | Description |
|---|---|---|
| `LandingPage.jsx` | `/` | Marketing landing page for non-logged-in users |
| `GuildSetupPage.jsx` | `/setup` | Create or join a guild via invite code |
| `Dashboard.jsx` | `/dashboard` | Main Kanban task board (5 columns) |
| `AnalyticsDashboard.jsx` | `/analytics` | XP charts, leaderboard, task stats |
| `ProfilePage.jsx` | `/profile` | User profile, XP, level, task history |
| `QuestLogPage.jsx` | `/quest-log` | Chronological log of all completed quests |

### Components

| File | Description |
|---|---|
| `DashboardLayout.jsx` | Sidebar navigation, top bar, guild info |
| `TaskCard.jsx` | Individual task card with status badge & deadline |
| `CreateTaskModal.jsx` | Form to create a new quest (title, desc, XP, deadline, assignee) |
| `TaskDetailModal.jsx` | Full task detail view with all actions, journey, notes |
| `ReviewTaskModal.jsx` | Council review form (approve/reject + quality multiplier) |
| `TaskNotes.jsx` | Adventurer's Journal — per-user personal notes on a task |
| `QuestJourney.jsx` | Timeline of all activity events for a task |
| `GuildChat.jsx` | Real-time guild chat panel |
| `AuthCard.jsx` | Login / Registration form |
| `DeadlineBadge.jsx` | Visual badge showing urgency of deadline |
| `AnimatedBackground.jsx` | Decorative animated background for landing page |

---

## ⚔️ Core Features (Implemented)

### 1. Multi-Tenant Guild System
- Any user can **Create a Guild** and receive a unique `invite_code`
- Other users can **Join a Guild** by entering that code
- All data (tasks, members, chat) is fully isolated per guild
- Guild leaders have elevated management permissions

### 2. Kanban Task Board (5 Columns)
The board uses **DnD Kit** for drag-and-drop task management.

| Column | Status Key | Description |
|---|---|---|
| 📋 Assigned | `assigned` | Task created but not started |
| ⚔️ In Progress | `in_progress` | Actively being worked on |
| ⏳ Pending Council | `pending_council` | Awaiting review assignment |
| 🔍 In Review | `in_review` | Under council inspection |
| ✅ Verified | `verified` | Approved, XP awarded |

### 3. XP & Leveling System
- Every task has a `base_xp` value
- On verification, XP is multiplied by the reviewer's quality score
- XP accrues on the `users` table (`total_xp`, `current_level`)
- Leaderboard visible on the Analytics Dashboard

### 4. Council Review System (No Self-Verification)
- Only a user **other than the task's assignee** can review
- Reviewer selects a quality multiplier: `0.8x`, `1.0x`, or `1.2x`
- Reviewer can `Approve` or `Reject` with comments
- On approval, task moves to `verified` and XP is awarded

### 5. Quest Journey (Activity Timeline)
- Every status change is logged in `task_activities`
- Shown as a chronological timeline inside `TaskDetailModal`
- Includes who performed the action and when

### 6. Adventurer's Journal (Personal Task Notes)
- Each user can write their own private notes on any task
- One note per user per task (upsert pattern)
- Stored in `task_notes` table

### 7. Guild Chat
- Members can send messages in the guild's shared chat
- Up to 1000 characters per message
- Displayed in the `GuildChat` component

### 8. Analytics Dashboard
- Powered by **Recharts**
- Guild XP Leaderboard
- Task completion trends
- XP over time charts
- Overview stats (total tasks, avg XP, completion rate)

### 9. Discord Webhook Notifications
- Fires on every task status change
- Sends embedded messages to a Discord channel
- Configured via `DISCORD_WEBHOOK_URL` in `.env`

### 10. JWT Authentication
- Users register and login via `/api/auth`
- JWT stored client-side and sent with every request
- Backend middleware validates and decodes the token on all protected routes

### 11. Role-Based Access
- Two roles: `leader` and `member`
- Leaders can manage guild settings and member roles
- Certain task actions are restricted by role

### 12. Developer Archetypes (RPG Classes)
Users are assigned to one of four classes, each with themed AI responses:

| Class | Archetype | Skills |
|---|---|---|
| 🧙 Frontend Mage | UI/UX Specialist | React, CSS, animations, accessibility |
| 🛡️ Backend Paladin | Server Engineer | APIs, databases, authentication, security |
| ⚙️ DevOps Warden | Infrastructure | CI/CD, Docker, cloud, monitoring |
| 🧪 Data Alchemist | Data & ML | Analytics, databases, AI, data pipelines |

---

## 🎮 Gamification System

### XP Formula
```
Awarded XP = base_xp × quality_multiplier

Examples:
- base_xp: 200, multiplier: 1.2 → 240 XP (Exceptional)
- base_xp: 200, multiplier: 1.0 → 200 XP (Standard)
- base_xp: 200, multiplier: 0.8 → 160 XP (Below Standard)
```

### Leveling (Current)
- XP accumulates on the user record
- `current_level` is updated on the user profile

### Guild Leaderboard
- Ranked by `total_xp`
- Visible to all guild members on the Analytics page

---

## 🤖 AI System — Guild Dungeon Master

### Primary AI: Custom Fine-Tuned LLaMA

The **Guild Dungeon Master** is GuildBoard's core AI engine — a locally-hosted, fine-tuned LLaMA model that translates technical software tasks into RPG narrative while also acting as a functional task management engine. It is served via **Ollama** and called through the `/api/ai` backend routes.

**Integration Point:** `POST /api/ai/generate-subquests`
- User provides a task title in the `CreateTaskModal`
- The model breaks it into 3–5 actionable, RPG-flavored sub-tasks with technical requirements
- Sub-tasks are returned and displayed in the UI

### Fine-Tuned LLaMA — Guild Dungeon Master

#### Training Data — `raw_data.jsonl`
- **Current dataset**: 200 high-quality JSONL entries (Hardened v3)
- **Previous dataset**: 400 entries in `raw_data_v2.jsonl`
- **Format**: `{ "instruction": "...", "input": "...", "output": "..." }`
- **Fine-tuning pipelines**: Unsloth / Axolotl (LoRA/QLoRA)
- **Status**: Not Git-tracked (excluded via `.gitignore`)

#### Instruction Types in Training Data

| Instruction Key | Purpose |
|---|---|
| `GUILD_ENGINE_PERSONA` | Archetype-based responses (Mage/Paladin/Warden/Alchemist) |
| `GUILD_ENGINE_GOVERNANCE` | Council rules, policy enforcement |
| `GUILD_ENGINE_TASK` / `GUILD_TASK_MANAGER` | Technical task → RPG quest translation |
| `TASK_TRANSLATION` | Direct input→output task formatting |
| `GUILD_CHRONICLE` | Weekly/Monthly team summary narratives |
| `GUILD_JOURNAL` | First-person dev journal entries |
| `STRUCTURAL_OUTPUT` | Returns JSON payload for UI integration |
| `SPRINT_MISSION` | Sprint status narrations |
| `QUEST_FORGE` | New quest creation announcements |
| `COUNCIL_REVIEW` | Review result narrations |
| `ERROR_RPG` | HTTP error codes as RPG events |
| `INTERACTIVE_PROMPT` | Conversational AI Q&A |

#### Structural Output (JSON Mode)
The model is trained to return machine-parseable JSON for direct app integration:
```json
{
  "message": "⚔️ **Quest: The Seeker's Lens.** Forge a search tool...",
  "payload": {
    "title": "Add Search Bar",
    "xp": 130,
    "tags": ["ui", "search"],
    "difficulty": "medium"
  }
}
```
The frontend can parse `payload` to auto-fill the `CreateTaskModal`.

#### Known Issue: Model Drift
- **Problem**: Base LLaMA confuses "Quest" and "Forge" with generic fantasy storytelling (Earth Stones, Sky Crystals) instead of technical tasks.
- **Fix 1 (Data)**: Hardened training entries always include a `**Technical Requirements:**` section.
- **Fix 2 (Inference)**: Use the System Prompt below at inference time.

#### Required System Prompt (use at inference)
```
You are the GuildBoard AI — a functional Task Management Engine.
Your purpose is to translate modern technical software development tasks
into RPG-themed Quests and Chronicles. You MUST preserve all technical
context (project names, technologies, specific goals). Do NOT invent
generic fantasy items unless they directly metaphorize a technical
component. Always include a Technical Requirements section.
```

#### Planned AI Features

| Feature | Description | Status |
|---|---|---|
| Guild Dungeon Master | Fine-tuned LLaMA persona for all task interactions | 🔄 Training |
| Auto-XP Balancing | LLM analyzes task description → suggests fair base_xp | 📋 Planned |
| Quest Generation | Ask AI to generate a sprint's worth of tasks from a goal | 📋 Planned |
| Smart Review Summaries | AI summarizes all council reviews into one feedback report | 📋 Planned |
| Structural Output Integration | Frontend parses AI JSON to auto-fill task creation forms | 📋 Planned |
| Archetype-Based Encouragement | Role-specific praise and guidance after task completion | 📋 Planned |
| Sprint Narration | Automated weekly chronicle generation | 📋 Planned |
| AI Bug Hunter | Background bot that scans for broken links/slow queries | 💡 Concept |
| Voice Commands | Voice-controlled task board interactions | 💡 Concept |
| Sentiment Analysis | Measure guild chat mood to detect burnout | 💡 Concept |
| AI-Priority Analyzer | Rank tasks by urgency intelligently | 💡 Concept |

---

## 🗺️ Future Roadmap

### Phase 1 — Core Feature Polish
- [ ] **Edit Quest** — Allow leaders to modify title, description, deadline pre-start
- [ ] **Quest Priority** — `Low / Medium / High / Critical` with color-coded badges
- [ ] **Quest Comments/Threads** — Collaborative discussion inside task modals
- [ ] **File Attachments** — Upload "Proof of Work" files when submitting for review
- [ ] **Overdue Tracker** — Dedicated view for stalled/expired quests

### Phase 2 — Gamification Expansion
- [ ] **Achievements & Badges** — Unlock titles like "Speedster", "Bug Hunter", "Flawless Knight"
- [ ] **Guild XP Pool** — Collective guild XP for ranking against other guilds
- [ ] **Weekly Challenges** — Auto-generated objectives (e.g., "Complete 5 quests as a team")
- [ ] **Forging Streaks** — Track consecutive days of activity
- [ ] **Avatar Customization** — Cosmetic unlocks as users level up
- [ ] **Level-Up Events** — Guild-wide animation when a member hits Lv. 10/50/100

### Phase 3 — Management & Automation
- [ ] **Quest Templates** — Save recurring tasks as one-click spawnable templates
- [ ] **Bulk Operations** — Duplicate or multi-assign quests
- [ ] **Smart Reminders** — Automated Discord/Email alerts 24h before deadline
- [ ] **Exportable Reports** — CSV/PDF monthly performance summaries

### Phase 4 — Advanced Analytics
- [ ] **Growth Trends** — XP & productivity charts over 3/6/12 months
- [ ] **Efficiency Metrics** — "Time to Completion" vs estimated deadline
- [ ] **Heatmaps** — Activity heatmaps per member/week

### Phase 5 — Integration Ecosystem
- [ ] **GitHub/GitLab Sync** — Auto-move tasks to "In Progress" on branch creation, "In Review" on PR open
- [ ] **Slack Bridge** — Slash commands and task updates in Slack
- [ ] **Linear/Jira Bridge** — Two-way sync for corporate tool compatibility
- [ ] **Google/Outlook Calendar** — Sync quest deadlines to personal calendars

### Phase 6 — Social & Competition
- [ ] **Guild Wars (GvG)** — Friendly competitions between teams based on "Efficiency Score"
- [ ] **Public Hall of Fame** — Showcase completed legendary projects
- [ ] **Global Guild Leaderboard** — Cross-guild XP rankings

### Phase 7 — Technical Upgrades
- [ ] **WebSockets** — True real-time chat and live board updates
- [ ] **PWA / Offline Mode** — Service Workers for offline task viewing
- [ ] **Mobile App** — React Native or Flutter companion app
- [ ] **Redis Caching** — Session persistence and API response caching
- [ ] **Rate Limiting** — Protect all API endpoints
- [ ] **Semantic Search** — Vector-based search through quest history

### Phase 8 — Advanced AI & Web3 (Concepts)
- [ ] **Decentralized Identity (DID)** — Blockchain-based member identities
- [ ] **Guild DAO Voting** — Smart contract-based governance decisions
- [ ] **NFT Badges** — On-chain achievement proof
- [ ] **Federated Learning** — Privacy-preserving recommendation training
- [ ] **AR Task Viewer** — View task cards in augmented reality

---

## 🔒 Git & Project Hygiene

### `.gitignore` Exclusions (Training Data)
The following are excluded from version control to protect sensitive training artifacts:

```gitignore
# AI Training Data
raw_data.jsonl
raw_data_v2.jsonl

# Scratch files
scratch/
**/scratch/

# Environment
.env
node_modules/
dist/
```

### File Layout
```
guildboard-final/
├── src/                      # Frontend (React + Vite)
│   ├── pages/                # 6 route-level pages
│   ├── components/           # 11 reusable components
│   ├── App.jsx               # Router config
│   └── api.js                # Axios base instance
├── server/                   # Backend (Express)
│   ├── controllers/          # 10 route controllers
│   ├── routes/               # 8 route files
│   ├── middleware/           # Auth middleware (JWT verify)
│   └── db/                   # PostgreSQL connection pool
├── api/                      # Vercel serverless entry (if used)
├── schema.sql                # Full DB schema (v2)
├── raw_data.jsonl            # AI training data (NOT tracked)
├── raw_data_v2.jsonl         # Previous training data (NOT tracked)
├── GUILDBOARD_MASTER_DOC.md  # This document
├── future_improvements.md   # Feature backlog
├── ai_fine_tuning_guide.md   # AI training guide
├── .env                      # Secrets (NOT tracked)
└── vercel.json               # Vercel deployment config
```

### Environment Variables Required
```env
DATABASE_URL=              # PostgreSQL connection string
JWT_SECRET=                # Secret for signing JWTs
OLLAMA_API_URL=            # Local Ollama endpoint for Guild Dungeon Master
DISCORD_WEBHOOK_URL=       # For task status Discord notifications
```

---

## 👤 Author

**MayazAD** — Beyond Limiter Guild  
*"Not just a task manager. A legend in the making."*

---

*Last updated: April 30, 2026*
