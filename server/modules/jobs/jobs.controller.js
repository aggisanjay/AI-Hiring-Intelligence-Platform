import Job from "./jobs.model.js";
import Application from "../candidates/application.model.js";
import { calculateMatchScore } from "../../services/scoring.service.js";

// ─── Create Job ───────────────────────────────────────────────────────────────
export const createJob = async (req, res) => {
  const job = await Job.create({
    ...req.body,
    recruiterId: req.user._id,
    organization: req.user.organization || "HireIQ Corp",
  });
  res.status(201).json({ success: true, message: "Job posted successfully.", job });
};

// ─── Get All Jobs (Public) ────────────────────────────────────────────────────
export const getJobs = async (req, res) => {
  const { search, department, type, location, status = "Active", page = 1, limit = 12 } = req.query;

  const filter = {};
  if (status)     filter.status     = status;
  if (department) filter.department = department;
  if (type)       filter.type       = type;
  if (location)   filter.location   = { $regex: location, $options: "i" };
  if (search)     filter.$text      = { $search: search };

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Job.countDocuments(filter);
  const jobs  = await Job.find(filter)
    .populate("recruiterId", "name organization avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    jobs,
  });
};

// ─── Get Recruiter Jobs ───────────────────────────────────────────────────────
export const getMyJobs = async (req, res) => {
  const jobs = await Job.find({ recruiterId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, jobs });
};

// ─── Get Single Job ───────────────────────────────────────────────────────────
export const getJob = async (req, res) => {
  const job = await Job.findById(req.params.id).populate("recruiterId", "name organization avatar");
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });
  res.json({ success: true, job });
};

// ─── Update Job ───────────────────────────────────────────────────────────────
export const updateJob = async (req, res) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, recruiterId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!job) return res.status(404).json({ success: false, message: "Job not found or unauthorized." });
  res.json({ success: true, message: "Job updated.", job });
};

// ─── Delete Job ───────────────────────────────────────────────────────────────
export const deleteJob = async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, recruiterId: req.user._id });
  if (!job) return res.status(404).json({ success: false, message: "Job not found or unauthorized." });
  await Application.deleteMany({ jobId: req.params.id });
  res.json({ success: true, message: "Job deleted." });
};

// ─── Get Top Candidates for a Job ────────────────────────────────────────────
export const getTopCandidates = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });

  const applications = await Application.find({ jobId: req.params.id })
    .populate("candidateId", "name email title skills experience avatar location")
    .sort({ matchScore: -1 })
    .limit(10);

  const ranked = applications.map((app, index) => ({
    rank: index + 1,
    application: app,
    isBestFit: index === 0,
  }));

  res.json({ success: true, candidates: ranked });
};

// ─── Get Pipeline (Kanban) ────────────────────────────────────────────────────
export const getJobPipeline = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });

  const applications = await Application.find({ jobId: req.params.id })
    .populate("candidateId", "name email title skills experience avatar location");

  const pipeline = {
    Applied:     [],
    Shortlisted: [],
    Interview:   [],
    Offer:       [],
    Rejected:    [],
  };

  applications.forEach((app) => {
    if (pipeline[app.status]) pipeline[app.status].push(app);
  });

  res.json({ success: true, job, pipeline });
};