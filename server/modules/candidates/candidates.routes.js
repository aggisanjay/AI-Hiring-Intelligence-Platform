import express from "express";
import {
  applyForJob, getMyApplications, getJobApplications,
  updateApplicationStatus, getAllCandidates,
} from "./candidates.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { uploadResume } from "../../middleware/upload.middleware.js";

const router = express.Router();

// Candidate routes
router.post("/apply",            authenticate, authorize("candidate"), uploadResume, applyForJob);
router.get( "/my-applications",  authenticate, authorize("candidate"), getMyApplications);

// Recruiter routes
router.get(   "/all",                    authenticate, authorize("recruiter"), getAllCandidates);
router.get(   "/job/:jobId",             authenticate, authorize("recruiter"), getJobApplications);
router.patch( "/application/:id/status", authenticate, authorize("recruiter"), updateApplicationStatus);

export default router;