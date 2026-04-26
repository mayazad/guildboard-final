const express = require('express');
const { getAnalytics, getMonthlyAnalytics } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/',        authenticateToken, getAnalytics);
router.get('/monthly', authenticateToken, getMonthlyAnalytics);

module.exports = router;
