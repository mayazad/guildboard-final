const express = require('express');
const { getUsers, getMe, getProfile } = require('../controllers/userController');
const { authenticateToken, requireGuild } = require('../middleware/auth');

const router = express.Router();

// No guild required — used immediately after register/login to determine redirect
router.get('/me',      authenticateToken, getMe);

// Guild required — user list is guild-scoped
router.get('/profile', authenticateToken, getProfile);
router.get('/',        authenticateToken, requireGuild, getUsers);

module.exports = router;
