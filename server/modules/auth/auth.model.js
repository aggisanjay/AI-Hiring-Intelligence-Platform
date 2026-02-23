import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["recruiter", "candidate"],
      required: true,
    },
    avatar: { type: String, default: "" },
    // Recruiter-specific
    organization: { type: String, default: "" },
    organizationId: { type: String, default: "" },
    // Candidate-specific
    title:       { type: String, default: "" },
    skills:      [{ type: String }],
    experience:  { type: Number, default: 0 }, // years
    resumeUrl:   { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    githubUrl:   { type: String, default: "" },
    location:    { type: String, default: "" },
    bio:         { type: String, default: "" },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;