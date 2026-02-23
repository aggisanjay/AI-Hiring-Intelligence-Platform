import express from "express";
import {
  getDashboardStats, getHiringFunnel, getAIScoreDistribution,
  getApplicationsOverTime, getTopSkillGaps, getCandidateStats,
} from "./analytics.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Recruiter analytics
router.get("/dashboard",          authenticate, authorize("recruiter"), getDashboardStats);
router.get("/funnel",             authenticate, authorize("recruiter"), getHiringFunnel);
router.get("/score-distribution", authenticate, authorize("recruiter"), getAIScoreDistribution);
router.get("/applications-time",  authenticate, authorize("recruiter"), getApplicationsOverTime);
router.get("/skill-gaps",         authenticate, authorize("recruiter"), getTopSkillGaps);

// Candidate analytics
router.get("/candidate/stats",    authenticate, authorize("candidate"), getCandidateStats);

export default router;