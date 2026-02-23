
import Interview from "./interviews.model.js";
import { generateInterviewQuestion, evaluateInterview } from "../../services/ai.service.js";
import { interviewQueue, safeQueueAdd } from "../../config/redis.js";

// ─── Start Interview ───────────────────────────────────────────────────────────
export const startInterview = async (req, res) => {
  try {
    const { jobRole, jobId, applicationId } = req.body;
    if (!jobRole) return res.status(400).json({ success: false, message: "Job role is required." });

    const firstQuestion = await generateInterviewQuestion({ jobRole, messages: [], isFirst: true });

    const interview = await Interview.create({
      candidateId:   req.user._id,
      jobId:         jobId || null,
      applicationId: applicationId || null,
      jobRole,
      messages:   [{ role: "assistant", content: firstQuestion }],
      totalTurns: 0,
    });

    res.status(201).json({ success: true, interviewId: interview._id, question: firstQuestion });
  } catch (err) {
    console.error("❌ [startInterview]", err.message, err.stack?.split("\n")[1]);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Send Message ──────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { answer } = req.body;
    console.log(`📨 [sendMessage] interviewId=${req.params.id} answerLength=${answer?.length}`);

    if (!answer?.trim()) {
      return res.status(400).json({ success: false, message: "Answer cannot be empty." });
    }

    const interview = await Interview.findOne({
      _id:         req.params.id,
      candidateId: req.user._id,
    });

    if (!interview) {
      console.error(`❌ [sendMessage] Interview ${req.params.id} not found for user ${req.user._id}`);
      return res.status(404).json({ success: false, message: "Interview session not found." });
    }

    console.log(`📋 [sendMessage] status=${interview.status} turns=${interview.totalTurns}`);

    if (interview.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Interview is already "${interview.status}". Cannot send more answers.`,
      });
    }

    // Save candidate answer
    interview.messages.push({ role: "user", content: answer.trim() });
    interview.totalTurns += 1;

    const isComplete = interview.totalTurns >= 8;
    let nextQuestion = null;

    if (!isComplete) {
      try {
        console.log(`🤖 [sendMessage] Calling Gemini for next question (turn ${interview.totalTurns})...`);
        nextQuestion = await generateInterviewQuestion({
          jobRole:  interview.jobRole,
          messages: interview.messages,
          isFirst:  false,
        });
        console.log(`✅ [sendMessage] Got question: "${nextQuestion.substring(0, 60)}..."`);
        interview.messages.push({ role: "assistant", content: nextQuestion });
      } catch (aiErr) {
        console.error(`❌ [sendMessage] Gemini failed:`, aiErr.message);
        await interview.save();
        return res.status(502).json({
          success: false,
          message: `AI error: ${aiErr.message}`,
        });
      }
    }

    await interview.save();
    res.json({ success: true, nextQuestion, isComplete, turnsLeft: Math.max(0, 8 - interview.totalTurns) });

  } catch (err) {
    console.error("❌ [sendMessage] Unexpected error:", err.message, err.stack?.split("\n")[1]);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
};

// ─── Complete & Evaluate ───────────────────────────────────────────────────────
export const completeInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, candidateId: req.user._id });
    if (!interview) return res.status(404).json({ success: false, message: "Interview not found." });

    interview.status      = "completed";
    interview.completedAt = new Date();
    await interview.save();

    const queued = await safeQueueAdd(interviewQueue, "evaluate-interview", {
      interviewId: interview._id.toString(),
      jobRole:     interview.jobRole,
      messages:    interview.messages,
    });

    if (!queued) {
      // No Redis — evaluate right now synchronously
      try {
        const evaluation = await evaluateInterview({ jobRole: interview.jobRole, messages: interview.messages });
        interview.evaluation = evaluation;
        interview.status     = "evaluated";
        await interview.save();
        return res.json({ success: true, message: "Evaluated.", interviewId: interview._id, evaluated: true });
      } catch (evalErr) {
        console.error("❌ [completeInterview] Sync eval failed:", evalErr.message);
      }
    }

    res.json({ success: true, message: "Interview submitted. Evaluation in progress.", interviewId: interview._id });
  } catch (err) {
    console.error("❌ [completeInterview]", err.message);
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