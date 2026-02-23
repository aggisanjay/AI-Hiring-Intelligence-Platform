import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ["assistant", "user"], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const interviewSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User",        required: true },
    jobId:       { type: mongoose.Schema.Types.ObjectId, ref: "Job",         required: false },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: false },

    jobRole:     { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "evaluated"],
      default: "active",
    },

    messages:    [messageSchema],
    totalTurns:  { type: Number, default: 0 },

    // AI Evaluation (filled after completion)
    evaluation: {
      communicationScore: { type: Number },  // 0-100
      technicalScore:     { type: Number },  // 0-100
      overallScore:       { type: Number },  // 0-100
      strengths:          [{ type: String }],
      improvements:       [{ type: String }],
      feedbackSummary:    { type: String },
      recommendation:     { type: String, enum: ["Hire", "Consider", "Reject", null], default: null },
      evaluatedAt:        { type: Date },
    },

    startedAt:   { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;