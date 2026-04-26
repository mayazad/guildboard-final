const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const taskRoutes      = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes        = require('./routes/aiRoutes');
const guildsRoutes    = require('./routes/guildsRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/guilds',    guildsRoutes);
app.use('/api/tasks',     aiRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GuildBoard API is running on Vercel' });
});

// For local dev, uncomment app.listen
// app.listen(5001, () => console.log('Server running on 5001'));

// For Vercel, export the app
module.exports = app;
