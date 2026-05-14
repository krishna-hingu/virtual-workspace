const {
  generateWorkPressureAlert,
  suggestBreak,
} = require("../../utils/aiEngine");
const WorkSession = require("../../models/WorkSession");
const InteractionLog = require("../../models/InteractionLog");

const handleNotifications = (io, socket) => {
  socket.on("notification:check", async () => {
    try {
      const currentUser = require("../store").getUser(socket.id);
      if (!currentUser) return;

      // Check work pressure
      const pressureAlert = await checkWorkPressure(currentUser.userId);
      if (pressureAlert) {
        socket.emit("notification:alert", pressureAlert);
      }

      // Check for break suggestions
      const breakSuggestion = await checkBreakSuggestion(currentUser.userId);
      if (breakSuggestion) {
        socket.emit("ai:suggestion", breakSuggestion);
      }
    } catch (error) {
      console.error("Notification check error:", error);
    }
  });

  socket.on("session:start", async (data) => {
    try {
      const currentUser = require("../store").getUser(socket.id);
      if (!currentUser) return;

      // Check if already has active session
      const existingSession = await WorkSession.findOne({
        userId: currentUser.userId,
        clockOutTime: null,
      });

      if (existingSession) {
        socket.emit("session:error", { message: "Session already active" });
        return;
      }

      const session = new WorkSession({
        userId: currentUser.userId,
        clockInTime: new Date(),
        date: new Date().toISOString().split("T")[0],
      });

      await session.save();

      socket.emit("session:started", { session });
    } catch (error) {
      console.error("Session start error:", error);
      socket.emit("session:error", { message: "Failed to start session" });
    }
  });

  socket.on("session:end", async () => {
    try {
      const currentUser = require("../store").getUser(socket.id);
      if (!currentUser) return;

      const session = await WorkSession.findOne({
        userId: currentUser.userId,
        clockOutTime: null,
      });

      if (!session) {
        socket.emit("session:error", { message: "No active session" });
        return;
      }

      session.clockOutTime = new Date();
      const durationMs = session.clockOutTime - session.clockInTime;
      session.totalMinutes = Math.floor(durationMs / (1000 * 60));

      await session.save();

      socket.emit("session:ended", {
        session,
        duration: session.totalMinutes,
      });
    } catch (error) {
      console.error("Session end error:", error);
      socket.emit("session:error", { message: "Failed to end session" });
    }
  });
};

const checkWorkPressure = async (userId) => {
  try {
    // Get recent tasks (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTasks = await require("../../models/Task").countDocuments({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      createdAt: { $gte: weekAgo },
    });

    // Get recent interruptions
    const recentInterruptions = await InteractionLog.countDocuments({
      targetUserId: userId,
      type: "focus_interrupt",
      createdAt: { $gte: weekAgo },
    });

    // Get active session
    const activeSession = await WorkSession.findOne({
      userId,
      clockOutTime: null,
    });

    let currentSessionHours = 0;
    if (activeSession) {
      const durationMs = Date.now() - activeSession.clockInTime;
      currentSessionHours = durationMs / (1000 * 60 * 60);
    }

    // Calculate score
    const taskScore = Math.min(recentTasks * 10, 40);
    const interruptionScore = Math.min(recentInterruptions * 15, 30);
    const sessionScore = Math.min(currentSessionHours * 10, 30);
    const totalScore = taskScore + interruptionScore + sessionScore;

    return generateWorkPressureAlert(totalScore, {
      recentTasks,
      recentInterruptions,
      currentSessionHours,
    });
  } catch (error) {
    console.error("Work pressure check error:", error);
    return null;
  }
};

const checkBreakSuggestion = async (userId) => {
  try {
    const activeSession = await WorkSession.findOne({
      userId,
      clockOutTime: null,
    });

    if (!activeSession) return null;

    const sessionDuration = Date.now() - activeSession.clockInTime;

    const recentInterruptions = await InteractionLog.countDocuments({
      targetUserId: userId,
      type: "focus_interrupt",
      createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // last 4 hours
    });

    return suggestBreak(sessionDuration, recentInterruptions);
  } catch (error) {
    console.error("Break suggestion check error:", error);
    return null;
  }
};

module.exports = handleNotifications;
