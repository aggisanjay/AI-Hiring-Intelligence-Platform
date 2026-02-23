import express from "express";
import { register, login, getMe, updateProfile, changePassword } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login",    login);
router.get( "/me",       authenticate, getMe);
router.put( "/profile",  authenticate, updateProfile);
router.put( "/password", authenticate, changePassword);

export default router;