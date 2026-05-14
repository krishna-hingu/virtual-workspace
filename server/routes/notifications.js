const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} = require("../controllers/notificationController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Get user's notifications
router.get("/", getNotifications);

// Get unread count
router.get("/unread", getUnreadCount);

// Create manual notification
router.post("/", createNotification);

// Mark notification as read
router.put("/:id/read", markAsRead);

// Mark all as read
router.put("/read-all", markAllAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

// Clear all notifications
router.delete("/", clearNotifications);

module.exports = router;
