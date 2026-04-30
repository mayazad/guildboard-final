const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
const authRoutes      = require('../server/routes/authRoutes');
const userRoutes      = require('../server/routes/userRoutes');
const taskRoutes      = require('../server/routes/taskRoutes');
const analyticsRoutes = require('../server/routes/analyticsRoutes');
const aiRoutes        = require('../server/routes/aiRoutes');
const aiLogsRoutes    = require('../server/routes/aiLogsRoutes');
const guildsRoutes    = require('../server/routes/guildsRoutes');
const messageRoutes   = require('../server/routes/messageRoutes');

const questLogRoutes  = require('../server/routes/questLogRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/guilds',    guildsRoutes);
app.use('/api/tasks',     aiRoutes);
app.use('/api/ai/logs',   aiLogsRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages',  messageRoutes);
app.use('/api/quest-log', questLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GuildBoard API is running on Vercel' });
});

module.exports = app;
