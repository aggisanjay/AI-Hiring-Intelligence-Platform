
import Application from "./application.model.js";
import Job         from "../jobs/jobs.model.js";
import User        from "../auth/auth.model.js";
import https       from "https";
import http        from "http";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import { calculateMatchScore } from "../../services/scoring.service.js";
import { analyzeResume }       from "../../services/ai.service.js";
import { sendEmail }           from "../../services/email.service.js";

// ─── Fetch PDF buffer from Cloudinary URL ─────────────────────────────────────
const getPdfBuffer = (url) => new Promise((resolve) => {
  if (!url?.startsWith("http")) return resolve(null);
  const lib = url.startsWith("https") ? https : http;
  lib.get(url, (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end",  () => resolve(Buffer.concat(chunks)));
    res.on("error",() => resolve(null));
  }).on("error", () => resolve(null));
});

// ─── Apply for Job ─────────────────────────────────────────────────────────────
export const applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    const job = await Job.findById(jobId).populate("recruiterId", "email name organization");
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    if (job.status !== "Active") return res.status(400).json({ success: false, message: "This job is no longer accepting applications." });

    const existing = await Application.findOne({ jobId, candidateId: req.user._id });
    if (existing) return res.status(409).json({ success: false, message: "You have already applied for this job." });

    const candidate = await User.findById(req.user._id);

    const matchScore = calculateMatchScore({
      candidateSkills: candidate.skills     || [],
      requiredSkills:  job.requiredSkills   || [],
      candidateExp:    candidate.experience || 0,
      requiredExpMin:  job.experienceMin    || 0,
      aiScore:         null,
    });

    // Cloudinary: req.file.path is the public HTTPS URL
    let resumeUrl = candidate.resumeUrl || "";
    if (req.file) {
      resumeUrl = req.file.path?.startsWith("http")
        ? req.file.path
        : `/uploads/resumes/${req.file.filename}`;
    }

    const application = await Application.create({
      jobId,
      candidateId:   req.user._id,
      coverLetter:   coverLetter || "",
      resumeUrl,
      matchScore,
      aiAnalysis:    { status: req.file ? "pending" : "no_resume" },
      statusHistory: [{ status: "Applied", changedBy: req.user._id }],
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    // ── AI Resume Analysis — run NOW, before sending response ─────────────
    // This ensures it completes even on serverless platforms like Render
    if (req.file) {
      try {
        application.aiAnalysis = { status: "processing" };
        await application.save();

        // Extract PDF text
        let resumeText = "";
        try {
          const buffer = await getPdfBuffer(resumeUrl);
          if (buffer) {
            const pdfData = await pdfParse(buffer);
            resumeText    = pdfData.text || "";
          }
        } catch (pdfErr) {
          console.warn("⚠️  PDF extraction failed:", pdfErr.message);
        }

        // AI scoring
        const analysis = await analyzeResume({
          resumeText,
          jobDescription: job.description,
          requiredSkills: job.requiredSkills || [],
        });

        // Update match score with AI score included
        const newMatchScore = calculateMatchScore({
          candidateSkills: candidate.skills     || [],
          requiredSkills:  job.requiredSkills   || [],
          candidateExp:    candidate.experience || 0,
          requiredExpMin:  job.experienceMin    || 0,
          aiScore:         analysis.score,
        });

        application.aiAnalysis  = { ...analysis, status: "done", analyzedAt: new Date() };
        application.matchScore  = newMatchScore;
        application.resumeText  = resumeText;
        await application.save();

        console.log(`✅ AI score: ${analysis.score} for application ${application._id}`);
      } catch (aiErr) {
        console.error("❌ AI analysis failed:", aiErr.message);
        application.aiAnalysis = { status: "failed", error: aiErr.message };
        await application.save();
        // Don't crash — application is still saved, just without AI score
      }
    }

    // Send confirmation email (don't await — non-critical)
    sendEmail("applicationReceived", candidate.email, {
      candidateName: candidate.name,
      jobTitle:      job.title,
      organization:  job.recruiterId?.organization || "the company",
    }).catch((e) => console.warn("Email failed:", e.message));

    // Return updated application with AI score
    const updatedApp = await Application.findById(application._id);
    res.status(201).json({
      success:     true,
      message:     "Application submitted successfully.",
      application: updatedApp,
    });
  } catch (err) {
    console.error("❌ [applyForJob]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get My Applications (Candidate) ──────────────────────────────────────────
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.user._id })
      .populate("jobId", "title department type location salaryMin salaryMax organization status")
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Applications for a Job (Recruiter) ───────────────────────────────────
export const getJobApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { jobId: req.params.jobId };
    if (status) filter.status = status;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Application.countDocuments(filter);
    const apps  = await Application.find(filter)
      .populate("candidateId", "name email title skills experience location avatar linkedinUrl githubUrl")
      .sort({ matchScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, applications: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Update Application Status (Recruiter) ────────────────────────────────────
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes, rating, interviewDate } = req.body;

    const application = await Application.findById(req.params.id)
      .populate("jobId")
      .populate("candidateId", "name email");

    if (!application) return res.status(404).json({ success: false, message: "Application not found." });

    if (application.jobId.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const oldStatus    = application.status;
    application.status = status || application.status;
    if (notes         !== undefined) application.notes         = notes;
    if (rating        !== undefined) application.rating        = rating;
    if (interviewDate !== undefined) application.interviewDate = interviewDate;
    application.statusHistory.push({ status: application.status, changedBy: req.user._id });

    await application.save();

    if (status && status !== oldStatus && application.candidateId?.email) {
      sendEmail("statusUpdate", application.candidateId.email, {
        candidateName: application.candidateId.name,
        jobTitle:      application.jobId.title,
        status,
        interviewDate: interviewDate || application.interviewDate,
      }).catch((e) => console.warn("Email failed:", e.message));
    }

    res.json({ success: true, message: "Application updated.", application });
  } catch (err) {
    console.error("❌ [updateApplicationStatus]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get All Candidates (Recruiter) ───────────────────────────────────────────
export const getAllCandidates = async (req, res) => {
  try {
    const { search, skills, page = 1, limit = 20 } = req.query;
    const filter = { role: "candidate" };

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }
    if (skills) {
      filter.skills = { $in: skills.split(",").map((s) => s.trim()) };
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const candidates = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
