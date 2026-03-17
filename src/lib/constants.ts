import type { Category, IdeaStage, ScoreTier, TargetAudience, UserLevel, VoteType, BadgeCategory, InvestorStagePreference, WatchlistStatus, InvestorRequestStatus } from "@prisma/client";

// ═══════════════════════════════
// APP
// ═══════════════════════════════

export const APP_NAME = "Piqd";
export const APP_DESCRIPTION =
  "Validate your startup idea with real people. Get votes, feedback, and a validation score before you build.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ═══════════════════════════════
// LIMITS
// ═══════════════════════════════

export const MAX_ACTIVE_IDEAS = 3;
export const MAX_TITLE_LENGTH = 60;
export const MAX_PITCH_LENGTH = 140;
export const MAX_PROBLEM_LENGTH = 500;
export const MAX_SOLUTION_LENGTH = 500;
export const MAX_FEEDBACK_QUESTION_LENGTH = 200;
export const MAX_COMMENT_LENGTH = 500;
export const MAX_BIO_LENGTH = 300;
export const MAX_TAGS = 5;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_USERNAME_LENGTH = 3;

export const FEED_PAGE_SIZE = 10;
export const COMMENTS_PAGE_SIZE = 20;
export const NOTIFICATIONS_PAGE_SIZE = 20;
export const LEADERBOARD_PAGE_SIZE = 50;

// ═══════════════════════════════
// SCORING
// ═══════════════════════════════

export const MIN_VOTES_FOR_SCORE = 10;

export const SCORE_WEIGHTS = {
  vote: 0.4,
  engagement: 0.25,
  reach: 0.2,
  quality: 0.15,
} as const;

export const SCORE_TIER_THRESHOLDS: Record<ScoreTier, [number, number]> = {
  EARLY_DAYS: [0, 20],
  GETTING_NOTICED: [21, 40],
  INTERESTED: [41, 60],
  STRONG: [61, 80],
  CROWD_FAVORITE: [81, 100],
};

export const SCORE_TIER_LABELS: Record<ScoreTier, string> = {
  EARLY_DAYS: "Early Days",
  GETTING_NOTICED: "Getting Noticed",
  INTERESTED: "Interested",
  STRONG: "Strong",
  CROWD_FAVORITE: "Crowd Favorite",
};

export const SCORE_TIER_COLORS: Record<ScoreTier, string> = {
  EARLY_DAYS: "#94a3b8",       // slate-400
  GETTING_NOTICED: "#60a5fa",  // blue-400
  INTERESTED: "#a78bfa",       // violet-400
  STRONG: "#f97316",           // orange-500
  CROWD_FAVORITE: "#ef4444",   // red-500
};

// ═══════════════════════════════
// GAMIFICATION
// ═══════════════════════════════

export const POINTS = {
  VOTE: 5,
  COMMENT: 10,
  COMMENT_UPVOTED: 2,
  DAILY_STREAK: 15,
  IDEA_POSTED: 20,
  EARLY_BELIEVER: 50,
  REFERRAL: 25,
} as const;

export const LEVEL_THRESHOLDS: Record<UserLevel, [number, number]> = {
  NEWBIE: [0, 100],
  EXPLORER_LEVEL: [101, 500],
  VALIDATOR: [501, 1500],
  TASTEMAKER: [1501, 5000],
  ORACLE: [5001, Infinity],
};

export const LEVEL_LABELS: Record<UserLevel, string> = {
  NEWBIE: "Newbie",
  EXPLORER_LEVEL: "Explorer",
  VALIDATOR: "Validator",
  TASTEMAKER: "Tastemaker",
  ORACLE: "Oracle",
};

export const MIN_VOTES_FOR_STREAK = 3;

// ═══════════════════════════════
// CATEGORIES & ENUMS DISPLAY
// ═══════════════════════════════

export const CATEGORY_LABELS: Record<Category, string> = {
  FINTECH: "Fintech",
  HEALTHTECH: "Healthtech",
  EDTECH: "Edtech",
  FOOD: "Food & Beverage",
  D2C: "D2C",
  SAAS: "SaaS",
  SOCIAL: "Social",
  ENTERTAINMENT: "Entertainment",
  AGRITECH: "Agritech",
  LOGISTICS: "Logistics",
  AI_ML: "AI / ML",
  SUSTAINABILITY: "Sustainability",
  REAL_ESTATE: "Real Estate",
  TRAVEL: "Travel",
  FITNESS: "Fitness & Wellness",
  OTHER: "Other",
};

export const CATEGORY_EMOJIS: Record<Category, string> = {
  FINTECH: "💰",
  HEALTHTECH: "🏥",
  EDTECH: "📚",
  FOOD: "🍔",
  D2C: "📦",
  SAAS: "☁️",
  SOCIAL: "👥",
  ENTERTAINMENT: "🎬",
  AGRITECH: "🌾",
  LOGISTICS: "🚚",
  AI_ML: "🤖",
  SUSTAINABILITY: "♻️",
  REAL_ESTATE: "🏠",
  TRAVEL: "✈️",
  FITNESS: "💪",
  OTHER: "💡",
};

export const STAGE_LABELS: Record<IdeaStage, string> = {
  JUST_AN_IDEA: "Just an Idea",
  BUILDING: "Building",
  PROTOTYPE: "Prototype Ready",
  LAUNCHED: "Launched",
};

export const TARGET_AUDIENCE_LABELS: Record<TargetAudience, string> = {
  STUDENTS: "Students",
  WORKING_PROFESSIONALS: "Working Professionals",
  HOMEMAKERS: "Homemakers",
  SMALL_BUSINESSES: "Small Businesses",
  TIER_1_CITIES: "Tier 1 Cities",
  TIER_2_3_CITIES: "Tier 2/3 Cities",
  EVERYONE: "Everyone",
};

export const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  USE_THIS: "I'd Use This!",
  MAYBE: "Maybe",
  NOT_FOR_ME: "Not For Me",
};

export const VOTE_TYPE_EMOJIS: Record<VoteType, string> = {
  USE_THIS: "🔥",
  MAYBE: "🤔",
  NOT_FOR_ME: "👎",
};

export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  VOTING: "Voting",
  COMMENTING: "Commenting",
  FOUNDING: "Founding",
  STREAK: "Streak",
  MILESTONE: "Milestone",
  SPECIAL: "Special",
};

// ═══════════════════════════════
// RATE LIMITS
// ═══════════════════════════════

export const RATE_LIMITS = {
  vote: { limit: 50, window: "1 h" as const },
  comment: { limit: 10, window: "1 h" as const },
  upvote: { limit: 50, window: "1 h" as const },
  idea: { limit: 5, window: "1 h" as const },
  ai: { limit: 14, window: "1 m" as const },
  donate: { limit: 10, window: "1 h" as const },
  share: { limit: 30, window: "1 h" as const },
  dm: { limit: 2, window: "24 h" as const },
} as const;

// ═══════════════════════════════
// NEW ACCOUNT VOTE WEIGHT
// ═══════════════════════════════

/** Accounts younger than this (ms) get reduced vote weight */
export const NEW_ACCOUNT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const NEW_ACCOUNT_VOTE_WEIGHT = 0.5;

// ═══════════════════════════════
// NOTIFICATION POLLING
// ═══════════════════════════════

export const NOTIFICATION_POLL_INTERVAL_MS = 30_000; // 30 seconds

// ═══════════════════════════════
// INVESTOR
// ═══════════════════════════════

export const INVESTOR_STAGE_LABELS: Record<InvestorStagePreference, string> = {
  PRE_SEED: "Pre-Seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  ANY: "Any Stage",
};

export const WATCHLIST_STATUS_LABELS: Record<WatchlistStatus, string> = {
  WATCHING: "Watching",
  INTERESTED: "Interested",
  IN_DISCUSSION: "In Discussion",
  FUNDED: "Funded",
  PASSED: "Passed",
};

export const INVESTOR_REQUEST_STATUS_LABELS: Record<InvestorRequestStatus, string> = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
