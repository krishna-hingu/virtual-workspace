const User = require("../models/User");
const WorkSession = require("../models/WorkSession");
const Task = require("../models/Task");
const ActivityLog = require("../models/ActivityLog");
const Notification = require("../models/Notification");
const { getIo } = require("../socket/index");

// ==============================
// Workspace Overview
// ==============================
const getOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSessions = await WorkSession.countDocuments({
      clockOutTime: null,
    });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "done" });

    // System health: ratio of interruptions to total activity in last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivityCount = await ActivityLog.countDocuments({
      createdAt: { $gte: dayAgo },
    });
    const recentInterruptions = await ActivityLog.countDocuments({
      type: "interruption",
      createdAt: { $gte: dayAgo },
    });

    const healthScore =
      recentActivityCount > 0
        ? Math.max(0, 100 - (recentInterruptions / recentActivityCount) * 1000)
        : 100;

    res.json({
      totalUsers,
      activeSessions,
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        completionRate:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      systemHealth: Math.round(healthScore),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// User Management
// ==============================
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!["employee", "lead", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    ).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Aggregated Analytics
// ==============================
const getAnalytics = async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Aggregated focus hours from sessions
    const sessions = await WorkSession.find({ clockInTime: { $gte: weekAgo } });
    const totalMinutes = sessions.reduce(
      (sum, s) => sum + (s.totalMinutes || 0),
      0,
    );

    // Workspace utilization: Unique users active per day
    const utilization = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
      { $project: { date: "$_id", count: { $size: "$uniqueUsers" }, _id: 0 } },
      { $sort: { date: 1 } },
    ]);

    res.json({
      totalFocusHours: Math.round(totalMinutes / 60),
      utilization,
      period: "last_7_days",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Broadcast Center
// ==============================
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type = "system" } = req.body;

    // In this system, notifications are currently tied to users in the model,
    // but we can create a system-wide announcement by creating notifications for all users
    // or simply broadcasting via socket (handled in the controller for now)

    const users = await User.find({}, "_id");
    const notifications = users.map((user) => ({
      user: user._id,
      type: "system_announcement",
      title,
      message,
      read: false,
    }));

    await Notification.insertMany(notifications);

    // Broadcast via socket
    const io = getIo();
    if (io) {
      io.emit("notification:new", {
        type: "system_announcement",
        title,
        message,
        timestamp: new Date(),
        read: false,
      });
    }

    res.json({ message: "Broadcast sent to all users", count: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOverview,
  getUsers,
  updateUserRole,
  getAnalytics,
  broadcastNotification,
};
