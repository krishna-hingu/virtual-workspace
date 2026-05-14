const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    content: {
      type: String,
      required: true,
      maxlength: 500, // Limit message length
    },

    messageType: {
      type: String,
      enum: ["text", "task_conversion"],
      default: "text",
    },

    // For proximity chat - location coordinates
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },

    // Distance from sender when sent
    distance: {
      type: Number,
      default: 0,
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },

    // For task conversion
    convertedToTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  { timestamps: true },
);

// Indexes for performance
messageSchema.index({ sender: 1, createdAt: -1 }); // User's sent messages
messageSchema.index({ receiver: 1, createdAt: -1 }); // User's received messages
messageSchema.index({ "position.x": 1, "position.y": 1 });

module.exports = mongoose.model("Message", messageSchema);
