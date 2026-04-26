const express = require('express');
const { getTasks, updateTaskStatus, createTask, reviewTask, deleteTask } = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/',           authenticateToken, getTasks);
router.post('/',          authenticateToken, createTask);
router.put('/:id/status', authenticateToken, updateTaskStatus);
router.post('/:id/review',authenticateToken, reviewTask);
router.delete('/:id',     authenticateToken, deleteTask);

module.exports = router;
