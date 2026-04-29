const express = require('express');
const { getGuildActivities, getMyNotes } = require('../controllers/questLogController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/activities', authenticateToken, getGuildActivities);
router.get('/notes/mine', authenticateToken, getMyNotes);

module.exports = router;
