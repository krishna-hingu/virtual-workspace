const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const auth = require("../middleware/auth");
const { validate, taskSchemas } = require("../utils/validation");

// Create
router.post("/", auth, validate(taskSchemas.create), (req, res, next) => {
  console.log("STEP 5: TASK ROUTE HIT");
  next();
}, createTask);

// Get all tasks
router.get("/", auth, getTasks);

// Update task
router.patch("/:id", auth, updateTask);

// Delete task
router.delete("/:id", auth, deleteTask);

module.exports = router;
