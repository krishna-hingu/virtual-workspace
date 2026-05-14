// Socket handlers for task-related realtime broadcasts
// NOTE: These handlers do NOT perform database operations
// All DB operations go through REST API controllers
// These handlers only broadcast realtime updates

const handleTasks = (io, socket) => {
  // Handle task assignment notifications (broadcast-only)
  socket.on("task:assigned", async (data) => {
    try {
      const { task } = data;
      if (!task) {
        console.error("Invalid task assignment data received");
        return;
      }

      // Send notification to assigned user if they're online
      if (task.assignedTo?.id) {
        const assignedUserSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === task.assignedTo.id);

        if (assignedUserSocket) {
          assignedUserSocket.emit("task:assigned", task);
        }
      }

    } catch (error) {
      console.error("TASK ASSIGNMENT ERROR:", error);
    }
  });
};

module.exports = handleTasks;
