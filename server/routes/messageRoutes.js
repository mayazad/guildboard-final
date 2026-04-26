const express = require('express');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/',  authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);

module.exports = router;
