const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["employee", "lead", "admin"],
      default: "employee",
    },

    avatarStyle: {
      type: String,
      default: "default",
    },

    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },

    focusMode: {
      type: Boolean,
      default: false,
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// userSchema.index({ email: 1 }); // Email already indexed by unique: true

module.exports = mongoose.model("User", userSchema);
