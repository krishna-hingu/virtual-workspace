const mongoose = require("mongoose");

const interactionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["chat", "approach", "focus_interrupt"],
      required: true,
    },

    // For proximity interactions
    distance: {
      type: Number,
      default: 0,
    },

    // For chat interactions
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // Metadata
    position: {
      x: { type: Number },
      y: { type: Number },
    },

    // AI insights
    aiSuggestion: {
      type: String,
    },

    // Duration for proximity (how long they were near)
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  { timestamps: true },
);

// Indexes for analytics queries
interactionLogSchema.index({ userId: 1, createdAt: -1 });
interactionLogSchema.index({ targetUserId: 1, createdAt: -1 });
interactionLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("InteractionLog", interactionLogSchema);
