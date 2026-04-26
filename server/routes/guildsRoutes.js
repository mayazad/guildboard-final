const express = require('express');
const { createGuild, joinGuild, getMyGuild } = require('../controllers/guildsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/',        authenticateToken, createGuild);
router.post('/join',    authenticateToken, joinGuild);
router.get('/me',       authenticateToken, getMyGuild);

module.exports = router;
