import type {
  User,
  Idea,
  Vote,
  Comment,
  CommentUpvote,
  Badge,
  UserBadge,
  Notification,
  Report,
  IdeaDailyStat,
  InvestorProfile,
  InvestorRequest,
  WatchlistItem,
  InvestorInterest,
  UserRole,
  UserLevel,
  Category,
  IdeaStage,
  IdeaStatus,
  TargetAudience,
  ScoreTier,
  VoteType,
  BadgeCategory,
  NotificationType,
  ReportReason,
  ReportStatus,
  DonationStatus,
  InvestorRequestStatus,
  InvestorStagePreference,
  WatchlistStatus,
  InterestStatus,
  IdeaResearch,
} from "@prisma/client";

// Re-export Prisma types for convenience
export type {
  User,
  Idea,
  IdeaResearch,
  Vote,
  Comment,
  CommentUpvote,
  Badge,
  UserBadge,
  Notification,
  Report,
  IdeaDailyStat,
  InvestorProfile,
  InvestorRequest,
  WatchlistItem,
  InvestorInterest,
  UserRole,
  UserLevel,
  Category,
  IdeaStage,
  IdeaStatus,
  TargetAudience,
  ScoreTier,
  VoteType,
  BadgeCategory,
  NotificationType,
  ReportReason,
  ReportStatus,
  DonationStatus,
  InvestorRequestStatus,
  InvestorStagePreference,
  WatchlistStatus,
  InterestStatus,
};

// ═══════════════════════════════
// COMPOSITE TYPES (Prisma + relations)
// ═══════════════════════════════

/** Idea with founder relation */
export type IdeaWithFounder = Idea & {
  founder: Pick<User, "id" | "name" | "username" | "image">;
};

/** Idea in feed list — includes founder + user's vote (if any) */
export type IdeaFeedItem = Pick<
  Idea,
  | "id"
  | "slug"
  | "title"
  | "pitch"
  | "category"
  | "stage"
  | "totalVotes"
  | "totalComments"
  | "totalViews"
  | "totalShares"
  | "useThisCount"
  | "maybeCount"
  | "notForMeCount"
  | "validationScore"
  | "scoreTier"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "editedAt"
> & {
  founder: Pick<User, "id" | "name" | "username" | "image">;
  votes: Pick<Vote, "type" | "userId">[];
};

/** Full idea detail page — includes comments count + user's existing vote */
export type IdeaDetail = Idea & {
  founder: Pick<User, "id" | "name" | "username" | "image" | "bio" | "city">;
  votes: Pick<Vote, "id" | "type" | "userId">[];
  research?: IdeaResearch | null;
  _count: {
    comments: number;
    votes: number;
  };
};

/** Comment with author and replies (1 level deep) */
export type CommentWithAuthor = Comment & {
  user: Pick<User, "id" | "name" | "username" | "image">;
  _count: {
    upvotes: number;
  };
};

export type CommentWithReplies = CommentWithAuthor & {
  replies: CommentWithAuthor[];
};

/** User profile (public) */
export type UserProfile = Pick<
  User,
  | "id"
  | "name"
  | "username"
  | "image"
  | "bio"
  | "city"
  | "state"
  | "college"
  | "company"
  | "linkedinUrl"
  | "role"
  | "points"
  | "level"
  | "currentStreak"
  | "longestStreak"
  | "createdAt"
> & {
  _count: {
    ideas: number;
    votes: number;
    comments: number;
  };
  badges: (UserBadge & { badge: Badge })[];
};

/** Badge with earned status for display */
export type BadgeWithStatus = Badge & {
  earned: boolean;
  earnedAt?: Date;
};

/** Notification for the bell dropdown */
export type NotificationItem = Pick<
  Notification,
  "id" | "type" | "title" | "body" | "data" | "isRead" | "createdAt"
>;

// ═══════════════════════════════
// ACTION RETURN TYPES
// ═══════════════════════════════

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// ═══════════════════════════════
// FEED / FILTER TYPES
// ═══════════════════════════════

export type SortOption = "trending" | "newest" | "top" | "hot";

export type IdeaFilters = {
  category?: Category;
  stage?: IdeaStage;
  targetAudience?: TargetAudience;
  sort?: SortOption;
  search?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
};

// ═══════════════════════════════
// SCORING TYPES
// ═══════════════════════════════

export type ScoreBreakdown = {
  totalScore: number;
  tier: ScoreTier;
  voteScore: number;
  engagementScore: number;
  reachScore: number;
  qualityScore: number;
};

export type ScoreInput = {
  totalVotes: number;
  useThisCount: number;
  maybeCount: number;
  notForMeCount: number;
  totalComments: number;
  totalViews: number;
  totalShares: number;
  qualityScore: number | null;
  founderComments?: number;
  hasImageOrLink?: boolean;
  profileCompleteness?: number;
  isSuspicious?: boolean;
};

// ═══════════════════════════════
// AI TYPES
// ═══════════════════════════════

export type AIQualityResult = {
  score: number; // 0-100
  isSpam: boolean;
  feedback: string[];
  suggestedTags: string[];
};

export type AIDuplicateResult = {
  isDuplicate: boolean;
  similarIdeas: {
    id: string;
    title: string;
    slug: string;
    similarity: number; // 0-1
  }[];
};

// ═══════════════════════════════
// LEADERBOARD TYPES
// ═══════════════════════════════

export type LeaderboardUser = Pick<
  User,
  "id" | "name" | "username" | "image" | "points" | "level"
> & {
  rank: number;
  _count: {
    votes: number;
    ideas: number;
  };
};

export type LeaderboardIdea = Pick<
  Idea,
  | "id"
  | "slug"
  | "title"
  | "pitch"
  | "category"
  | "validationScore"
  | "scoreTier"
  | "totalVotes"
  | "useThisCount"
> & {
  founder: Pick<User, "name" | "username" | "image">;
};

// ═══════════════════════════════
// ADMIN TYPES
// ═══════════════════════════════

export type ReportWithDetails = Report & {
  user: Pick<User, "id" | "name" | "username" | "image">;
};

export type AdminAnalytics = {
  totalUsers: number;
  totalIdeas: number;
  totalVotes: number;
  totalComments: number;
  newUsersToday: number;
  newIdeasToday: number;
  newVotesToday: number;
  activeUsersWeek: number;
};

// ═══════════════════════════════
// DASHBOARD TYPES
// ═══════════════════════════════

export type DashboardStats = {
  totalIdeas: number;
  totalVotesReceived: number;
  totalCommentsReceived: number;
  averageScore: number;
};

export type DashboardIdea = Pick<
  Idea,
  | "id"
  | "slug"
  | "title"
  | "status"
  | "totalVotes"
  | "totalComments"
  | "validationScore"
  | "scoreTier"
  | "createdAt"
>;

// ═══════════════════════════════
// INVESTOR TYPES
// ═══════════════════════════════

/** Investor request with user info (for admin) */
export type InvestorRequestWithUser = InvestorRequest & {
  user: Pick<User, "id" | "name" | "username" | "image" | "email">;
};

/** Investor profile with user info */
export type InvestorProfileWithUser = InvestorProfile & {
  user: Pick<User, "id" | "name" | "username" | "image">;
};

/** Idea in investor deal flow */
export type InvestorDealFlowItem = Idea & {
  founder: Pick<User, "id" | "name" | "username" | "image" | "bio" | "city">;
  _count: {
    votes: number;
    comments: number;
    watchlistItems: number;
  };
};

/** Watchlist item with idea details */
export type WatchlistItemWithIdea = WatchlistItem & {
  idea: Idea & {
    founder: Pick<User, "id" | "name" | "username" | "image">;
  };
};

/** Interest with idea and investor */
export type InterestWithDetails = InvestorInterest & {
  idea: Pick<Idea, "id" | "slug" | "title" | "pitch">;
  investor: InvestorProfile & {
    user: Pick<User, "id" | "name" | "username" | "image">;
  };
};
