const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getTodos, createTodo, updateTodo, deleteTodo } = require('../controllers/todoController');

router.get('/',     authenticateToken, getTodos);
router.post('/',    authenticateToken, createTodo);
router.patch('/:id',  authenticateToken, updateTodo);
router.delete('/:id', authenticateToken, deleteTodo);

module.exports = router;
