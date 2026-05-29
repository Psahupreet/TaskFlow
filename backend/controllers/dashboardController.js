const Task = require('../models/Task');
const User = require('../models/User');

// @route GET /api/dashboard  (admin)
const getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalTasks,
      completedToday,
      pendingTasks,
      inProgressTasks,
      overdueCount,
      totalMembers,
      todayAssigned,
      recentTasks,
      memberWorkload,
    ] = await Promise.all([
      Task.countDocuments({ isArchived: false }),
      Task.countDocuments({ status: 'completed', completedAt: { $gte: today, $lt: tomorrow } }),
      Task.countDocuments({ status: 'pending', isArchived: false }),
      Task.countDocuments({ status: 'in-progress', isArchived: false }),
      Task.countDocuments({ dueDate: { $lt: today }, status: { $ne: 'completed' }, isArchived: false }),
      User.countDocuments({ role: 'member', isActive: true }),
      Task.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, isArchived: false }),
      Task.find({ isArchived: false })
        .populate('assignedTo', 'name avatar')
        .populate('assignedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Task.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: '$assignedTo',
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          },
        },
        {
          $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            avatar: '$user.avatar',
            department: '$user.department',
            total: 1,
            completed: 1,
            pending: 1,
            inProgress: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: { totalTasks, completedToday, pendingTasks, inProgressTasks, overdueCount, totalMembers, todayAssigned },
        recentTasks,
        memberWorkload,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/dashboard/member  (member)
const getMemberDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [myTasks, todayTasks, stats] = await Promise.all([
      Task.find({ assignedTo: userId, isArchived: false })
        .populate('assignedBy', 'name avatar')
        .sort({ dueDate: 1 })
        .limit(20),
      Task.find({ assignedTo: userId, isArchived: false, createdAt: { $gte: today, $lt: tomorrow } })
        .populate('assignedBy', 'name avatar')
        .sort({ priority: -1 }),
      Task.aggregate([
        { $match: { assignedTo: userId, isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statsMap = stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});

    res.json({
      success: true,
      dashboard: {
        stats: {
          total: myTasks.length,
          completed: statsMap['completed'] || 0,
          pending: statsMap['pending'] || 0,
          inProgress: statsMap['in-progress'] || 0,
          onHold: statsMap['on-hold'] || 0,
        },
        todayTasks,
        myTasks,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAdminDashboard, getMemberDashboard };
