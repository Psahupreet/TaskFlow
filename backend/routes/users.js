const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, getUserTasks, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', adminOnly, getAllUsers);
router.post('/', adminOnly, createUser);
router.get('/:id', getUserById);
router.put('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);
router.get('/:id/tasks', getUserTasks);

module.exports = router;
