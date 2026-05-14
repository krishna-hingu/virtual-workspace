const InteractionLog = require("../models/InteractionLog");
const WorkSession = require("../models/WorkSession");
const Task = require("../models/Task");

// ==============================
// Get Interaction Heatmap
// ==============================
const getHeatmap = async (req, res) => {
  try {
    const interactions = await InteractionLog.aggregate([
      {
        $group: {
          _id: {
            userId: "$userId",
            targetUserId: "$targetUserId",
          },
          count: { $sum: 1 },
          lastInteraction: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.targetUserId",
          foreignField: "_id",
          as: "targetUser",
        },
      },
      {
        $project: {
          user: { $arrayElemAt: ["$user.name", 0] },
          targetUser: { $arrayElemAt: ["$targetUser.name", 0] },
          count: 1,
          lastInteraction: 1,
        },
      },
    ]);

    res.json(interactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Analytics Summary
// ==============================
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Work sessions summary
    const sessions = await WorkSession.find({ userId });
    const totalHours =
      sessions.reduce((sum, session) => sum + (session.totalMinutes || 0), 0) /
      60;

    // Task summary
    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    });

    const taskStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
    };

    // Interaction summary
    const interactions = await InteractionLog.countDocuments({
      $or: [{ userId }, { targetUserId: userId }],
    });

    res.json({
      workHours: Math.round(totalHours * 100) / 100,
      tasks: taskStats,
      totalInteractions: interactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Work Pressure Score
// ==============================
const getWorkPressure = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent tasks (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTasks = await Task.countDocuments({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      createdAt: { $gte: weekAgo },
    });

    // Get recent interruptions
    const recentInterruptions = await InteractionLog.countDocuments({
      targetUserId: userId,
      type: "focus_interrupt",
      createdAt: { $gte: weekAgo },
    });

    // Get active session duration
    const activeSession = await WorkSession.findOne({
      userId,
      clockOutTime: null,
    });

    let currentSessionHours = 0;
    if (activeSession) {
      const durationMs = Date.now() - activeSession.clockInTime;
      currentSessionHours = durationMs / (1000 * 60 * 60);
    }

    // Calculate pressure score (0-100)
    const taskScore = Math.min(recentTasks * 10, 40);
    const interruptionScore = Math.min(recentInterruptions * 15, 30);
    const sessionScore = Math.min(currentSessionHours * 10, 30);

    const totalScore = taskScore + interruptionScore + sessionScore;

    let level = "low";
    if (totalScore > 70) level = "high";
    else if (totalScore > 40) level = "moderate";

    res.json({
      score: Math.round(totalScore),
      level,
      factors: {
        recentTasks: recentTasks,
        recentInterruptions: recentInterruptions,
        currentSessionHours: Math.round(currentSessionHours * 100) / 100,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Interruption Logs
// ==============================
const getInterruptionLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get interruption logs for current user
    const interruptions = await InteractionLog.find({
      $or: [{ userId }, { targetUserId: userId }],
      type: "focus_interrupt",
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ interruptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHeatmap,
  getSummary,
  getWorkPressure,
  getInterruptionLogs,
};
