const mongoose = require("mongoose");

const workSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clockInTime: {
      type: Date,
      required: true,
    },

    clockOutTime: {
      type: Date,
    },

    totalMinutes: {
      type: Number,
      default: 0,
    },

    interruptionCount: {
      type: Number,
      default: 0,
    },

    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
  },
  { timestamps: true },
);

workSessionSchema.index({ userId: 1, date: 1 }); // Session history

module.exports = mongoose.model("WorkSession", workSessionSchema);
