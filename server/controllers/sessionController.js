const WorkSession = require("../models/WorkSession");
const ActivityLog = require("../models/ActivityLog");

// ==============================
// Clock In
// ==============================
const clockIn = async (req, res) => {
  try {
    // Check active session
    const existingSession = await WorkSession.findOne({
      userId: req.user.id,
      clockOutTime: null,
    });

    if (existingSession) {
      return res.status(400).json({ message: "Already clocked in" });
    }

    const session = new WorkSession({
      userId: req.user.id,
      clockInTime: new Date(),
      date: new Date().toISOString().split("T")[0],
      interruptionCount: 0,
    });

    await session.save();

    // Create ActivityLog entry for session start
    await ActivityLog.create({
      user: req.user.id,
      type: "session_start",
      message: "Started work session",
      context: "normal",
      isActive: true,
      metadata: {
        sessionId: session._id,
        clockInTime: session.clockInTime
      }
    });

    res.status(201).json({
      message: "Clocked in successfully",
      session,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Clock Out
// ==============================
const clockOut = async (req, res) => {
  try {
    const session = await WorkSession.findOne({
      userId: req.user.id,
      clockOutTime: null,
    });

    if (!session) {
      return res.status(400).json({ message: "No active session found" });
    }

    session.clockOutTime = new Date();

    // Calculate total minutes
    const durationMs = session.clockOutTime - session.clockInTime;
    const totalMinutes = Math.floor(durationMs / (1000 * 60));

    session.totalMinutes = totalMinutes;

    await session.save();

    // Create ActivityLog entry for session completion
    await ActivityLog.create({
      user: req.user.id,
      type: "session_end",
      message: `Completed work session (${totalMinutes}m)`,
      context: "normal",
      isActive: false,
      duration: totalMinutes,
      metadata: {
        sessionId: session._id,
        clockInTime: session.clockInTime,
        clockOutTime: session.clockOutTime,
        totalMinutes
      }
    });

    res.json({
      message: "Clocked out successfully",
      session,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Session History
// ==============================
const getSessions = async (req, res) => {
  try {
    const sessions = await WorkSession.find({
      userId: req.user.id,
    }).sort({ clockInTime: -1 });

    res.json(sessions);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get Active Session (IMPORTANT)
// ==============================
const getActiveSession = async (req, res) => {
  try {
    const session = await WorkSession.findOne({
      userId: req.user.id,
      clockOutTime: null,
    });

    res.json(session || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Cleanup Abandoned Sessions (MAINTENANCE)
// ==============================
const cleanupAbandonedSessions = async (req, res) => {
  try {
    // Find sessions older than 24 hours that are still active
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const abandonedSessions = await WorkSession.find({
      clockOutTime: null,
      clockInTime: { $lt: cutoffTime }
    });

    // Auto-clock-out abandoned sessions
    const updatedSessions = await Promise.all(
      abandonedSessions.map(async (session) => {
        session.clockOutTime = session.clockInTime; // Mark as same-day session
        session.totalMinutes = 0; // No credit for abandoned sessions
        await session.save();
        return {
          sessionId: session._id,
          userId: session.userId,
          clockInTime: session.clockInTime,
          cleanedUpAt: new Date()
        };
      })
    );

    console.log(`🧹 Cleaned up ${updatedSessions.length} abandoned sessions`);
    
    res.json({
      message: `Cleaned up ${updatedSessions.length} abandoned sessions`,
      cleanedSessions: updatedSessions
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Force End Session (ADMIN/EMERGENCY)
// ==============================
const forceEndSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.id;

    const session = await WorkSession.findOne({
      userId: targetUserId,
      clockOutTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: "No active session found" });
    }

    session.clockOutTime = new Date();
    const durationMs = session.clockOutTime - session.clockInTime;
    session.totalMinutes = Math.floor(durationMs / (1000 * 60));

    await session.save();

    console.log(`🔒 Force ended session for user ${targetUserId}`);

    res.json({
      message: "Session force ended",
      session,
    });
  } catch (error) {
    console.error("Force session end error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getSessions,
  getActiveSession,
  cleanupAbandonedSessions,
  forceEndSession,
};
