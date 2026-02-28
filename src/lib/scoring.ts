import type { ScoreTier } from "@prisma/client";
import type { ScoreBreakdown, ScoreInput } from "@/types";
import { MIN_VOTES_FOR_SCORE, SCORE_WEIGHTS } from "./constants";

/**
 * Calculate validation score — PURE FUNCTION, no DB calls.
 *
 * Returns 0 + EARLY_DAYS if totalVotes < MIN_VOTES_FOR_SCORE.
 * Otherwise returns 0-100 score with tier.
 *
 * Sub-scores:
 * - voteScore (40%): weighted ratio of USE_THIS vs NOT_FOR_ME
 * - engagementScore (25%): comment-to-vote ratio
 * - reachScore (20%): total votes + views impact
 * - qualityScore (15%): AI quality score (if available)
 */
export function calculateValidationScore(input: ScoreInput): ScoreBreakdown {
  const {
    totalVotes,
    useThisCount,
    maybeCount,
    notForMeCount,
    totalComments,
    totalViews,
    totalShares,
    qualityScore: aiQualityScore,
  } = input;

  // Below threshold — return early
  if (totalVotes < MIN_VOTES_FOR_SCORE) {
    return {
      totalScore: 0,
      tier: "EARLY_DAYS" as ScoreTier,
      voteScore: 0,
      engagementScore: 0,
      reachScore: 0,
      qualityScore: 0,
    };
  }

  // ── Vote Score (40%) ──────────────────────────
  // Weighted: USE_THIS = 1.0, MAYBE = 0.3, NOT_FOR_ME = -0.5
  const weightedVotes =
    useThisCount * 1.0 + maybeCount * 0.3 + notForMeCount * -0.5;
  // Max possible weighted score is all USE_THIS
  const maxWeightedVotes = totalVotes * 1.0;
  // Normalize to 0-100 (shift the range since negatives are possible)
  const minWeightedVotes = totalVotes * -0.5;
  const voteScore = Math.round(
    ((weightedVotes - minWeightedVotes) / (maxWeightedVotes - minWeightedVotes)) * 100
  );

  // ── Engagement Score (25%) ────────────────────
  // Comment-to-vote ratio. 0.5+ ratio = perfect score. Shares boost.
  const commentRatio = totalVotes > 0 ? totalComments / totalVotes : 0;
  const commentScore = Math.min(commentRatio / 0.5, 1) * 80;
  const shareBonus = Math.min(totalShares / 20, 1) * 20;
  const engagementScore = Math.round(commentScore + shareBonus);

  // ── Reach Score (20%) ─────────────────────────
  // Logarithmic scale. 500 votes = ~100, 100 views = modest boost.
  const voteReach = Math.min(Math.log10(Math.max(totalVotes, 1)) / Math.log10(500), 1) * 70;
  const viewReach = Math.min(Math.log10(Math.max(totalViews, 1)) / Math.log10(10000), 1) * 30;
  const reachScore = Math.round(voteReach + viewReach);

  // ── Quality Score (15%) ───────────────────────
  // Directly from AI quality check. Default to 50 if AI unavailable.
  const qualityScore = aiQualityScore ?? 50;

  // ── Final Score ───────────────────────────────
  const rawScore =
    voteScore * SCORE_WEIGHTS.vote +
    engagementScore * SCORE_WEIGHTS.engagement +
    reachScore * SCORE_WEIGHTS.reach +
    qualityScore * SCORE_WEIGHTS.quality;

  const totalScore = Math.round(Math.max(0, Math.min(100, rawScore)));
  const tier = getScoreTier(totalScore);

  return {
    totalScore,
    tier,
    voteScore,
    engagementScore,
    reachScore,
    qualityScore,
  };
}

/**
 * Determine score tier from total score.
 */
export function getScoreTier(score: number): ScoreTier {
  if (score <= 20) return "EARLY_DAYS";
  if (score <= 40) return "GETTING_NOTICED";
  if (score <= 60) return "INTERESTED";
  if (score <= 80) return "STRONG";
  return "CROWD_FAVORITE";
}
