const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { logAiFeedback } = require('../controllers/aiLogsController');

router.post('/feedback', auth, logAiFeedback);

module.exports = router;
