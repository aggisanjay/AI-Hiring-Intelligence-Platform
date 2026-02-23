import express from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import Application from "../candidates/application.model.js";
import { analyzeResume } from "../../services/ai.service.js";
import { resumeQueue } from "../../config/redis.js";

const router = express.Router();

// ─── Re-trigger AI Resume Analysis ────────────────────────────────────────────
router.post("/analyze-resume/:applicationId", authenticate, authorize("recruiter"), async (req, res) => {
  const app = await Application.findById(req.params.applicationId).populate("jobId");
  if (!app) return res.status(404).json({ success: false, message: "Application not found." });

  if (!app.resumeUrl) return res.status(400).json({ success: false, message: "No resume uploaded." });

  await resumeQueue.add("analyze-resume", {
    applicationId:  app._id.toString(),
    resumePath:     `./uploads${app.resumeUrl.replace("/uploads", "")}`,
    jobDescription: app.jobId.description,
    requiredSkills: app.jobId.requiredSkills,
  });

  res.json({ success: true, message: "Resume analysis queued." });
});

// ─── Direct AI Resume Score (Sync - for testing) ──────────────────────────────
router.post("/score-resume", authenticate, async (req, res) => {
  const { resumeText, jobDescription, requiredSkills } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ success: false, message: "resumeText and jobDescription required." });
  }

  const result = await analyzeResume({ resumeText, jobDescription, requiredSkills: requiredSkills || [] });
  res.json({ success: true, analysis: result });
});

export default router;