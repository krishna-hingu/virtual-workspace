const mongoose = require("mongoose");

const objectStateSchema = new mongoose.Schema(
  {
    objectId: {
      type: String,
      required: true,
      unique: true,
    },
    state: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    updatedAt: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ObjectState", objectStateSchema);
