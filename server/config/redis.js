// import { Queue } from "bullmq";
// import IORedis from "ioredis";
// import logger from "./logger.js";

// export const redisConnection = new IORedis({
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: parseInt(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
//   maxRetriesPerRequest: null, // Required for BullMQ
//   enableReadyCheck: false,
// });

// redisConnection.on("connect", () => logger.info("✅ Redis connected"));
// redisConnection.on("error", (err) => logger.error(`❌ Redis: ${err.message}`));

// // Named queues
// export const resumeQueue    = new Queue("resume-analysis",      { connection: redisConnection });
// export const emailQueue     = new Queue("email-notifications",  { connection: redisConnection });
// export const interviewQueue = new Queue("interview-evaluation", { connection: redisConnection });

import { Queue } from "bullmq";
import IORedis from "ioredis";
import logger from "./logger.js";

let redisConnection = null;
let resumeQueue     = null;
let emailQueue      = null;
let interviewQueue  = null;

try {
  // Upstash provides a full Redis URL → rediss://default:TOKEN@host:6380
  // Local Redis → redis://127.0.0.1:6379
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // ─── URL-based connection (Upstash) ────────────────────────────────────
    redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,   // Required for BullMQ
      enableReadyCheck: false,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined, // TLS for Upstash
    });
  } else {
    // ─── Host/Port connection (local Redis) ────────────────────────────────
    redisConnection = new IORedis({
      host:     process.env.REDIS_HOST     || "127.0.0.1",
      port:     parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn("⚠️  Redis unavailable — background jobs disabled.");
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    });
  }

  redisConnection.on("connect", () => logger.info("✅ Redis (Upstash) connected"));
  redisConnection.on("error",   (err) => logger.warn(`⚠️  Redis: ${err.message}`));

  resumeQueue    = new Queue("resume-analysis",      { connection: redisConnection });
  emailQueue     = new Queue("email-notifications",  { connection: redisConnection });
  interviewQueue = new Queue("interview-evaluation", { connection: redisConnection });

  logger.info("✅ BullMQ queues initialized");

} catch (err) {
  logger.warn(`⚠️  Redis init skipped: ${err.message} — running without background jobs`);
}

// Safe wrapper — won't crash if Redis is down
export const safeQueueAdd = async (queue, jobName, data) => {
  if (!queue) {
    logger.warn(`⚠️  Queue unavailable — skipping job: ${jobName}`);
    return null;
  }
  try {
    return await queue.add(jobName, data);
  } catch (err) {
    logger.warn(`⚠️  Queue job failed (${jobName}): ${err.message}`);
    return null;
  }
};

export { redisConnection, resumeQueue, emailQueue, interviewQueue };