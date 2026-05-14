const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
  getNearbyMessages,
  markAsRead,
  convertToTask,
} = require("../controllers/messageController");

const auth = require("../middleware/auth");

// Send message
router.post("/", auth, sendMessage);

// Get conversation with specific user
router.get("/conversation/:otherUserId", auth, getMessages);

// Get nearby messages (proximity chat)
router.get("/nearby", auth, getNearbyMessages);

// Mark message as read
router.patch("/:messageId/read", auth, markAsRead);

// Convert message to task
router.post("/:messageId/convert-to-task", auth, convertToTask);

module.exports = router;
