const ActivityLog = require("../models/ActivityLog");

// ==============================
// Real-time Activity Tracking
// ==============================

// Track user login
const trackLogin = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    await ActivityLog.create({
      user: req.user.id,
      type: "login",
      message: "User logged in",
      context: "normal",
      isActive: true,
      sessionId,
      intensity: 1,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Login tracked" });
  } catch (error) {
    console.error("Login tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track user logout
const trackLogout = async (req, res) => {
  try {
    await ActivityLog.create({
      user: req.user.id,
      type: "logout",
      message: "User logged out",
      context: "normal",
      isActive: false,
      intensity: 1
    });

    res.json({ success: true, message: "Logout tracked" });
  } catch (error) {
    console.error("Logout tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track task creation
const trackTaskCreate = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    await ActivityLog.create({
      user: req.user.id,
      type: "task_create",
      message: `Created task: ${title}`,
      metadata: { title, description },
      context: "focus",
      intensity: 3,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Task creation tracked" });
  } catch (error) {
    console.error("Task create tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track task update
const trackTaskUpdate = async (req, res) => {
  try {
    const { taskId, status, title } = req.body;
    
    await ActivityLog.create({
      user: req.user.id,
      type: "task_update",
      message: `Updated task: ${title} to ${status}`,
      metadata: { taskId, status, title },
      context: "focus",
      intensity: 2,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Task update tracked" });
  } catch (error) {
    console.error("Task update tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track task completion
const trackTaskComplete = async (req, res) => {
  try {
    const { taskId, title } = req.body;
    
    await ActivityLog.create({
      user: req.user.id,
      type: "task_complete",
      message: `Completed task: ${title}`,
      metadata: { taskId, title },
      context: "focus",
      intensity: 5,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Task completion tracked" });
  } catch (error) {
    console.error("Task complete tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track movement
const trackMovement = async (req, res) => {
  try {
    const { x, y, z, room } = req.body;
    
    await ActivityLog.create({
      user: req.user.id,
      type: "movement",
      message: `User moved to position (${x}, ${y}, ${z})`,
      metadata: { x, y, z, room },
      context: "normal",
      intensity: 1,
      coordinates: { x, y, z }
    });

    res.json({ success: true, message: "Movement tracked" });
  } catch (error) {
    console.error("Movement tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track workspace interaction
const trackWorkspaceInteraction = async (req, res) => {
  try {
    const { action, element, details } = req.body;
    
    await ActivityLog.create({
      user: req.user.id,
      type: "workspace_interaction",
      message: `User ${action} ${element}`,
      metadata: { action, element, details },
      context: "focus",
      intensity: 2,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Workspace interaction tracked" });
  } catch (error) {
    console.error("Workspace interaction tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track focus session start
const trackFocusStart = async (req, res) => {
  try {
    await ActivityLog.create({
      user: req.user.id,
      type: "focus_start",
      message: "Focus session started",
      context: "focus",
      isActive: true,
      intensity: 4,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Focus start tracked" });
  } catch (error) {
    console.error("Focus start tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track focus session end
const trackFocusEnd = async (req, res) => {
  try {
    await ActivityLog.create({
      user: req.user.id,
      type: "focus_end",
      message: "Focus session ended",
      context: "focus",
      isActive: false,
      intensity: 1,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Focus end tracked" });
  } catch (error) {
    console.error("Focus end tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track interruption
const trackInterruption = async (req, res) => {
  try {
    const { reason, duration } = req.body;
    
    await ActivityLog.create({
      user: req.user.id,
      type: "interruption",
      message: `Interruption: ${reason}`,
      metadata: { reason, duration },
      context: "interruption",
      isActive: false,
      intensity: 3,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Interruption tracked" });
  } catch (error) {
    console.error("Interruption tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track idle start
const trackIdleStart = async (req, res) => {
  try {
    await ActivityLog.create({
      user: req.user.id,
      type: "idle_start",
      message: "User became idle",
      context: "idle",
      isActive: false,
      intensity: 1,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Idle start tracked" });
  } catch (error) {
    console.error("Idle start tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Track idle end
const trackIdleEnd = async (req, res) => {
  try {
    await ActivityLog.create({
      user: req.user.id,
      type: "idle_end",
      message: "User became active again",
      context: "normal",
      isActive: true,
      intensity: 1,
      coordinates: { x: 0, y: 0, z: 0 }
    });

    res.json({ success: true, message: "Idle end tracked" });
  } catch (error) {
    console.error("Idle end tracking error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Activity Logs (Role-based Filtering)
// ==============================
const getActivity = async (req, res) => {
  try {
    let query = {};
    
    // Role-based activity filtering
    if (req.user.role === "admin") {
      // Admin can see all activity
      query = {};
    } else if (req.user.role === "lead") {
      // Lead can see team activity (for now, all activity - in real implementation, would filter by team)
      query = {};
    } else {
      // Employee can only see their own activity
      query = { user: req.user.id };
    }

    const activity = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name role");

    res.json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get real-time heatmap data
const getHeatmapData = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = 7; // Last 7 days
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    const activity = await ActivityLog.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Generate heatmap data (7 days x 24 hours)
    const heatmapData = Array.from({ length: 7 }, (_, dayIndex) => 
      Array.from({ length: 24 }, (_, hourIndex) => {
        const hourStart = new Date(startDate);
        hourStart.setDate(startDate.getDate() + dayIndex);
        hourStart.setHours(hourIndex, 0, 0, 0);
        
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourIndex + 1, 0, 0, 0);

        const hourActivity = activity.filter(item => {
          const itemTime = new Date(item.createdAt);
          return itemTime >= hourStart && itemTime < hourEnd;
        });

        return {
          hour: hourIndex,
          day: dayIndex,
          activityCount: hourActivity.length,
          intensity: hourActivity.reduce((sum, item) => sum + (item.intensity || 1), 0)
        };
      })
    );

    res.json(heatmapData);
  } catch (error) {
    console.error("Heatmap data error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActivity,
  getHeatmapData,
  trackLogin,
  trackLogout,
  trackTaskCreate,
  trackTaskUpdate,
  trackTaskComplete,
  trackMovement,
  trackWorkspaceInteraction,
  trackFocusStart,
  trackFocusEnd,
  trackInterruption,
  trackIdleStart,
  trackIdleEnd,
};
