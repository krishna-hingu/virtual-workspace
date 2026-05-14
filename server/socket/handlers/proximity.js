const { updateUserFocus } = require("../store");
const { suggestFocusMode } = require("../../utils/aiEngine");
const InteractionLog = require("../../models/InteractionLog");

const handleProximity = (io, socket) => {
  socket.on("focus:toggle", async (data) => {
    try {
      const { focusMode } = data;
      const currentUser = require("../store").getUser(socket.userId);

      if (!currentUser) return;

      // Update focus mode
      updateUserFocus(socket.userId, focusMode);

      // Log focus interrupt if turning off focus mode
      if (!focusMode) {
        console.log("[DEBUG] Focus mode disabled for user:", currentUser.userId);

        const recentInteractions = await InteractionLog.find({
          targetUserId: currentUser.userId,
          type: "focus_interrupt",
          createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // last 30 min
        });

        console.log("[DEBUG] Recent interactions count:", recentInteractions.length);

        if (recentInteractions.length > 0) {
          const interaction = new InteractionLog({
            userId: currentUser.userId,
            targetUserId: currentUser.userId,
            type: "focus_interrupt",
            position: { x: currentUser.x, y: currentUser.y },
          });
          await interaction.save();
          console.log("[DEBUG] Focus interrupt InteractionLog saved:", interaction);
        }
      }

      // Broadcast focus change
      socket.broadcast.emit("focus:updated", {
        userId: currentUser.userId,
        focusMode,
      });

      // Send confirmation
      socket.emit("focus:confirmed", { focusMode });
    } catch (error) {
      console.error("Focus toggle error:", error);
    }
  });

  // Handle proximity-based notifications
  socket.on("proximity:check", () => {
    const currentUser = require("../store").getUser(socket.userId);
    if (!currentUser) return;

    // Check for focus mode suggestions
    InteractionLog.find({
      targetUserId: currentUser.userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    }).then((interactions) => {
      const suggestion = suggestFocusMode(interactions, currentUser.focusMode);
      if (suggestion) {
        socket.emit("ai:suggestion", suggestion);
      }
    });
  });
};

module.exports = handleProximity;
