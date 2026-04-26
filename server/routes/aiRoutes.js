const express = require('express');
const { generateSubquests } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// This route MUST be registered BEFORE the /:id/... parameterized routes
// It is mounted under /api/tasks in index.js
router.post('/generate-subquests', authenticateToken, generateSubquests);

module.exports = router;
