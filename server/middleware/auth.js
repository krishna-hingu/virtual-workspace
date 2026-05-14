const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    // Check for token
    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // Accept either "Bearer <token>" or a raw token string
    const actualToken = token.startsWith("Bearer ")
      ? token.split(" ")[1]
      : token;

    // Check for actual token
    if (!actualToken) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Verify
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    // Fetch full user from DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request
    req.user = user;

    // Continue
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    next();
  };
};

module.exports = auth;
module.exports.checkRole = checkRole;
