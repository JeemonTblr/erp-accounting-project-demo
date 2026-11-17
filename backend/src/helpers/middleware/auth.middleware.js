const jwt = require("jsonwebtoken");
const { config } = require("../../config/env");
const { User } = require("../../models/user.model");
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token required. Provide Authorization: Bearer <token>"
    });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid token: User no longer exists."
      });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "User account has been deactivated. Please contact an administrator."
      });
      return;
    }
    req.user = user.get({ plain: true });
    next();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Invalid token";
    res.status(401).json({
      success: false,
      message: `Authentication failed: ${errMsg}`
    });
  }
};
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required before checking permissions."
      });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(", ")}]. Your role is ${req.user.role}.`
      });
      return;
    }
    next();
  };
};
module.exports = {
  authenticateToken,
  requireRoles,
};
