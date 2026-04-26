<div align="center">

# ⚔️ GuildBoard

### RPG-Themed Multi-Tenant Task Management Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://guildboard-final.vercel.app)
[![Built with React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Powered by Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e?logo=supabase)](https://supabase.com)
[![Express.js](https://img.shields.io/badge/Backend-Express.js-000000?logo=express)](https://expressjs.com)

*Transform your team into a guild. Complete quests. Earn XP. Rise through the ranks.*

</div>

---

## ✨ Features

- **🏰 Guild System** — Create or join a guild using invite codes. Full multi-tenant data isolation.
- **📋 Kanban Quest Board** — Drag-and-drop task management across 4 stages: Assigned → In Progress → Review/Council → Verified.
- **⚔️ RPG Progression** — Earn XP for completing tasks. Level up. Role-based hierarchy (Leader, Officer, Member).
- **🛡️ Council Reviews** — Council members review submitted tasks and apply quality multipliers (Flawless 1.2×, Acceptable 1.0×, Poor 0.7×).
- **🤖 AI Sub-Quests** — Automatically break complex tasks into sub-quests using OpenAI.
- **📊 Hall of Fame** — Analytics dashboard with XP leaderboards, Perfectionist and Speedster rankings, and XP-over-time charts.
- **🎨 RPG-Themed UI** — Framer Motion animations, GSAP effects, glassmorphism design with a dark RPG aesthetic.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v3 |
| Animations | Framer Motion, GSAP |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Backend | Express.js (Vercel Serverless) |
| Database | PostgreSQL via Supabase |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI | OpenAI API |
| Hosting | Vercel |

---

## 📁 Project Structure

```
guildboard-final/
├── api/
│   └── index.js             # Express app entry point (Vercel Serverless Function)
├── server/
│   ├── controllers/         # Business logic (auth, tasks, guilds, analytics, AI)
│   ├── routes/              # Express route definitions
│   ├── middleware/          # JWT auth middleware
│   └── db/                  # PostgreSQL connection pool (Supabase)
├── src/
│   ├── components/          # React UI components
│   ├── pages/               # Route-level pages
│   ├── api.js               # API helper
│   └── App.jsx              # Router setup
├── schema.sql               # Full PostgreSQL schema
├── vercel.json              # Vercel routing config
└── vite.config.mjs          # Vite build config
```

---

## 🚀 Deployment

This project is deployed as a **unified monorepo on Vercel**. The React frontend is served as static assets, and the Express backend runs as a single Serverless Function at `/api`.

### Deploy Your Own

1. **Fork** this repository.
2. Connect the fork to your **Vercel** account.
3. Set the following **Environment Variables** in Vercel:

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | Supabase Transaction Pooler connection string |
   | `JWT_SECRET` | A long, random secret string for signing tokens |
   | `OPENAI_API_KEY` | OpenAI API key (optional, for AI sub-quest generation) |

4. Click **Deploy**. Vercel handles the rest.

> **Important:** Use the Supabase **Transaction Pooler** connection string (port 6543), not the direct connection. You can find it in your Supabase dashboard under **Settings → Database → Connection pooling**.

---

## 🗄️ Database Setup

After creating a Supabase project:

1. Go to **SQL Editor** in your Supabase dashboard.
2. Copy the contents of [`schema.sql`](./schema.sql).
3. Paste and run it. This creates all required tables.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- A Supabase project (free tier is fine)

### Setup

```bash
# Clone the repo
git clone https://github.com/mayazad/guildboard-final.git
cd guildboard-final

# Install all dependencies
npm install

# Create your local env file
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, OPENAI_API_KEY

# Run the frontend (Vite dev server)
npm run dev

# In a separate terminal, run the backend
# First uncomment app.listen() in api/index.js, then:
node api/index.js
```

---

## 🎮 How It Works

1. **Register** and create an account.
2. **Create a Guild** — you become the Leader. An invite code is generated.
3. **Invite teammates** — share the invite code so they can join your guild.
4. **Create Quests** — assign tasks to guild members with XP values and deadlines.
5. **Move Quests** — drag cards across the board as work progresses.
6. **Council Review** — when a quest reaches Review/Council, officers or leaders verify it and apply a quality multiplier.
7. **Earn XP** — completing and verifying quests awards XP based on quality and speed bonuses.
8. **Hall of Fame** — track who's crushing it on the leaderboard.

---

## 📄 License

MIT © 2025 mayazad
