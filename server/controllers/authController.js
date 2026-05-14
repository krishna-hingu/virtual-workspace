const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Register user
const registerUser = async (req, res) => {
  console.log("=== REGISTER FUNCTION CALLED ===");
  try {
    console.log("REGISTER BODY:", req.body);
    const { name, email, password, role } = req.body;

    console.log("EXTRACTED FIELDS:", {
      name,
      email,
      role,
      passwordLength: password?.length,
    });

    if (!name || !email || !password) {
      console.log("VALIDATION FAILED: Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailLower = email.toLowerCase();
    console.log("CHECKING EMAIL DUPLICATE:", emailLower);

    const existingUser = await User.findOne({ email: emailLower });
    console.log("EXISTING USER FOUND:", existingUser ? "YES" : "NO");

    if (existingUser) {
      console.log("VALIDATION FAILED: User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("HASHING PASSWORD...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("PASSWORD HASHED SUCCESSFULLY");

    console.log("CREATING USER:", {
      name,
      email: emailLower,
      role,
      hasPassword: !!hashedPassword,
    });

    const user = new User({
      name,
      email: emailLower,
      password: hashedPassword,
      role: role || "employee",
    });

    console.log("SAVING USER TO DATABASE...");
    await user.save();
    console.log("USER SAVED SUCCESSFULLY:", user._id);

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR FULL:", error);
    console.error("REGISTER ERROR MESSAGE:", error.message);

    if (error.errors) {
      console.error("MONGOOSE ERRORS:", error.errors);
    }

    if (error.name === "ValidationError") {
      console.error("MONGOOSE VALIDATION DETAILS:");
      Object.keys(error.errors).forEach((key) => {
        console.error(`Field ${key}:`, error.errors[key].message);
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors || null,
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailLower = email.toLowerCase();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
