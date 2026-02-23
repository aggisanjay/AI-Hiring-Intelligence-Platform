import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: 5000,
    },
    requirements: { type: String, default: "" },
    responsibilities: { type: String, default: "" },
    requiredSkills: [{ type: String, trim: true }],
    niceToHaveSkills: [{ type: String }],
    department: { type: String, default: "Engineering" },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      default: "Full-time",
    },
    location:    { type: String, default: "Remote" },
    salaryMin:   { type: Number },
    salaryMax:   { type: Number },
    salaryCurrency: { type: String, default: "USD" },
    experienceMin: { type: Number, default: 0 },
    experienceMax: { type: Number, default: 10 },
    status: {
      type: String,
      enum: ["Active", "Paused", "Closed", "Draft"],
      default: "Active",
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: { type: String, default: "" },
    applicantsCount: { type: Number, default: 0 },
    deadline: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: salary range string
jobSchema.virtual("salaryRange").get(function () {
  if (!this.salaryMin && !this.salaryMax) return "Not specified";
  return `$${(this.salaryMin / 1000).toFixed(0)}k – $${(this.salaryMax / 1000).toFixed(0)}k`;
});

jobSchema.index({ status: 1, recruiterId: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ title: "text", description: "text" });

const Job = mongoose.model("Job", jobSchema);
export default Job;