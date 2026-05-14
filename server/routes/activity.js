const express = require("express");
const router = express.Router();

const { 
  getActivity, 
  getHeatmapData,
  trackLogin,
  trackLogout,
  trackTaskCreate,
  trackTaskUpdate,
  trackTaskComplete,
  trackMovement,
  trackWorkspaceInteraction,
  trackFocusStart,
  trackFocusEnd,
  trackInterruption,
  trackIdleStart,
  trackIdleEnd
} = require("../controllers/activityController");
const auth = require("../middleware/auth");

// Get activity logs
router.get("/", auth, getActivity);

// Get real-time heatmap data
router.get("/heatmap", auth, getHeatmapData);

// Track user login
router.post("/login", auth, trackLogin);

// Track user logout
router.post("/logout", auth, trackLogout);

// Track task creation
router.post("/task/create", auth, trackTaskCreate);

// Track task update
router.post("/task/update", auth, trackTaskUpdate);

// Track task completion
router.post("/task/complete", auth, trackTaskComplete);

// Track movement
router.post("/movement", auth, trackMovement);

// Track workspace interaction
router.post("/workspace", auth, trackWorkspaceInteraction);

// Track focus session start
router.post("/focus/start", auth, trackFocusStart);

// Track focus session end
router.post("/focus/end", auth, trackFocusEnd);

// Track interruption
router.post("/interruption", auth, trackInterruption);

// Track idle start
router.post("/idle/start", auth, trackIdleStart);

// Track idle end
router.post("/idle/end", auth, trackIdleEnd);

module.exports = router;
