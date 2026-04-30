const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { logAiFeedback } = require('../controllers/aiLogsController');

router.post('/feedback', authenticateToken, logAiFeedback);

module.exports = router;
