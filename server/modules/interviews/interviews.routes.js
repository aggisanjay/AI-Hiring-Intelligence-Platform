

import express from "express";
import {
  startInterview, sendMessage, completeInterview,
  getInterviewResult, getMyInterviews, getCandidateInterviews,
} from "./interviews.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { generateInterviewQuestion } from "../../services/ai.service.js";

const router = express.Router();

// ─── NO-AUTH TEST ROUTE — open in browser to diagnose Gemini issues ───────────
// http://localhost:5000/api/interviews/test-gemini
router.get("/test-gemini", async (req, res) => {
  const results = { apiKeySet: !!process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || "gemini-2.0-flash" };
  try {
    const question = await generateInterviewQuestion({
      jobRole: "Software Engineer",
      messages: [],
      isFirst: true,
    });
    results.status   = "✅ SUCCESS";
    results.question = question;
  } catch (err) {
    results.status    = "❌ FAILED";
    results.error     = err.message;
    results.errorType = err.constructor.name;
    results.httpStatus= err.status || err.statusCode || "N/A";
  }
  res.json(results);
});

// ─── Static routes — MUST come before /:id ────────────────────────────────────
router.post("/start",                  authenticate, authorize("candidate"), startInterview);
router.get( "/my",                     authenticate, authorize("candidate"), getMyInterviews);
router.get( "/candidate/:candidateId", authenticate, authorize("recruiter"), getCandidateInterviews);

// ─── Dynamic /:id routes ──────────────────────────────────────────────────────
router.post("/:id/message",  authenticate, authorize("candidate"), sendMessage);
router.post("/:id/complete", authenticate, authorize("candidate"), completeInterview);
router.get( "/:id/result",   authenticate, getInterviewResult);

export default router;