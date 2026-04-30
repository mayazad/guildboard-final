const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/personalNotesController');

router.get('/',    authenticateToken, getAllNotes);
router.post('/',   authenticateToken, createNote);
router.put('/:id', authenticateToken, updateNote);
router.delete('/:id', authenticateToken, deleteNote);

module.exports = router;
