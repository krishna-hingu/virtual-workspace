const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const { checkRole } = require("../middleware/auth");

// All routes here require admin role
router.use(auth, checkRole(["admin"]));

router.get("/overview", adminController.getOverview);
router.get("/users", adminController.getUsers);
router.patch("/users/role", adminController.updateUserRole);
router.get("/analytics", adminController.getAnalytics);
router.post("/broadcast", adminController.broadcastNotification);

module.exports = router;