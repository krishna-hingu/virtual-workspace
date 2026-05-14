const express = require("express");
const router = express.Router();

const {
  getHeatmap,
  getSummary,
  getWorkPressure,
  getInterruptionLogs,
} = require("../controllers/analyticsController");

const auth = require("../middleware/auth");

router.get("/heatmap", auth, getHeatmap);
router.get("/summary", auth, getSummary);
router.get("/pressure", auth, getWorkPressure);
router.get("/interruption-logs", auth, getInterruptionLogs);

module.exports = router;
