
import "dotenv/config";
import { Worker } from "bullmq";
import mongoose   from "mongoose";
import fs         from "fs";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { redisConnection }      from "../config/redis.js";
import connectDB                from "../config/db.js";
import logger                   from "../config/logger.js";
import Application              from "../modules/candidates/application.model.js";
import Interview                from "../modules/interviews/interviews.model.js";
import { analyzeResume, evaluateInterview } from "../services/ai.service.js";
import { calculateMatchScore }  from "../services/scoring.service.js";
import { sendEmail }            from "../services/email.service.js";

await connectDB();

// ─── Resume Analysis Worker ────────────────────────────────────────────────────
const resumeWorker = new Worker(
  "resume-analysis",
  async (job) => {
    const { applicationId, resumePath, jobDescription, requiredSkills } = job.data;
    logger.info(`🔍 Processing resume: ${applicationId}`);

    const application = await Application.findById(applicationId);
    if (!application) throw new Error("Application not found");

    application.aiAnalysis.status = "processing";
    await application.save();

    // Extract PDF text
    let resumeText = "";
    try {
      if (fs.existsSync(resumePath)) {
        const dataBuffer = fs.readFileSync(resumePath);
        const pdfData    = await pdfParse(dataBuffer);
        resumeText       = pdfData.text;
      }
    } catch (err) {
      logger.warn(`PDF parse failed: ${err.message}`);
    }

    const analysis = await analyzeResume({ resumeText, jobDescription, requiredSkills });

    application.resumeText = resumeText;
    application.aiAnalysis = { ...analysis, status: "done", analyzedAt: new Date() };

    const populated = await Application.findById(applicationId).populate("candidateId jobId");
    application.matchScore = calculateMatchScore({
      candidateSkills: populated.candidateId?.skills     || [],
      requiredSkills:  populated.jobId?.requiredSkills   || [],
      candidateExp:    populated.candidateId?.experience || 0,
      requiredExpMin:  populated.jobId?.experienceMin    || 0,
      aiScore:         analysis.score,
    });

    await application.save();
    logger.info(`✅ Resume analyzed. Score: ${analysis.score}`);
  },
  { connection: redisConnection, concurrency: 3 }
);

// ─── Interview Evaluation Worker ──────────────────────────────────────────────
const interviewWorker = new Worker(
  "interview-evaluation",
  async (job) => {
    const { interviewId, jobRole, messages } = job.data;
    logger.info(`🎙️ Evaluating interview: ${interviewId}`);

    const evaluation = await evaluateInterview({ jobRole, messages });

    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      { evaluation: { ...evaluation, evaluatedAt: new Date() }, status: "evaluated" },
      { new: true }
    ).populate("candidateId", "name email");

    // ── Send email to candidate with their score ──────────────────────────
    if (interview?.candidateId?.email) {
      await sendEmail("interviewComplete", interview.candidateId.email, {
        candidateName: interview.candidateId.name,
        jobRole:       interview.jobRole,
        score:         evaluation.overallScore,
      });
    }

    logger.info(`✅ Interview evaluated. Score: ${evaluation.overallScore}`);
  },
  { connection: redisConnection, concurrency: 2 }
);

resumeWorker.on("failed",    (job, err) => logger.error(`❌ Resume job failed: ${err.message}`));
resumeWorker.on("completed", (job)      => logger.info(`✅ Resume job done: ${job.id}`));
interviewWorker.on("failed", (job, err) => logger.error(`❌ Interview job failed: ${err.message}`));

logger.info("🤖 AI Worker started");