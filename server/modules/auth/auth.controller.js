import jwt from "jsonwebtoken";
import User from "./auth.model.js";

// ─── Generate Token ───────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password, role, organization } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }
  if (!["recruiter", "candidate"].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be recruiter or candidate." });
  }

  const user = await User.create({ name, email, password, role, organization: organization || "" });
  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    token,
    user,
  });
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const token = signToken(user._id);
  user.password = undefined;

  res.json({ success: true, message: "Login successful.", token, user });
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const allowed = ["name", "title", "skills", "experience", "linkedinUrl", "githubUrl", "location", "bio", "organization"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, message: "Profile updated.", user });
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: "Current password is incorrect." });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password changed successfully." });
};