

import express from "express";
import {
  startInterview, sendMessage, completeInterview,
  retryEvaluation, getInterviewResult, getMyInterviews, getCandidateInterviews,
} from "./interviews.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Static routes first
router.post("/start",                  authenticate, authorize("candidate"), startInterview);
router.get( "/my",                     authenticate, authorize("candidate"), getMyInterviews);
router.get( "/candidate/:candidateId", authenticate, authorize("recruiter"), getCandidateInterviews);

// Dynamic /:id routes
router.post("/:id/message",  authenticate, authorize("candidate"), sendMessage);
router.post("/:id/complete", authenticate, authorize("candidate"), completeInterview);
router.post("/:id/retry",    authenticate, authorize("candidate"), retryEvaluation);  // ← NEW
router.get( "/:id/result",   authenticate, getInterviewResult);

export default router;