import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Interview", "Offer", "Rejected"],
      default: "Applied",
    },
    coverLetter: { type: String, default: "" },
    resumeUrl:   { type: String, default: "" },
    resumeText:  { type: String, default: "" }, // Extracted PDF text

    // AI Analysis
    aiAnalysis: {
      score:         { type: Number, default: null },     // 0-100
      strengths:     [{ type: String }],
      missingSkills: [{ type: String }],
      summary:       { type: String, default: "" },
      analyzedAt:    { type: Date },
      status:        { type: String, enum: ["pending", "processing", "done", "failed"], default: "pending" },
    },

    // Weighted match score (scoring.service)
    matchScore: { type: Number, default: 0 },

    // Recruiter notes
    notes:        { type: String, default: "" },
    rating:       { type: Number, min: 1, max: 5 },
    interviewDate: { type: Date },
    statusHistory: [
      {
        status:    String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate applications
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ candidateId: 1 });

const Application = mongoose.model("Application", applicationSchema);
export default Application;