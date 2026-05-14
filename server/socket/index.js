const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Import handlers
const handleMovement = require("./handlers/movement");
const handleChat = require("./handlers/chat");
const handleProximity = require("./handlers/proximity");
const handleNotifications = require("./handlers/notifications");
const handleTasks = require("./handlers/tasks");

// Import store
// Helper function to broadcast notifications
const broadcastNotification = (io, type, title, message, user, taskId = null) => {
  const notification = {
    id: Date.now() + Math.random(), // Unique ID
    type,
    title,
    message,
    user: user?.name || 'Unknown',
    timestamp: new Date(),
    taskId,
    read: false
  };
  
  console.log('BROADCASTING NOTIFICATION:', notification);
  io.emit('notification:new', notification);
};

const {
  addUser,
  removeUser,
  getAllUsers,
  getUniqueUsers,
  getAllUserPositions,
  setObjectState,
  upsertObjectState,
  loadObjectStates,
  getAllObjectStates,
} = require("./store");

let io;

const initSocket = async (server) => {
  // Load object states from DB on startup
  await loadObjectStates();

  const allowedOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',') 
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:3007",
        "http://localhost:3008",
        "http://localhost:3009",
        "http://localhost:3010",
        "http://localhost:3011",
      ];

  io = socketIo(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log("Socket auth - token received:", token ? "YES" : "NO");

      if (!token) {
        console.log("Socket auth - No token provided");
        console.error("SOCKET AUTH FAILED - NO TOKEN");
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Socket auth - JWT decoded:", decoded.id);
      
      const user = await User.findById(decoded.id).select(
        "name email avatarStyle focusMode",
      );

      if (!user) {
        console.log("Socket auth - User not found:", decoded.id);
        console.error("SOCKET AUTH FAILED - USER NOT FOUND");
        return next(new Error("User not found"));
      }

      socket.userId = decoded.id;
      socket.user = user;
      console.log("Socket auth - User authenticated:", user.name);
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      console.error("SOCKET AUTH FAILED - JWT ERROR");
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("RAW SOCKET CONNECTED:", socket.id);
    console.log("SOCKET AUTH TOKEN:", socket.handshake.auth?.token);
    console.log(`User connected: ${socket.user.name} (${socket.id})`);
    
    // Join shared workspace room for global broadcasting
    const workspaceRoom = 'workspace';
    console.log("JOINING SHARED WORKSPACE ROOM:", workspaceRoom);
    socket.join(workspaceRoom);
    console.log("WORKSPACE ROOM JOINED SUCCESSFULLY");

    // Join user-specific room for targeted notifications
    const userRoom = `user:${socket.userId}`;
    console.log("JOINING USER-SPECIFIC ROOM:", userRoom);
    socket.join(userRoom);
    console.log("USER ROOM JOINED SUCCESSFULLY");

    socket.onAny((event, ...args) => {
      console.log("SERVER RECEIVED:", event, args);
      if (event === 'notification:new') {
        console.log("SERVER NOTIFICATION:new BROADCAST:", {
          event,
          payload: args[0],
          socketId: socket.id,
          userId: socket.userId,
          totalClients: io.engine.clientsCount
        });
      }
    });

    // Add user to active users store via user:join event
    socket.on("user:join", () => {
      // Only prevent duplicate insertion and broadcast on first actual join
      if (!socket.userJoined) {
        socket.userJoined = true;

        console.log('USER JOIN SERVER:', socket.user.name);

        const { getUser } = require("./store");
        const existingUser = getUser(socket.userId);

        // Use existing position if user was already in the room (e.g. on refresh)
        const spawnX = existingUser
          ? existingUser.x || 300
          : Math.floor(Math.random() * 600) + 100;
        const spawnY = existingUser
          ? existingUser.y || 300
          : Math.floor(Math.random() * 400) + 100;

        addUser(socket.userId, {
          userId: socket.userId,
          socketId: socket.id, // Keep track of the latest socket ID for this user
          name: socket.user.name,
          avatarStyle: socket.user.avatarStyle,
          focusMode: socket.user.focusMode,
          x: spawnX,
          y: spawnY,
        });

        io.emit("users:update", getUniqueUsers());

        // Emit user:joined to workspace room for existing systems that rely on it
        socket.broadcast.to('workspace').emit("user:joined", {
          socketId: socket.id,
          userId: socket.userId,
          user: socket.user,
          position: { x: spawnX, y: spawnY },
        });
        console.log('USER JOIN BROADCAST SENT TO WORKSPACE ROOM');
      }

      // ALWAYS allow re-synchronization even on workspace remount
      const freshPositions = getAllUserPositions(socket.userId);
      console.log("INIT DATA:", freshPositions);
      socket.emit("players:init", freshPositions);

      // Send initial object states to the new player IMMEDIATELY
      const initialObjectStates = getAllObjectStates();
      console.log("OBJECTS INIT DATA:", initialObjectStates);
      socket.emit("objects:init", initialObjectStates);
    });

    // Attach event handlers
    handleMovement(io, socket);
    handleChat(io, socket);
    handleProximity(io, socket);
    handleNotifications(io, socket);
    handleTasks(io, socket);

    // Additional chat activity logging (safe)
    socket.on("chat:send", async (data) => {
      try {
        const ActivityLog = require("../models/ActivityLog");
        const User = require("../models/User");

        if (process.env.NODE_ENV === 'development') {
          console.log("CHAT EVENT TRIGGERED", data);
        }

        const receiverId =
          data.receiver || data.targetUserId || data.receiverId || null;

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

    // Sync player state (sitting/standing)
    socket.on("player:state", (data) => {
      socket.broadcast.emit("player:state", {
        userId: socket.userId,
        ...data,
      });
    });

    // Update user focus mode
    socket.on("user:update", async (data) => {
      console.log("USER UPDATE RECEIVED:", data);
      try {
        if (!socket.user || data.focusMode === undefined) {
          return;
        }

        if (socket.user.focusMode === data.focusMode) {
          return;
        }

        await User.findByIdAndUpdate(socket.userId, {
          focusMode: data.focusMode,
        });

        socket.user.focusMode = data.focusMode;
      } catch (error) {
        console.error("Error updating user focus mode:", error);
      }
    });

    // Object state sync (whiteboard, sticky notes, etc)
    socket.on("object:state", async (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("SERVER RECEIVED object:state:", data);
      }
      if (data.objectId && data.state) {
        await upsertObjectState(data.objectId, data.state);
      }
      socket.broadcast.emit("object:state", data);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
      }

      // Check if user is still connected from other tabs
      const userId = socket.userId;
      const stillConnected = Array.from(io.sockets.sockets.values()).some(
        (s) => s.userId === userId && s.id !== socket.id,
      );

      if (!stillConnected) {
        // Remove from active users only if no other connections exist
        removeUser(userId);
      }

      // Emit updated users list to workspace room
      io.to('workspace').emit("users:update", getUniqueUsers());

      // Notify others in workspace room
      io.to('workspace').emit("user:left", {
        id: socket.userId,
        userId: socket.userId,
      });
      console.log('USER LEFT BROADCAST SENT TO WORKSPACE ROOM');
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initSocket,
  getIo,
};
