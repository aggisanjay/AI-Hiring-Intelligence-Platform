

import Interview from "./interviews.model.js";
import { generateInterviewQuestion, evaluateInterview } from "../../services/ai.service.js";

// ─── Start Interview ───────────────────────────────────────────────────────────
export const startInterview = async (req, res) => {
  try {
    const { jobRole, jobId, applicationId } = req.body;
    if (!jobRole) return res.status(400).json({ success: false, message: "Job role is required." });

    const firstQuestion = await generateInterviewQuestion({ jobRole, messages: [], isFirst: true });

    const interview = await Interview.create({
      candidateId:   req.user._id,
      jobId:         jobId         || null,
      applicationId: applicationId || null,
      jobRole,
      messages:   [{ role: "assistant", content: firstQuestion }],
      totalTurns: 0,
    });

    res.status(201).json({ success: true, interviewId: interview._id, question: firstQuestion });
  } catch (err) {
    console.error("❌ [startInterview]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Send Message ──────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ success: false, message: "Answer cannot be empty." });

    const interview = await Interview.findOne({ _id: req.params.id, candidateId: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: "Interview session not found." });
    if (interview.status !== "active") return res.status(400).json({ success: false, message: `Interview is already ${interview.status}.` });

    interview.messages.push({ role: "user", content: answer.trim() });
    interview.totalTurns += 1;

    const isComplete = interview.totalTurns >= 8;
    let nextQuestion = null;

    if (!isComplete) {
      try {
        nextQuestion = await generateInterviewQuestion({
          jobRole:  interview.jobRole,
          messages: interview.messages,
          isFirst:  false,
        });
        interview.messages.push({ role: "assistant", content: nextQuestion });
      } catch (aiErr) {
        console.error("❌ Gemini error in sendMessage:", aiErr.message);
        await interview.save();
        return res.status(502).json({ success: false, message: `AI error: ${aiErr.message}` });
      }
    }

    await interview.save();
    res.json({ success: true, nextQuestion, isComplete, turnsLeft: Math.max(0, 8 - interview.totalTurns) });
  } catch (err) {
    console.error("❌ [sendMessage]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Run evaluation (shared logic used by complete + retry) ───────────────────
const runEvaluation = async (interview) => {
  const evaluation = await evaluateInterview({
    jobRole:  interview.jobRole,
    messages: interview.messages,
  });
  interview.evaluation = { ...evaluation, evaluatedAt: new Date() };
  interview.status     = "evaluated";
  await interview.save();
  return evaluation;
};

// ─── Complete Interview & Evaluate ─────────────────────────────────────────────
export const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, candidateId: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found." });

    // Mark completed
    interview.status      = "completed";
    interview.completedAt = new Date();
    await interview.save();

    // Evaluate synchronously — Gemini call happens here
    try {
      const evaluation = await runEvaluation(interview);
      console.log(`✅ Interview evaluated. Score: ${evaluation.overallScore}`);
      return res.json({
        success:    true,
        evaluated:  true,
        evaluation,
        interviewId: interview._id,
      });
    } catch (evalErr) {
      console.error("❌ Evaluation failed:", evalErr.message);
      // Leave status as "completed" so frontend can retry
      return res.json({
        success:     true,
        evaluated:   false,
        evalError:   evalErr.message,
        interviewId: interview._id,
        message:     "Interview saved. Evaluation failed — use the retry button.",
      });
    }
  } catch (err) {
    console.error("❌ [completeInterview]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Retry Evaluation (called from frontend retry button) ─────────────────────
export const retryEvaluation = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id:         req.params.id,
      candidateId: req.user._id,
    });
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found." });
    if (interview.status === "active") return res.status(400).json({ success: false, message: "Interview not completed yet." });

    // Already evaluated — just return it
    if (interview.status === "evaluated") {
      return res.json({ success: true, evaluated: true, evaluation: interview.evaluation });
    }

    // Try evaluating again
    try {
      const evaluation = await runEvaluation(interview);
      console.log(`✅ Retry evaluation success. Score: ${evaluation.overallScore}`);
      return res.json({ success: true, evaluated: true, evaluation });
    } catch (evalErr) {
      console.error("❌ Retry evaluation failed:", evalErr.message);
      return res.status(502).json({ success: false, message: `Evaluation failed: ${evalErr.message}` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Result ────────────────────────────────────────────────────────────────
export const getInterviewResult = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, candidateId: req.user._id })
      .populate("jobId", "title department");
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found." });
    res.json({ success: true, interview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get My Interviews ─────────────────────────────────────────────────────────
export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ candidateId: req.user._id })
      .populate("jobId", "title department organization")
      .sort({ createdAt: -1 });
    res.json({ success: true, interviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Candidate Interviews (Recruiter) ─────────────────────────────────────
export const getCandidateInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ candidateId: req.params.candidateId })
      .populate("jobId", "title department")
      .sort({ createdAt: -1 });
    res.json({ success: true, interviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};