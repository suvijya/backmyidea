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
    founderComments = 0,
    hasImageOrLink = false,
    profileCompleteness = 0.5,
    isSuspicious = false,
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
  
  let voteScore = Math.round(
    ((weightedVotes - minWeightedVotes) / (maxWeightedVotes - minWeightedVotes)) * 100
  );

  // Penalize heavily if >80% are "Not For Me"
  if (notForMeCount / totalVotes > 0.8) {
    voteScore = Math.max(0, voteScore - 30);
  }

  // ── Engagement Score (25%) ────────────────────
  // Comment-to-view ratio. 0.05 ratio = perfect base score (5%).
  const commentRatio = totalViews > 0 ? totalComments / totalViews : 0;
  let commentScore = Math.min(commentRatio / 0.05, 1) * 60;
  
  // Share-to-view ratio. 0.02 ratio = perfect share score (2%).
  const shareRatio = totalViews > 0 ? totalShares / totalViews : 0;
  const shareScore = Math.min(shareRatio / 0.02, 1) * 30;

  // Founder reply bonus (up to 10 points for replying to feedback)
  const founderReplyBonus = Math.min(founderComments / 5, 1) * 10;
  
  const engagementScore = Math.round(commentScore + shareScore + founderReplyBonus);

  // ── Reach Score (20%) ─────────────────────────
  // Total unique viewers log scale
  const viewReach = Math.min(Math.log10(Math.max(totalViews, 1)) / Math.log10(10000), 1) * 60;
  
  // Voter-to-viewer ratio (high = good). 0.2 ratio = perfect conversion (20%).
  const conversionRatio = totalViews > 0 ? totalVotes / totalViews : 0;
  const conversionScore = Math.min(conversionRatio / 0.2, 1) * 40;
  
  const reachScore = Math.round(viewReach + conversionScore);

  // ── Idea Quality (15%) ───────────────────────
  // Clarity score from AI
  const baseAiScore = aiQualityScore ?? 50;
  
  // Has image/link (bonus)
  const imageLinkBonus = hasImageOrLink ? 10 : 0;
  
  // Profile completeness (multiplier 0.5 to 1.0 applied to remaining points)
  const profileBonus = profileCompleteness * 15;
  
  // Normalize quality score back to 100 scale
  const qualityScore = Math.round(Math.min((baseAiScore * 0.75) + imageLinkBonus + profileBonus, 100));

  // ── Final Score ───────────────────────────────
  let rawScore =
    voteScore * SCORE_WEIGHTS.vote +
    engagementScore * SCORE_WEIGHTS.engagement +
    reachScore * SCORE_WEIGHTS.reach +
    qualityScore * SCORE_WEIGHTS.quality;

  // Apply penalty for suspicious gaming
  if (isSuspicious) {
    rawScore = rawScore * 0.5; // Halve the score if flagged
  }

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
