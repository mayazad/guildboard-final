const express = require('express');
const { getTasks, updateTaskStatus, createTask, reviewTask, deleteTask } = require('../controllers/taskController');
const { getJourney } = require('../controllers/journeyController');
const { getNotes, saveNote } = require('../controllers/notesController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/',                authenticateToken, getTasks);
router.post('/',               authenticateToken, createTask);
router.put('/:id/status',      authenticateToken, updateTaskStatus);
router.post('/:id/review',     authenticateToken, reviewTask);
router.delete('/:id',          authenticateToken, deleteTask);
router.get('/:id/journey',     authenticateToken, getJourney);
router.get('/:id/notes',       authenticateToken, getNotes);
router.post('/:id/notes',      authenticateToken, saveNote);

module.exports = router;
