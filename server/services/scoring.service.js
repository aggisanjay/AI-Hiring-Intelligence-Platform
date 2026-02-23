/**
 * Smart Candidate Matching Engine
 * score = (skillMatch * 0.6) + (experienceMatch * 0.3) + (aiScore * 0.1)
 */

// ─── Calculate Skill Match ─────────────────────────────────────────────────────
const getSkillMatchScore = (candidateSkills, requiredSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const matched = requiredSkills.filter((skill) => candidateSet.has(skill.toLowerCase()));

  return Math.round((matched.length / requiredSkills.length) * 100);
};

// ─── Calculate Experience Match ───────────────────────────────────────────────
const getExperienceScore = (candidateExp, requiredExpMin) => {
  if (!requiredExpMin || requiredExpMin === 0) return 100;
  if (candidateExp >= requiredExpMin) return 100;
  if (candidateExp === 0) return 0;
  return Math.round((candidateExp / requiredExpMin) * 100);
};

// ─── Main Scoring Function ─────────────────────────────────────────────────────
export const calculateMatchScore = ({ candidateSkills, requiredSkills, candidateExp, requiredExpMin, aiScore }) => {
  const skillScore      = getSkillMatchScore(candidateSkills, requiredSkills);
  const experienceScore = getExperienceScore(candidateExp, requiredExpMin);
  const normalizedAI    = aiScore !== null && aiScore !== undefined ? aiScore : skillScore;

  const weighted = (skillScore * 0.6) + (experienceScore * 0.3) + (normalizedAI * 0.1);
  return Math.min(100, Math.round(weighted));
};

// ─── Rank Multiple Candidates ─────────────────────────────────────────────────
export const rankCandidates = (candidates, job) => {
  return candidates
    .map((app) => {
      const candidate = app.candidateId;
      const matchScore = calculateMatchScore({
        candidateSkills: candidate.skills || [],
        requiredSkills:  job.requiredSkills || [],
        candidateExp:    candidate.experience || 0,
        requiredExpMin:  job.experienceMin || 0,
        aiScore:         app.aiAnalysis?.score || null,
      });
      return { ...app.toObject(), matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

// ─── Get Skill Gap Analysis ───────────────────────────────────────────────────
export const getSkillGap = (candidateSkills, requiredSkills) => {
  const candidateSet = new Set((candidateSkills || []).map((s) => s.toLowerCase()));
  const matched  = (requiredSkills || []).filter((s) => candidateSet.has(s.toLowerCase()));
  const missing  = (requiredSkills || []).filter((s) => !candidateSet.has(s.toLowerCase()));
  return { matched, missing, percentage: getSkillMatchScore(candidateSkills, requiredSkills) };
};