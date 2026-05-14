const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/authController");
const auth = require("../middleware/auth");
const { validate, userSchemas } = require("../utils/validation");

const User = require("../models/User");

// Register
router.post("/register", validate(userSchemas.register), registerUser);

// Login
router.post("/login", validate(userSchemas.login), loginUser);

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
