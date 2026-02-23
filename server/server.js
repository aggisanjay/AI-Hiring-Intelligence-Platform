import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import logger from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./modules/auth/auth.routes.js";
import jobRoutes from "./modules/jobs/jobs.routes.js";
import candidateRoutes from "./modules/candidates/candidates.routes.js";
import interviewRoutes from "./modules/interviews/interviews.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── DB ──────────────────────────────────────────────────────────────────────
connectDB();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many requests. Try again later." },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: "AI rate limit exceeded. Wait 60 seconds." },
});

app.use("/api/", globalLimiter);
app.use("/api/ai/", aiLimiter);

// ─── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  morgan("dev", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// ─── Static ────────────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HireIQ API is running 🚀",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 HireIQ Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`📡 API: http://localhost:${PORT}/api`);
});

export default app;