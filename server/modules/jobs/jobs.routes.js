import express from "express";
import {
  createJob, getJobs, getMyJobs, getJob,
  updateJob, deleteJob, getTopCandidates, getJobPipeline,
} from "./jobs.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.get("/",          getJobs);
router.get("/:id",       getJob);

// Recruiter only
router.post(   "/",                       authenticate, authorize("recruiter"), createJob);
router.get(    "/recruiter/my-jobs",      authenticate, authorize("recruiter"), getMyJobs);
router.put(    "/:id",                    authenticate, authorize("recruiter"), updateJob);
router.delete( "/:id",                    authenticate, authorize("recruiter"), deleteJob);
router.get(    "/:id/top-candidates",     authenticate, authorize("recruiter"), getTopCandidates);
router.get(    "/:id/pipeline",           authenticate, authorize("recruiter"), getJobPipeline);

export default router;