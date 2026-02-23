

// import Application from "./application.model.js";
// import Job         from "../jobs/jobs.model.js";
// import User        from "../auth/auth.model.js";
// import { calculateMatchScore }     from "../../services/scoring.service.js";
// import { resumeQueue, safeQueueAdd } from "../../config/redis.js";
// import { sendEmail }               from "../../services/email.service.js";

// // ─── Apply for Job ─────────────────────────────────────────────────────────────
// export const applyForJob = async (req, res) => {
//   try {
//     const { jobId, coverLetter } = req.body;

//     const job = await Job.findById(jobId).populate("recruiterId", "email name organization");
//     if (!job) return res.status(404).json({ success: false, message: "Job not found." });
//     if (job.status !== "Active") return res.status(400).json({ success: false, message: "This job is no longer accepting applications." });

//     const existing = await Application.findOne({ jobId, candidateId: req.user._id });
//     if (existing) return res.status(409).json({ success: false, message: "You have already applied for this job." });

//     const candidate = await User.findById(req.user._id);

//     const matchScore = calculateMatchScore({
//       candidateSkills: candidate.skills     || [],
//       requiredSkills:  job.requiredSkills   || [],
//       candidateExp:    candidate.experience || 0,
//       requiredExpMin:  job.experienceMin    || 0,
//       aiScore:         null,
//     });

//     const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : candidate.resumeUrl || "";

//     const application = await Application.create({
//       jobId,
//       candidateId:   req.user._id,
//       coverLetter:   coverLetter || "",
//       resumeUrl,
//       matchScore,
//       statusHistory: [{ status: "Applied", changedBy: req.user._id }],
//     });

//     await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

//     // Queue AI resume analysis if resume uploaded
//     if (req.file) {
//       await safeQueueAdd(resumeQueue, "analyze-resume", {
//         applicationId:  application._id.toString(),
//         resumePath:     req.file.path,
//         jobDescription: job.description,
//         requiredSkills: job.requiredSkills,
//       });
//     }

//     // ── Send confirmation email to candidate ──────────────────────────────
//     await sendEmail("applicationReceived", candidate.email, {
//       candidateName: candidate.name,
//       jobTitle:      job.title,
//       organization:  job.recruiterId?.organization || job.organization || "the company",
//     });

//     res.status(201).json({ success: true, message: "Application submitted successfully.", application });
//   } catch (err) {
//     console.error("❌ [applyForJob]", err.message);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ─── Get My Applications (Candidate) ─────────────────────────────────────────
// export const getMyApplications = async (req, res) => {
//   try {
//     const applications = await Application.find({ candidateId: req.user._id })
//       .populate("jobId", "title department type location salaryMin salaryMax organization status")
//       .sort({ createdAt: -1 });
//     res.json({ success: true, applications });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ─── Get Applications for a Job (Recruiter) ───────────────────────────────────
// export const getJobApplications = async (req, res) => {
//   try {
//     const { status, page = 1, limit = 20 } = req.query;
//     const filter = { jobId: req.params.jobId };
//     if (status) filter.status = status;

//     const skip  = (parseInt(page) - 1) * parseInt(limit);
//     const total = await Application.countDocuments(filter);
//     const apps  = await Application.find(filter)
//       .populate("candidateId", "name email title skills experience location avatar linkedinUrl githubUrl")
//       .sort({ matchScore: -1, createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     res.json({ success: true, total, applications: apps });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ─── Update Application Status (Recruiter) ───────────────────────────────────
// export const updateApplicationStatus = async (req, res) => {
//   try {
//     const { status, notes, rating, interviewDate } = req.body;

//     const application = await Application.findById(req.params.id)
//       .populate("jobId")
//       .populate("candidateId", "name email");

//     if (!application) return res.status(404).json({ success: false, message: "Application not found." });

//     if (application.jobId.recruiterId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ success: false, message: "Unauthorized." });
//     }

//     const oldStatus = application.status;
//     application.status = status || application.status;
//     if (notes         !== undefined) application.notes         = notes;
//     if (rating        !== undefined) application.rating        = rating;
//     if (interviewDate !== undefined) application.interviewDate = interviewDate;
//     application.statusHistory.push({ status: application.status, changedBy: req.user._id });

//     await application.save();

//     // ── Send status update email to candidate if status changed ───────────
//     if (status && status !== oldStatus && application.candidateId?.email) {
//       await sendEmail("statusUpdate", application.candidateId.email, {
//         candidateName: application.candidateId.name,
//         jobTitle:      application.jobId.title,
//         status,
//         interviewDate: interviewDate || application.interviewDate,
//       });
//     }

//     res.json({ success: true, message: "Application updated.", application });
//   } catch (err) {
//     console.error("❌ [updateApplicationStatus]", err.message);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ─── Get All Candidates (Recruiter) ───────────────────────────────────────────
// export const getAllCandidates = async (req, res) => {
//   try {
//     const { search, skills, page = 1, limit = 20 } = req.query;
//     const filter = { role: "candidate" };

//     if (search) {
//       filter.$or = [
//         { name:  { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         { title: { $regex: search, $options: "i" } },
//       ];
//     }
//     if (skills) {
//       const skillArr = skills.split(",").map((s) => s.trim());
//       filter.skills = { $in: skillArr };
//     }

//     const skip  = (parseInt(page) - 1) * parseInt(limit);
//     const total = await User.countDocuments(filter);
//     const candidates = await User.find(filter)
//       .select("-password")
//       .skip(skip)
//       .limit(parseInt(limit))
//       .sort({ createdAt: -1 });

//     res.json({ success: true, total, candidates });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

import Application from "./application.model.js";
import Job         from "../jobs/jobs.model.js";
import User        from "../auth/auth.model.js";
import { calculateMatchScore }       from "../../services/scoring.service.js";
import { resumeQueue, safeQueueAdd } from "../../config/redis.js";
import { sendEmail }                 from "../../services/email.service.js";

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

    // ── Cloudinary gives req.file.path as the public URL ──────────────────
    // Local multer disk gives req.file.path as local file path
    // Memory storage gives req.file.buffer
    let resumeUrl = candidate.resumeUrl || "";
    let resumeCloudinaryId = null;

    if (req.file) {
      if (req.file.path && req.file.path.startsWith("http")) {
        // Cloudinary upload — req.file.path is the public URL
        resumeUrl         = req.file.path;
        resumeCloudinaryId= req.file.filename; // public_id
      } else if (req.file.path) {
        // Local disk upload
        resumeUrl = `/uploads/resumes/${req.file.filename}`;
      }
    }

    const application = await Application.create({
      jobId,
      candidateId:       req.user._id,
      coverLetter:       coverLetter || "",
      resumeUrl,
      resumeCloudinaryId,
      matchScore,
      statusHistory: [{ status: "Applied", changedBy: req.user._id }],
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    // Queue AI resume analysis
    if (req.file) {
      await safeQueueAdd(resumeQueue, "analyze-resume", {
        applicationId:  application._id.toString(),
        resumeUrl:      resumeUrl,           // Cloudinary URL — worker fetches from here
        resumePath:     req.file.path && !req.file.path.startsWith("http") ? req.file.path : null, // local path only
        jobDescription: job.description,
        requiredSkills: job.requiredSkills,
      });
    }

    // Send confirmation email
    await sendEmail("applicationReceived", candidate.email, {
      candidateName: candidate.name,
      jobTitle:      job.title,
      organization:  job.recruiterId?.organization || job.organization || "the company",
    });

    res.status(201).json({ success: true, message: "Application submitted successfully.", application });
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

    const oldStatus = application.status;
    application.status = status || application.status;
    if (notes         !== undefined) application.notes         = notes;
    if (rating        !== undefined) application.rating        = rating;
    if (interviewDate !== undefined) application.interviewDate = interviewDate;
    application.statusHistory.push({ status: application.status, changedBy: req.user._id });

    await application.save();

    // Send status update email if status changed
    if (status && status !== oldStatus && application.candidateId?.email) {
      await sendEmail("statusUpdate", application.candidateId.email, {
        candidateName: application.candidateId.name,
        jobTitle:      application.jobId.title,
        status,
        interviewDate: interviewDate || application.interviewDate,
      });
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