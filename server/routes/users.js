const express = require("express");
const router = express.Router();

const {
  toggleFocusMode,
  getUserStats,
  updateUserStatus,
} = require("../controllers/userController");

const auth = require("../middleware/auth");

router.patch("/focus-mode", auth, toggleFocusMode);
router.patch("/status", auth, updateUserStatus);
router.get("/:id/stats", auth, getUserStats);

module.exports = router;
