import Application from "../candidates/application.model.js";
import Job from "../jobs/jobs.model.js";
import Interview from "../interviews/interviews.model.js";
import User from "../auth/auth.model.js";

// ─── Recruiter Dashboard Stats ─────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  const recruiterId = req.user._id;

  const jobs = await Job.find({ recruiterId });
  const jobIds = jobs.map((j) => j._id);

  const [
    totalApplications,
    shortlisted,
    interviews,
    offers,
    rejected,
  ] = await Promise.all([
    Application.countDocuments({ jobId: { $in: jobIds } }),
    Application.countDocuments({ jobId: { $in: jobIds }, status: "Shortlisted" }),
    Application.countDocuments({ jobId: { $in: jobIds }, status: "Interview" }),
    Application.countDocuments({ jobId: { $in: jobIds }, status: "Offer" }),
    Application.countDocuments({ jobId: { $in: jobIds }, status: "Rejected" }),
  ]);

  const activeJobs = jobs.filter((j) => j.status === "Active").length;

  res.json({
    success: true,
    stats: {
      totalJobs: jobs.length,
      activeJobs,
      totalApplications,
      shortlisted,
      interviews,
      offers,
      rejected,
      conversionRate: totalApplications > 0 ? ((offers / totalApplications) * 100).toFixed(1) : 0,
    },
  });
};

// ─── Hiring Funnel ─────────────────────────────────────────────────────────────
export const getHiringFunnel = async (req, res) => {
  const recruiterId = req.user._id;
  const jobs = await Job.find({ recruiterId }).select("_id");
  const jobIds = jobs.map((j) => j._id);

  const funnel = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const statusOrder = ["Applied", "Shortlisted", "Interview", "Offer", "Rejected"];
  const ordered = statusOrder.map((s) => {
    const found = funnel.find((f) => f._id === s);
    return { status: s, count: found ? found.count : 0 };
  });

  res.json({ success: true, funnel: ordered });
};

// ─── AI Score Distribution ────────────────────────────────────────────────────
export const getAIScoreDistribution = async (req, res) => {
  const recruiterId = req.user._id;
  const jobs = await Job.find({ recruiterId }).select("_id");
  const jobIds = jobs.map((j) => j._id);

  const distribution = await Application.aggregate([
    { $match: { jobId: { $in: jobIds }, "aiAnalysis.score": { $ne: null } } },
    {
      $bucket: {
        groupBy: "$aiAnalysis.score",
        boundaries: [0, 20, 40, 60, 80, 101],
        default: "Unknown",
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  const labels = ["0-20", "20-40", "40-60", "60-80", "80-100"];
  const result = labels.map((label, i) => ({
    range: label,
    count: distribution[i]?.count || 0,
  }));

  res.json({ success: true, distribution: result });
};

// ─── Applications Over Time ────────────────────────────────────────────────────
export const getApplicationsOverTime = async (req, res) => {
  const recruiterId = req.user._id;
  const jobs = await Job.find({ recruiterId }).select("_id");
  const jobIds = jobs.map((j) => j._id);

  const last30days = new Date();
  last30days.setDate(last30days.getDate() - 30);

  const data = await Application.aggregate([
    { $match: { jobId: { $in: jobIds }, createdAt: { $gte: last30days } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data });
};

// ─── Top Skill Gaps ────────────────────────────────────────────────────────────
export const getTopSkillGaps = async (req, res) => {
  const recruiterId = req.user._id;
  const jobs = await Job.find({ recruiterId }).select("_id");
  const jobIds = jobs.map((j) => j._id);

  const gaps = await Application.aggregate([
    { $match: { jobId: { $in: jobIds }, "aiAnalysis.missingSkills": { $exists: true, $ne: [] } } },
    { $unwind: "$aiAnalysis.missingSkills" },
    { $group: { _id: "$aiAnalysis.missingSkills", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.json({ success: true, gaps });
};

// ─── Candidate Dashboard Stats ────────────────────────────────────────────────
export const getCandidateStats = async (req, res) => {
  const candidateId = req.user._id;

  const [total, shortlisted, interviews, offers] = await Promise.all([
    Application.countDocuments({ candidateId }),
    Application.countDocuments({ candidateId, status: "Shortlisted" }),
    Application.countDocuments({ candidateId, status: "Interview" }),
    Application.countDocuments({ candidateId, status: "Offer" }),
  ]);

  const interviewCount = await Interview.countDocuments({ candidateId, status: { $in: ["completed", "evaluated"] } });
  const avgScore = await Application.aggregate([
    { $match: { candidateId, "aiAnalysis.score": { $ne: null } } },
    { $group: { _id: null, avg: { $avg: "$aiAnalysis.score" } } },
  ]);

  res.json({
    success: true,
    stats: {
      totalApplications: total,
      shortlisted,
      interviews,
      offers,
      interviewsCompleted: interviewCount,
      avgAIScore: avgScore[0]?.avg?.toFixed(0) || 0,
    },
  });
};