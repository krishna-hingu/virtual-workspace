const User = require("../models/User");
const InteractionLog = require("../models/InteractionLog");

// ==============================
// Toggle Focus Mode
// ==============================
const toggleFocusMode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.focusMode = !user.focusMode;
    await user.save();

    res.json({
      message: "Focus mode updated",
      focusMode: user.focusMode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Get User Stats (Analytics)
// ==============================
const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get interaction count for this user
    const interactionCount = await InteractionLog.countDocuments({
      $or: [{ userId }, { targetUserId: userId }],
    });

    // Get user details
    const user = await User.findById(userId).select(
      "name focusMode status lastActive",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user,
      stats: {
        totalInteractions: interactionCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Update User Status
// ==============================
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    user.lastActive = new Date();
    await user.save();

    res.json({
      message: "Status updated",
      status: user.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  toggleFocusMode,
  getUserStats,
  updateUserStatus,
};
