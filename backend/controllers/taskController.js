const Task = require('../models/Task');
const User = require('../models/User');

// @route GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, category, date, search } = req.query;
    const query = { isArchived: false };

    // Members can only see their own tasks
    if (req.user.role === 'member') query.assignedTo = req.user._id;
    else if (assignedTo) query.assignedTo = assignedTo;

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: start, $lte: end };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name avatar department')
      .populate('assignedBy', 'name avatar')
      .populate('comments.author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/tasks/today
const getTodayTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      isArchived: false,
      createdAt: { $gte: today, $lt: tomorrow },
    };
    if (req.user.role === 'member') query.assignedTo = req.user._id;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name avatar department')
      .populate('assignedBy', 'name avatar')
      .sort({ priority: 1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name avatar department')
      .populate('assignedBy', 'name avatar')
      .populate('comments.author', 'name avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Members can only view their own tasks
    if (req.user.role === 'member' && task.assignedTo._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/tasks  (admin)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, category, dueDate, tags } = req.body;

    const assigneeIds = Array.isArray(assignedTo) ? assignedTo.filter(Boolean) : [assignedTo].filter(Boolean);
    const uniqueAssigneeIds = [...new Set(assigneeIds.map((id) => id.toString()))];

    if (uniqueAssigneeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one assignee is required' });
    }

    const assignees = await User.find({ _id: { $in: uniqueAssigneeIds }, role: 'member' });
    if (assignees.length !== uniqueAssigneeIds.length) {
      return res.status(404).json({ success: false, message: 'One or more assigned users were not found' });
    }

    const taskPayloads = uniqueAssigneeIds.map((assigneeId) => ({
      title,
      description,
      assignedTo: assigneeId,
      assignedBy: req.user._id,
      priority,
      category,
      dueDate,
      tags: tags || [],
    }));

    const tasks = await Task.insertMany(taskPayloads);
    const populatedTasks = await Task.find({ _id: { $in: tasks.map((task) => task._id) } })
      .populate([
        { path: 'assignedTo', select: 'name avatar department' },
        { path: 'assignedBy', select: 'name avatar' },
      ])
      .sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      task: populatedTasks[0],
      tasks: populatedTasks,
      count: populatedTasks.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Members can only update status of their own tasks
    if (req.user.role === 'member') {
      if (task.assignedTo.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: 'Access denied' });
      const { status } = req.body;
      task.status = status || task.status;
    } else {
      // Admin can update everything
      const { title, description, assignedTo, priority, category, dueDate, status, tags } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo && assignedTo !== task.assignedTo.toString()) {
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) return res.status(404).json({ success: false, message: 'Assigned user not found' });
        task.assignedTo = assignedTo;
      }
      if (priority) task.priority = priority;
      if (category) task.category = category;
      if (dueDate) task.dueDate = dueDate;
      if (status) task.status = status;
      if (tags) task.tags = tags;
    }

    await task.save();
    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name avatar department')
      .populate('assignedBy', 'name avatar');

    res.json({ success: true, task: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/tasks/:id  (admin)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ author: req.user._id, text: req.body.text });
    await task.save();

    const updated = await Task.findById(task._id).populate('comments.author', 'name avatar');
    res.json({ success: true, comments: updated.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/tasks/stats  (admin)
const getTaskStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [statusStats, priorityStats, todayCount, overdueCount] = await Promise.all([
      Task.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({ isArchived: false, createdAt: { $gte: today, $lt: tomorrow } }),
      Task.countDocuments({ isArchived: false, dueDate: { $lt: today }, status: { $ne: 'completed' } }),
    ]);

    res.json({ success: true, stats: { statusStats, priorityStats, todayCount, overdueCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTasks, getTodayTasks, getTaskById, createTask, updateTask, deleteTask, addComment, getTaskStats };
