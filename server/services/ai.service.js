
import { GoogleGenAI } from "@google/genai";
import logger from "../config/logger.js";

const ai    = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// ─── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Detect real rate limit vs other errors ────────────────────────────────────
const isRateLimitError = (err) => {
  // Gemini SDK puts status code on err.status or err.statusCode
  if (err.status === 429 || err.statusCode === 429) return true;
  // Check error code string from Google API
  if (err.code === "RESOURCE_EXHAUSTED") return true;
  // Check HTTP response details if present
  if (err.response?.status === 429) return true;
  // Last resort: check message but only for very specific strings
  const msg = err.message || "";
  if (msg.includes("RESOURCE_EXHAUSTED")) return true;
  if (msg.includes("rateLimitExceeded"))  return true;
  return false;
};

// ─── Retry only on real rate limits ───────────────────────────────────────────
const withRetry = async (fn, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isRateLimitError(err) && attempt < retries) {
        const delay = attempt * 3000; // 3s, 6s
        logger.warn(`⚠️  Gemini rate limit. Retrying in ${delay / 1000}s (attempt ${attempt}/${retries})`);
        await sleep(delay);
        continue;
      }
      throw err; // re-throw everything else immediately
    }
  }
};

// ─── Safe text extraction ──────────────────────────────────────────────────────
const getText = (result) => {
  const text =
    result?.text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    null;
  if (!text) {
    const reason = result?.candidates?.[0]?.finishReason ?? "UNKNOWN";
    if (reason === "SAFETY") throw new Error("SAFETY_BLOCK");
    throw new Error(`Gemini returned empty response (finishReason: ${reason})`);
  }
  return text;
};

// ─── Strip markdown fences ────────────────────────────────────────────────────
const cleanJSON = (text) =>
  text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

// ─── Core generate ─────────────────────────────────────────────────────────────
const generate = (contents) =>
  withRetry(() => ai.models.generateContent({ model: MODEL, contents }));

// ─── Analyze Resume ────────────────────────────────────────────────────────────
export const analyzeResume = async ({ resumeText, jobDescription, requiredSkills }) => {
  const prompt = `You are an expert technical recruiter. Analyze the resume against the job description.

JOB DESCRIPTION: ${jobDescription?.substring(0, 1000) || "Not provided"}
REQUIRED SKILLS: ${(requiredSkills || []).join(", ")}
RESUME TEXT: ${resumeText?.substring(0, 3000) || "No resume text extracted"}

Respond ONLY with valid JSON (no markdown, no explanation):
{"score":<number 0-100>,"strengths":["...","...","..."],"missingSkills":["...","..."],"summary":"2-3 sentence summary"}`;

  try {
    const result = await generate(prompt);
    const text   = getText(result);
    const parsed = JSON.parse(cleanJSON(text));
    return {
      score:         Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      strengths:     Array.isArray(parsed.strengths)     ? parsed.strengths     : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      summary:       parsed.summary || "",
    };
  } catch (err) {
    logger.error(`analyzeResume failed: ${err.message}`);
    throw err;
  }
};

// ─── Fallback questions ────────────────────────────────────────────────────────
const FALLBACKS = [
  (r) => `Walk me through a challenging project you worked on recently as a ${r}.`,
  ()  => `What's the most complex technical problem you've solved in the past year?`,
  ()  => `How do you approach debugging a production issue under time pressure?`,
  ()  => `Describe how you ensure code quality before shipping.`,
  ()  => `Tell me about a time you disagreed with a teammate on a technical decision.`,
  ()  => `How do you prioritize when you have multiple urgent tasks?`,
  ()  => `What's a technical skill you've improved most recently and how?`,
];
let fallbackIdx = 0;
const nextFallback = (role) => FALLBACKS[(fallbackIdx++) % FALLBACKS.length](role);

// ─── Generate Interview Question ───────────────────────────────────────────────
export const generateInterviewQuestion = async ({ jobRole, messages, isFirst }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const system = `You are a technical interviewer for a ${jobRole} position.
Ask ONE concise question (1-2 sentences max). No numbering. No filler phrases. Just the question directly.`;

  const recent  = messages.slice(-6);
  const history = recent.map((m) =>
    `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`
  ).join("\n\n");

  const prompt = isFirst
    ? `${system}\n\nBegin the interview. Ask your opening question.`
    : `${system}\n\nConversation so far:\n${history}\n\nAsk your next question:`;

  try {
    const result = await generate(prompt);
    let text;
    try {
      text = getText(result);
    } catch (safetyErr) {
      if (safetyErr.message === "SAFETY_BLOCK") {
        logger.warn("Safety block on question — using fallback");
        return nextFallback(jobRole);
      }
      throw safetyErr;
    }
    return text.replace(/```[\s\S]*?```/g, "").trim() || nextFallback(jobRole);
  } catch (err) {
    if (isRateLimitError(err)) {
      logger.warn("Rate limit after retries — using fallback question");
      return nextFallback(jobRole);
    }
    logger.error(`generateInterviewQuestion failed: ${err.message}`);
    if (err.status === 401 || err.message?.includes("API key") || err.message?.includes("API_KEY")) {
      throw new Error("Invalid Gemini API key. Check GEMINI_API_KEY in your .env file.");
    }
    throw err;
  }
};

// ─── Evaluate Interview ────────────────────────────────────────────────────────
export const evaluateInterview = async ({ jobRole, messages }) => {
  const transcript = messages
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are a senior hiring manager evaluating a ${jobRole} interview.

TRANSCRIPT:
${transcript}

Respond ONLY with valid JSON (no markdown):
{"communicationScore":<0-100>,"technicalScore":<0-100>,"overallScore":<0-100>,"strengths":["..."],"improvements":["..."],"feedbackSummary":"3-4 sentence feedback","recommendation":"Hire|Consider|Reject"}`;

  try {
    const result = await generate(prompt);
    const parsed = JSON.parse(cleanJSON(getText(result)));
    return {
      communicationScore: Number(parsed.communicationScore) || 0,
      technicalScore:     Number(parsed.technicalScore)     || 0,
      overallScore:       Number(parsed.overallScore)       || 0,
      strengths:          Array.isArray(parsed.strengths)   ? parsed.strengths    : [],
      improvements:       Array.isArray(parsed.improvements)? parsed.improvements : [],
      feedbackSummary:    parsed.feedbackSummary || "",
      recommendation:     ["Hire","Consider","Reject"].includes(parsed.recommendation)
                            ? parsed.recommendation : "Consider",
    };
  } catch (err) {
    logger.error(`evaluateInterview failed: ${err.message}`);
    throw new Error(`Evaluation failed: ${err.message}`);
  }
};

// ─── Summarize Job Description ─────────────────────────────────────────────────
export const summarizeJobDescription = async (description) => {
  try {
    const result = await generate(
      `Summarize in 2 sentences highlighting key requirements:\n\n${description}`
    );
    return getText(result).trim();
  } catch {
    return description?.substring(0, 200) + "..." || "";
  }
};