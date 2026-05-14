const Task = require("../models/Task");
const ActivityLog = require("../models/ActivityLog");
const { getIo } = require("../socket/index");

// ==============================
// Create Task
// ==============================
const createTask = async (req, res) => {
  try {
    console.log("BACKEND RECEIVED TASK:", JSON.stringify(req.body, null, 2));
    console.log("STEP 6: CONTROLLER BODY", req.body);
    const { title, description, assignedTo, priority } = req.body;

    // Validation
    console.log("STEP 7: VALIDATING TASK");
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      priority,
      createdBy: req.user.id,
    });

    await task.save();
    console.log("STEP 8: TASK SAVED", task._id);
    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name")
      .populate("assignedTo", "name");

    await ActivityLog.create({
      user: req.user.id,
      type: "task_update",
      message: `Created task "${task.title}"`,
      context: "normal",
    });

    // Emit socket events
    console.log("STEP 9: EMITTING SOCKET EVENT");
    console.log("STEP 9A BEFORE getIo");

    const io = getIo();

    console.log("STEP 9B AFTER getIo", !!io);

    console.log("STEP 9C BEFORE task:created emit");

    try {
      io.emit("task:created", populatedTask);
      console.log("STEP 9D AFTER task:created emit - SUCCESS");
    } catch(err) {
      console.error("STEP 9D task:created emit FAILED", err);
    }

    // Phase 3: Targeted emit to assigned user if task is assigned
    if (populatedTask.assignedTo) {
      console.log("EMITTING TASK ASSIGNED TO USER:", populatedTask.assignedTo._id);
      io.to(`user:${populatedTask.assignedTo._id}`).emit("task:assigned", populatedTask);
    }

    console.log("STEP 9E BEFORE notification:new emit");

    const notificationPayload = {
      type: "task_created",
      title: "Task Created",
      message: `${req.user.name} created task "${task.title}"`,
      user: req.user.name,
      timestamp: new Date(),
      taskId: task._id,
      read: false
    };
    console.log("BACKEND TASK CREATE EMIT: notification:new", {
      event: "notification:new",
      taskId: task._id,
      socketUsers: io.engine.clientsCount,
      payload: notificationPayload
    });

    try {
      io.emit("notification:new", notificationPayload);
      console.log("STEP 9F AFTER notification:new emit - SUCCESS");
    } catch(err) {
      console.error("STEP 9F notification:new emit FAILED", err);
    }

    io.emit("activity", {
      type: "task_created",
      message: `${req.user.name} created "${task.title}"`,
      user: req.user.name,
      taskId: task._id,
      timestamp: new Date(),
    });

    res.status(201).json({
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("VALIDATION ERROR:", error.errors || error.message);
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get All Tasks (Role-based Filtering)
// ==============================
const getTasks = async (req, res) => {
  try {
    let query = {};
    
    // Role-based task filtering
    if (req.user.role === "admin") {
      // Admin can see all tasks
      query = {};
    } else if (req.user.role === "lead") {
      // Lead can see tasks from their team (for now, all tasks - in real implementation, would filter by team)
      query = {};
    } else {
      // Employee can only see their own tasks (created or assigned)
      query = {
        $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
      };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name role")
      .populate("assignedTo", "name role");

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Update Task
// ==============================
const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo } = req.body;

    const task = await Task.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check ownership
    const isCreator = task.createdBy.toString() === req.user.id;
    const isAssigned =
      task.assignedTo && task.assignedTo.toString() === req.user.id;

    if (!isCreator && !isAssigned) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Update fields
    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.assignedTo = assignedTo || task.assignedTo;

    await task.save();
    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name")
      .populate("assignedTo", "name");

    await ActivityLog.create({
      user: req.user.id,
      type: "task_update",
      message: `Updated "${task.title}" to ${task.status}`,
      context: "normal",
    });

    // Emit socket events
    console.log("UPDATE BEFORE EMIT");
    const io = getIo();

    try {
      io.emit("task:updated", populatedTask);
      console.log("UPDATE AFTER task:updated - SUCCESS");
    } catch(err) {
      console.error("UPDATE task:updated emit FAILED", err);
    }

    const notificationPayload = {
      type: "task_updated",
      title: "Task Updated",
      message: `${req.user.name} updated "${task.title}"`,
      user: req.user.name,
      timestamp: new Date(),
      taskId: task._id,
      read: false
    };
    console.log("BACKEND TASK UPDATE EMIT: notification:new", {
      event: "notification:new",
      taskId: task._id,
      socketUsers: io.engine.clientsCount,
      payload: notificationPayload
    });

    try {
      io.emit("notification:new", notificationPayload);
      console.log("UPDATE AFTER notification:new - SUCCESS");
    } catch(err) {
      console.error("UPDATE notification:new emit FAILED", err);
    }

    io.emit("activity", {
      type: "task_updated",
      message: `${req.user.name} updated "${task.title}"`,
      user: req.user.name,
      taskId: task._id,
      timestamp: new Date(),
    });

    res.json({
      message: "Task updated successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Delete Task
// ==============================
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check ownership
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const taskId = task._id.toString();
    await task.deleteOne();

    // Emit socket events
    console.log("DELETE BEFORE EMIT");
    const io = getIo();

    try {
      io.emit("task:deleted", taskId);
      console.log("DELETE AFTER task:deleted - SUCCESS");
    } catch(err) {
      console.error("DELETE task:deleted emit FAILED", err);
    }

    const notificationPayload = {
      type: "task_deleted",
      title: "Task Deleted",
      message: `${req.user.name} deleted "${task.title}"`,
      user: req.user.name,
      timestamp: new Date(),
      taskId: req.params.id,
      read: false
    };
    console.log("BACKEND TASK DELETE EMIT: notification:new", {
      event: "notification:new",
      taskId: req.params.id,
      socketUsers: io.engine.clientsCount,
      payload: notificationPayload
    });

    try {
      io.emit("notification:new", notificationPayload);
      console.log("DELETE AFTER notification:new - SUCCESS");
    } catch(err) {
      console.error("DELETE notification:new emit FAILED", err);
    }

    io.emit("activity", {
      type: "task_deleted",
      message: `${req.user.name} deleted "${task.title}"`,
      user: req.user.name,
      taskId: task._id,
      timestamp: new Date(),
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
