const express = require('express');
const router = express.Router();
const {
  getTasks, getTodayTasks, getTaskById, createTask, updateTask, deleteTask, addComment, getTaskStats,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/today', getTodayTasks);
router.get('/stats', adminOnly, getTaskStats);
router.get('/', getTasks);
router.post('/', adminOnly, createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', adminOnly, deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
