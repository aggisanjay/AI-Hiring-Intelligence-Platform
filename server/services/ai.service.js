
import { GoogleGenAI } from "@google/genai";
import logger from "../config/logger.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// ─── Safe text extraction — result.text can be undefined ──────────────────────
const getText = (result) => {
  // Try all known response shapes from the Gemini SDK
  const text =
    result?.text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    null;

  if (!text) {
    const reason = result?.candidates?.[0]?.finishReason ?? "UNKNOWN";
    throw new Error(
      reason === "SAFETY"
        ? "Gemini blocked this response due to safety filters."
        : `Gemini returned an empty response (finishReason: ${reason})`
    );
  }
  return text;
};

// ─── Strip markdown fences Gemini sometimes wraps JSON in ─────────────────────
const stripMarkdown = (text) =>
  text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

// ─── Analyze Resume ────────────────────────────────────────────────────────────
export const analyzeResume = async ({ resumeText, jobDescription, requiredSkills }) => {
  try {
    const prompt = `You are an expert technical recruiter. Analyze the following resume against the job description and provide a structured evaluation.

JOB DESCRIPTION:
${jobDescription}

REQUIRED SKILLS: ${requiredSkills.join(", ")}

RESUME:
${resumeText.substring(0, 4000)}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "score": <number 0-100>,
  "strengths": [<list of 3-5 key strengths>],
  "missingSkills": [<list of required skills the candidate lacks>],
  "summary": "<2-3 sentence professional summary of fit>"
}`;

    const result = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const text   = getText(result);
    const parsed = JSON.parse(stripMarkdown(text));

    return {
      score:         Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      strengths:     Array.isArray(parsed.strengths)     ? parsed.strengths     : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      summary:       parsed.summary || "",
    };
  } catch (error) {
    logger.error(`AI Resume Analysis failed: ${error.message}`);
    throw error;
  }
};

// ─── Generate Interview Question ───────────────────────────────────────────────
export const generateInterviewQuestion = async ({ jobRole, messages, isFirst }) => {
  try {
    const systemPrompt = `You are an expert technical interviewer for a ${jobRole} position.
Ask ONE concise interview question (1-2 sentences max).
Follow up naturally based on the candidate's previous answers.
Mix technical, behavioural, and situational questions.
Do NOT number questions. Do NOT say "Great answer!" Just ask the next question directly.`;

    // Only use last 6 messages to avoid prompt bloat and safety filter triggers
    const recentMessages = messages.slice(-6);

    const history = recentMessages
      .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n\n");

    const fullPrompt = isFirst
      ? `${systemPrompt}\n\nBegin the interview for a ${jobRole} role. Ask your opening question.`
      : `${systemPrompt}\n\nConversation so far:\n${history}\n\nAsk your next interview question:`;

    const result = await ai.models.generateContent({ model: MODEL, contents: fullPrompt });

    // ── Safe text extraction ───────────────────────────────────────────────
    let text;
    try {
      text = getText(result);
    } catch (safetyErr) {
      // Safety block on question → return a sensible fallback instead of crashing
      logger.warn(`Gemini safety block on question gen — using fallback. ${safetyErr.message}`);
      const fallbacks = [
        `Can you walk me through a challenging technical problem you solved recently as a ${jobRole}?`,
        `How do you approach debugging a complex production issue under time pressure?`,
        `Describe a time you had to learn a new technology quickly. How did you handle it?`,
        `What's your process for ensuring code quality and catching bugs before they reach production?`,
        `How do you handle disagreements with teammates about technical decisions?`,
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Strip any accidental markdown/JSON wrapping from the response
    const clean = text
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .trim();

    return clean || text;
  } catch (error) {
    logger.error(`AI Question Generation failed: ${error.message}`);

    if (error.message?.includes("API_KEY") || error.message?.includes("API key")) {
      throw new Error("Invalid Gemini API key. Check GEMINI_API_KEY in your .env file.");
    }
    if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Gemini quota exceeded. Please wait and try again.");
    }
    throw error;
  }
};

// ─── Evaluate Interview ────────────────────────────────────────────────────────
export const evaluateInterview = async ({ jobRole, messages }) => {
  try {
    const conversation = messages
      .map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n\n");

    const prompt = `You are a senior hiring manager evaluating a ${jobRole} interview.

INTERVIEW TRANSCRIPT:
${conversation}

Evaluate the candidate and respond ONLY with valid JSON (no markdown, no code fences):
{
  "communicationScore": <number 0-100>,
  "technicalScore": <number 0-100>,
  "overallScore": <number 0-100>,
  "strengths": [<3-4 specific strengths shown>],
  "improvements": [<2-3 areas for improvement>],
  "feedbackSummary": "<3-4 sentence detailed professional feedback>",
  "recommendation": "<Hire | Consider | Reject>"
}`;

    const result = await ai.models.generateContent({ model: MODEL, contents: prompt });
    const text   = getText(result);
    const parsed = JSON.parse(stripMarkdown(text));

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
  } catch (error) {
    logger.error(`AI Interview Evaluation failed: ${error.message}`);
    throw error;
  }
};

// ─── Summarize Job Description ─────────────────────────────────────────────────
export const summarizeJobDescription = async (description) => {
  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: `Summarize this job description in 2 sentences highlighting key requirements:\n\n${description}`,
    });
    return getText(result).trim();
  } catch (error) {
    logger.error(`Job summarization failed: ${error.message}`);
    return description.substring(0, 200) + "...";
  }
};