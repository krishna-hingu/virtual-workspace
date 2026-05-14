const express = require("express");
const router = express.Router();

const {
  clockIn,
  clockOut,
  getSessions,
  getActiveSession,
  cleanupAbandonedSessions,
  forceEndSession,
} = require("../controllers/sessionController");
const auth = require("../middleware/auth");

router.post("/clock-in", auth, clockIn);
router.post("/clock-out", auth, clockOut);
router.get("/history", auth, getSessions);
router.get("/active", auth, getActiveSession);

// Admin/Maintenance routes
router.post("/cleanup", auth, cleanupAbandonedSessions); // For cleaning abandoned sessions
router.post("/force-end/:userId?", auth, forceEndSession); // For emergency session ending

module.exports = router;
