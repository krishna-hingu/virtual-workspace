require("dns").setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const http = require("http");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const { initSocket } = require("./socket");

// Routes
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const sessionRoutes = require("./routes/sessions");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const analyticsRoutes = require("./routes/analytics");
const activityRoutes = require("./routes/activity");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");

// Middleware
const auth = require("./middleware/auth");

const app = express();

// ==============================
// Middleware
// ==============================
app.use(
  cors({
    origin: [
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
    ],
    credentials: true,
  }),
);
app.use(express.json());

const isDev = process.env.NODE_ENV === "development";

// Rate limiting
const limiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 100 : 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth routes (Production only)
if (!isDev) {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: "Too many authentication attempts, please try again later.",
  });
  app.use("/api/auth", authLimiter);
}

// ==============================
// Routes
// ==============================

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Protected test route
app.get("/api/protected", auth, (req, res) => {
  res.json({
    message: "Protected data accessed",
    user: req.user,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// ==============================
// Error Handler (IMPORTANT)
// ==============================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR STACK:");
  console.error(err);

  res.status(500).json({
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==============================
// 404 Handler
// ==============================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ==============================
// START SERVER AFTER DB CONNECT
// ==============================
const PORT = parseInt(process.env.PORT) || 5001;

const startServer = async (port = PORT) => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = await initSocket(server);

    // Handle graceful shutdown
    const gracefulShutdown = () => {
      console.log("Received shutdown signal, closing server...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down",
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Socket.io initialized`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Use a free port or stop the process using it.`,
        );
        process.exit(1);
      } else {
        console.error("Server error:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
