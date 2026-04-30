const express = require('express');
const { generateSubquests, suggestXP } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// This route MUST be registered BEFORE the /:id/... parameterized routes
// It is mounted under /api/tasks in index.js
router.post('/generate-subquests', authenticateToken, generateSubquests);
router.post('/suggest-xp', authenticateToken, suggestXP);

module.exports = router;
