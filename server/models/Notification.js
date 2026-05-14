const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "task_created",
        "task_assigned",
        "task_updated",
        "task_completed",
        "task_deleted",
        "user_joined",
        "user_left",
        "chat_message",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
    },

    message: {
      type: String,
      required: true,
    },

    data: {
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId,
      actorId: mongoose.Schema.Types.ObjectId,
      actorName: String,
      metadata: mongoose.Schema.Types.Mixed,
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index for auto-expiry
    },
  },
  { timestamps: true },
);

// Compound indexes for common queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
