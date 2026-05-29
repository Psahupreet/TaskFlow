const express = require('express');
const router = express.Router();
const { getAdminDashboard, getMemberDashboard } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', adminOnly, getAdminDashboard);
router.get('/member', getMemberDashboard);

module.exports = router;
