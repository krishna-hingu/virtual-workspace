const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "login", "logout", "task_create", "task_update", "task_complete",
        "movement", "workspace_interaction", "session_start", "session_end",
        "idle_start", "idle_end", "focus_start", "focus_end", "interruption", "chat"
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    context: {
      type: String,
      enum: ["focus", "normal", "idle", "interruption"],
      default: "normal",
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    duration: {
      type: Number,
      default: 0,
    },

    intensity: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },

    coordinates: {
      x: Number,
      y: Number,
      z: Number,
    },

    sessionId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ context: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
