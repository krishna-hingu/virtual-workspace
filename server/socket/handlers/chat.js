const store = require("../store");
const ActivityLog = require("../../models/ActivityLog");

const handleChat = (io, socket) => {
  socket.on("chat:send", async (data) => {
    console.log("SERVER CHAT RECEIVED:", data);
    console.log(
      "SERVER RECEIVED chat:send:",
      data,
      "socket.userId:",
      socket.userId,
    );
    const { receiverId, type } = data;

    const senderId = socket.user?.id || socket.userId;

    const payload = {
      ...data,
      senderId,
      timestamp: Date.now(),
    };

    // Log chat activity
    try {
      await ActivityLog.create({
        user: senderId,
        type: "chat",
        message: `Sent ${type === "dm" ? "DM" : "nearby chat"} message`,
        context: socket.user.focusMode ? "focus" : "normal",
      });
    } catch (err) {
      console.error("Error logging chat activity:", err);
    }

    console.log("SENDING BACK TO SENDER:", payload);

    // ✅ ALWAYS send back to sender
    console.log("SERVER BROADCAST CHAT TO SENDER");
    socket.emit("chat:receive", payload);

    if (type === "dm" && receiverId) {
      const receiver = store.getUser(receiverId);
      if (receiver?.socketId) {
        console.log("SENDING TO RECEIVER:", receiver.socketId);
        console.log("SERVER BROADCAST CHAT TO RECEIVER");
        io.to(receiver.socketId).emit("chat:receive", payload);
      }
    } else {
      // ✅ For nearby messages: send to everyone else too
      console.log("SENDING TO EVERYONE ELSE (nearby)");
      console.log("SERVER BROADCAST CHAT TO EVERYONE ELSE");
      socket.broadcast.emit("chat:receive", payload);
    }

    try {
      const User = require("../../models/User");

      console.log("CHAT EVENT TRIGGERED", data);

      // detect receiver safely
      const receiverId = data.receiver || data.targetUserId || null;

      let context = "normal";

      if (receiverId) {
        const receiver = await User.findById(receiverId).select("focusMode");
        if (receiver && receiver.focusMode === true) {
          context = "focus";
        }
      }

      await ActivityLog.create({
        user: socket.user.id,
        type: "chat",
        message: "Sent message",
        context: context,
      });

      console.log("ACTIVITY LOG CREATED");
    } catch (err) {
      console.error("ACTIVITY LOG ERROR:", err.message);
    }
  });
};

module.exports = handleChat;
