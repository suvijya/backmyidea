import { z } from "zod";
import {
  MAX_TITLE_LENGTH,
  MAX_PITCH_LENGTH,
  MAX_PROBLEM_LENGTH,
  MAX_SOLUTION_LENGTH,
  MAX_FEEDBACK_QUESTION_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_BIO_LENGTH,
  MAX_TAGS,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
} from "./constants";

// ═══════════════════════════════
// ENUMS (mirroring Prisma for client-side validation)
// ═══════════════════════════════

export const CategoryEnum = z.enum([
  "FINTECH", "HEALTHTECH", "EDTECH", "FOOD", "D2C", "SAAS",
  "SOCIAL", "ENTERTAINMENT", "AGRITECH", "LOGISTICS", "AI_ML",
  "SUSTAINABILITY", "REAL_ESTATE", "TRAVEL", "FITNESS", "OTHER",
]);

const IdeaStageEnum = z.enum([
  "JUST_AN_IDEA", "BUILDING", "PROTOTYPE", "LAUNCHED",
]);

const TargetAudienceEnum = z.enum([
  "STUDENTS", "WORKING_PROFESSIONALS", "HOMEMAKERS", "SMALL_BUSINESSES",
  "TIER_1_CITIES", "TIER_2_3_CITIES", "EVERYONE",
]);

const VoteTypeEnum = z.enum(["USE_THIS", "MAYBE", "NOT_FOR_ME"]);

const UserRoleEnum = z.enum(["FOUNDER", "EXPLORER", "BOTH"]);

const ReportReasonEnum = z.enum([
  "SPAM", "INAPPROPRIATE", "STOLEN_IDEA", "FAKE", "HARASSMENT", "OTHER",
]);

// ═══════════════════════════════
// USER SCHEMAS
// ═══════════════════════════════

export const usernameSchema = z
  .string()
  .min(MIN_USERNAME_LENGTH, `Username must be at least ${MIN_USERNAME_LENGTH} characters`)
  .max(MAX_USERNAME_LENGTH, `Username must be at most ${MAX_USERNAME_LENGTH} characters`)
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

export const onboardingSchema = z.object({
  username: usernameSchema,
  role: UserRoleEnum,
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  college: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  linkedinUrl: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  college: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  linkedinUrl: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
  role: UserRoleEnum.optional(),
});

// ═══════════════════════════════
// IDEA SCHEMAS
// ═══════════════════════════════

export const createIdeaSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(MAX_TITLE_LENGTH, `Title must be at most ${MAX_TITLE_LENGTH} characters`),
  pitch: z
    .string()
    .min(10, "Pitch must be at least 10 characters")
    .max(MAX_PITCH_LENGTH, `Pitch must be at most ${MAX_PITCH_LENGTH} characters`),
  problem: z
    .string()
    .min(20, "Problem must be at least 20 characters")
    .max(MAX_PROBLEM_LENGTH, `Problem must be at most ${MAX_PROBLEM_LENGTH} characters`),
  solution: z
    .string()
    .min(20, "Solution must be at least 20 characters")
    .max(MAX_SOLUTION_LENGTH, `Solution must be at most ${MAX_SOLUTION_LENGTH} characters`),
  category: CategoryEnum,
  stage: IdeaStageEnum,
  targetAudience: z
    .array(TargetAudienceEnum)
    .min(1, "Select at least one target audience"),
  feedbackQuestion: z
    .string()
    .max(MAX_FEEDBACK_QUESTION_LENGTH)
    .optional()
    .or(z.literal("")),
  linkUrl: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
  tags: z
    .array(z.string().max(30))
    .max(MAX_TAGS, `Maximum ${MAX_TAGS} tags allowed`)
    .optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const updateIdeaSchema = createIdeaSchema.partial();

// ═══════════════════════════════
// VOTE SCHEMAS
// ═══════════════════════════════

export const castVoteSchema = z.object({
  ideaId: z.string().min(1, "Idea ID is required"),
  type: VoteTypeEnum,
  reason: z.string().max(200).optional(),
});

// ═══════════════════════════════
// COMMENT SCHEMAS
// ═══════════════════════════════

export const createCommentSchema = z.object({
  ideaId: z.string().min(1, "Idea ID is required"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(MAX_COMMENT_LENGTH, `Comment must be at most ${MAX_COMMENT_LENGTH} characters`),
  parentId: z.string().optional(),
});

// ═══════════════════════════════
// REPORT SCHEMAS
// ═══════════════════════════════

export const createReportSchema = z.object({
  entityType: z.enum(["idea", "comment", "user"]),
  entityId: z.string().min(1, "Entity ID is required"),
  reason: ReportReasonEnum,
  details: z.string().max(300).optional(),
});

// ═══════════════════════════════
// SEARCH SCHEMAS
// ═══════════════════════════════

export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  category: CategoryEnum.optional(),
  stage: IdeaStageEnum.optional(),
  sort: z.enum(["trending", "newest", "top", "hot"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

// ═══════════════════════════════
// INVESTOR SCHEMAS
// ═══════════════════════════════

const InvestorStagePreferenceEnum = z.enum([
  "PRE_SEED", "SEED", "SERIES_A", "ANY",
]);

const WatchlistStatusEnum = z.enum([
  "WATCHING", "INTERESTED", "IN_DISCUSSION", "FUNDED", "PASSED",
]);

export const investorRequestSchema = z.object({
  firmName: z.string().max(200).optional().or(z.literal("")),
  linkedinUrl: z.string().url("Valid LinkedIn URL is required"),
  investmentThesis: z
    .string()
    .min(20, "Investment thesis must be at least 20 characters")
    .max(500, "Investment thesis must be at most 500 characters"),
  sectorInterests: z
    .array(CategoryEnum)
    .min(1, "Select at least one sector of interest"),
  stagePreference: InvestorStagePreferenceEnum,
  ticketSizeMin: z.coerce.number().min(0).optional(),
  ticketSizeMax: z.coerce.number().min(0).optional(),
  portfolioCompanies: z.string().max(500).optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const watchlistSchema = z.object({
  ideaId: z.string().min(1, "Idea ID is required"),
  status: WatchlistStatusEnum.optional(),
  notes: z.string().max(500).optional(),
});

export const expressInterestSchema = z.object({
  ideaId: z.string().min(1, "Idea ID is required"),
  message: z.string().max(500).optional(),
});

export const directMessageSchema = z.object({
  ideaId: z.string().min(1, "Idea ID is required"),
  content: z.string().min(5, "Message must be at least 5 characters").max(500, "Message cannot exceed 500 characters"),
});

// ═══════════════════════════════
// TYPE INFERENCE
// ═══════════════════════════════

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type InvestorRequestInput = z.infer<typeof investorRequestSchema>;
export type WatchlistInput = z.infer<typeof watchlistSchema>;
export type ExpressInterestInput = z.infer<typeof expressInterestSchema>;
export type DirectMessageInput = z.infer<typeof directMessageSchema>;
