
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import logger from "../config/logger.js";

// ─── Configure Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Storage: Cloudinary (production) vs Memory (fallback) ────────────────────
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  // ── Cloud storage — works on Vercel, Render, any serverless ────────────────
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         "hireiq/resumes",
      allowed_formats:["pdf", "doc", "docx"],
      resource_type:  "raw",              // needed for non-image files
      public_id: (req, file) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        return `resume-${unique}`;
      },
    },
  });
  logger.info("📁 Resume storage: Cloudinary");
} else {
  // ── Memory storage — local dev without Cloudinary ──────────────────────────
  storage = multer.memoryStorage();
  logger.warn("⚠️  Resume storage: memory (set CLOUDINARY_* vars for production)");
}

// ─── File type filter ─────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX files are allowed."), false);
  }
};

// ─── Export middleware ─────────────────────────────────────────────────────────
export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
}).single("resume");
