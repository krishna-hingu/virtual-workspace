const { updateUserPosition, getAllUserPositions } = require("../store");
const {
  findNearbyUsers,
  getProximityStatus,
} = require("../../utils/proximityEngine");
const InteractionLog = require("../../models/InteractionLog");

const handleMovement = (io, socket) => {
  socket.on("player:move", async (data) => {
    console.log("SERVER MOVE RECEIVED:", data);
    try {
      const { x, y } = data;
      console.log(`MOVE: ${socket.userId} -> x:${x}, y:${y}`);

      // Validate coordinates
      if (typeof x !== "number" || typeof y !== "number") {
        console.log("INVALID COORDINATES:", x, y);
        return;
      }

      // Update user position in store
      updateUserPosition(socket.userId, x, y);

      // Get current user
      const currentUser = require("../store").getUser(socket.userId);
      if (!currentUser) return;

      // Find nearby users
      const allUsers = require("../store").getAllUsers();
      const nearbyUsers = findNearbyUsers(currentUser, allUsers);

      // Check proximity changes
      const previousNearby = socket.previousNearby || [];
      const newNearby = nearbyUsers.map((u) => u.socketId);

      // Users who just came into proximity
      const entered = newNearby.filter((id) => !previousNearby.includes(id));

      // Users who just left proximity
      const left = previousNearby.filter((id) => !newNearby.includes(id));

      // Send proximity enter events
      entered.forEach((targetSocketId) => {
        const targetUser = allUsers.find((u) => u.socketId === targetSocketId);
        if (targetUser) {
          // Log interaction
          const interaction = new InteractionLog({
            userId: currentUser.userId,
            targetUserId: targetUser.userId,
            type: "approach",
            distance: getProximityStatus(currentUser, targetUser).distance,
            position: { x, y },
          });
          interaction.save();

          // Notify both users
          io.to(socket.id).emit("proximity:enter", {
            user: targetUser,
            distance: getProximityStatus(currentUser, targetUser).distance,
          });

          io.to(targetSocketId).emit("proximity:enter", {
            user: currentUser,
            distance: getProximityStatus(currentUser, targetUser).distance,
          });
        }
      });

      // Send proximity exit events
      left.forEach((targetSocketId) => {
        const targetUser = allUsers.find((u) => u.socketId === targetSocketId);
        if (targetUser) {
          io.to(socket.id).emit("proximity:exit", { user: targetUser });
          io.to(targetSocketId).emit("proximity:exit", { user: currentUser });
        }
      });

      // Update previous nearby for next comparison
      socket.previousNearby = newNearby;

      // Broadcast only the moving player to other clients
      console.log("SERVER MOVE BROADCAST");
      socket.broadcast.emit("player:moved", {
        id: socket.userId,
        x,
        y,
        name: currentUser.name,
        focusMode: currentUser.focusMode || false,
      });
    } catch (error) {
      console.error("Movement error:", error);
    }
  });
};

module.exports = handleMovement;
