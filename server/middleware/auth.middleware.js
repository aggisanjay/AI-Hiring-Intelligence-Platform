import jwt from "jsonwebtoken";
import User from "../modules/auth/auth.model.js";

// ─── Verify JWT ────────────────────────────────────────────────────────────────
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided. Access denied." });
    }

    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Role Guard ────────────────────────────────────────────────────────────────
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};