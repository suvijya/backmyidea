# BackMyIdea -- Complete Build Progress

> **Last updated:** March 2026
> Every feature, fix, and implementation step documented in order.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Phase 0 -- Bootstrap & Project Setup](#3-phase-0----bootstrap--project-setup)
4. [Phase 1 -- Database, Core Libs & Auth](#4-phase-1----database-core-libs--auth)
5. [Phase 2 -- Layouts, Onboarding & Navigation](#5-phase-2----layouts-onboarding--navigation)
6. [Phase 3 -- Idea CRUD, Feed & Explore](#6-phase-3----idea-crud-feed--explore)
7. [Phase 4 -- Voting System & Idea Detail](#7-phase-4----voting-system--idea-detail)
8. [Phase 5 -- Comments, Profiles & Dashboard](#8-phase-5----comments-profiles--dashboard)
9. [Phase 6 -- Gamification & Leaderboards](#9-phase-6----gamification--leaderboards)
10. [Phase 7 -- Virality, Search & Polish](#10-phase-7----virality-search--polish)
11. [Phase 8 -- Admin Panel & Moderation](#11-phase-8----admin-panel--moderation)
12. [Phase 9 -- Micro-Donations (Razorpay)](#12-phase-9----micro-donations-razorpay)
13. [Phase 10 -- VC/Investor Dashboard](#13-phase-10----vcinvestor-dashboard)
14. [Phase 11 -- Security Audit & Bug Fixes](#14-phase-11----security-audit--bug-fixes)
15. [Phase 12 -- Mobile Responsiveness Fixes](#15-phase-12----mobile-responsiveness-fixes)
16. [Complete File Inventory](#16-complete-file-inventory)
17. [Database Schema Summary](#17-database-schema-summary)
18. [API Route Map](#18-api-route-map)
19. [Current Status & What's Next](#19-current-status--whats-next)

---

## 1. Project Overview

**BackMyIdea** is a four-sided startup idea validation platform for India:

- **Founders** post startup ideas in a structured format
- **Public (Validators)** vote and comment to validate ideas
- **Investors** (Phase 3) get a curated deal flow dashboard
- **Platform** generates structured data on Indian innovation trends

**Core loop:** Founder posts idea --> Public validates --> Score generated --> Founder shares validation card --> More people discover platform.

**North Star Metric:** Ideas receiving 50+ genuine votes per month.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui (New York style, Zinc) |
| Forms | React Hook Form + Zod |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk (Google OAuth) |
| Cache + Rate Limiting | Upstash Redis |
| AI | Google Gemini 2.0 Flash (free tier) |
| File Uploads | Uploadthing |
| Image Generation | @vercel/og (Satori) |
| Charts | Recharts |
| Animations | Framer Motion |
| Email | Resend |
| Payments | Razorpay (micro-donations) |
| Deployment | Vercel |

---

## 3. Phase 0 -- Bootstrap & Project Setup

### What was done
- Initialized Next.js 15 project with TypeScript strict mode
- Installed all dependencies (40+ packages)
- Set up shadcn/ui with New York style and Zinc base color
- Installed 25 shadcn/ui components
- Configured Tailwind CSS v4 (CSS-based config in `globals.css`)
- Set up project folder structure matching the spec
- Created environment variable template (`.env.example`)

### Files created
```
package.json                    -- All dependencies
next.config.ts                  -- Image remote patterns (Clerk, Uploadthing, Google)
tsconfig.json                   -- Strict mode, path aliases (@/*)
postcss.config.mjs              -- Tailwind v4 PostCSS plugin
eslint.config.mjs               -- Next.js + TypeScript rules
components.json                 -- shadcn/ui config
src/app/globals.css             -- Tailwind v4 theme (brand colors, fonts, animations)
src/app/layout.tsx              -- Root layout (ClerkProvider, fonts, metadata)
src/app/favicon.ico             -- Favicon
src/components/providers.tsx    -- ClerkProvider + Sonner wrapper
```

### Brand design system implemented in `globals.css`
- **Colors:** Signal Orange (#F05A28), warm neutrals, semantic colors
- **Fonts:** Instrument Serif (display), Plus Jakarta Sans (body), DM Mono (data/numbers)
- **Custom animations:** shimmer, score-ring-draw, vote-fly-up, count-pulse, stagger-in, gentle-float
- **Custom shadows:** shadow-card, shadow-elevated, shadow-saffron

### shadcn/ui components installed (25)
alert-dialog, avatar, badge, button, card, checkbox, dialog, dropdown-menu, form, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, tooltip

---

## 4. Phase 1 -- Database, Core Libs & Auth

### Prisma Schema (`prisma/schema.prisma`)
- Defined **14 models**: User, Idea, Vote, Comment, CommentUpvote, Badge, UserBadge, Notification, Report, IdeaDailyStat, Donation, InvestorProfile, InvestorRequest, WatchlistItem, InvestorInterest
- Defined **17 enums**: UserRole, UserLevel, Category, IdeaStage, IdeaStatus, TargetAudience, ScoreTier, VoteType, BadgeCategory, NotificationType, ReportReason, ReportStatus, DonationStatus, InvestorRequestStatus, InvestorStagePreference, WatchlistStatus, InterestStatus
- Composite unique constraints: `[userId, ideaId]` on Vote, `[userId, commentId]` on CommentUpvote, `[userId, badgeId]` on UserBadge, `[ideaId, date]` on IdeaDailyStat, `[investorId, ideaId]` on WatchlistItem and InvestorInterest
- Cached counts on Idea: totalVotes, totalViews, totalComments, totalShares, useThisCount, maybeCount, notForMeCount, validationScore, scoreTier, totalDonations, donorCount
- Pushed schema to Supabase via `prisma db push`
- Generated Prisma client via `prisma generate`

### Core Lib Files

| File | What it does |
|---|---|
| `src/lib/prisma.ts` | Prisma singleton (global cache for dev hot-reload) |
| `src/lib/clerk.ts` | `getCurrentUser()`, `requireUser()`, `requireAdmin()` -- server-only auth helpers using Clerk |
| `src/lib/utils.ts` | `cn()`, `generateSlug()` (nanoid suffix), `timeAgo()`, `formatDate()`, `formatNumber()`, `getVotePercentages()`, `truncate()`, `isValidUrl()`, `absoluteUrl()`, `pluralize()` |
| `src/lib/validations.ts` | 12 Zod schemas: username, onboarding, profile, idea CRUD, vote, comment, report, search, investor request, watchlist, express interest |
| `src/lib/constants.ts` | App config, feed limits, scoring weights/tiers, gamification points/levels, category/stage/audience labels with emojis, rate limit configs, investor constants |
| `src/lib/redis.ts` | Upstash Redis client + 6 rate limiters: vote (50/hr), comment (10/hr), idea (5/hr), AI (14/min), donate (10/hr), share (30/hr) |
| `src/lib/gemini.ts` | `checkIdeaQuality()` and `checkDuplicateIdea()` using Google Gemini 2.0 Flash. Fails open if AI unavailable. |
| `src/lib/scoring.ts` | `calculateValidationScore()` -- pure function, 4 sub-scores (vote 40%, engagement 25%, reach 20%, quality 15%), returns 0 + EARLY_DAYS below 10 votes. `getScoreTier()`. |
| `src/lib/razorpay.ts` | `createRazorpayOrder()`, `verifyRazorpaySignature()` (HMAC-SHA256, timing-safe), `isValidDonationAmount()`, donation tier constants |
| `src/lib/resend.ts` | `sendDonorConfirmation()`, `sendFounderDonationAlert()` -- fire-and-forget email helpers |
| `src/lib/notifications.ts` | `createNotificationInternal()` -- internal helper (no "use server" directive) |
| `src/lib/gamification.ts` | `awardPoints()`, `updateUserLevel()`, `updateStreak()`, `checkAndAwardBadges()`, `checkEarlyBeliever()` -- internal helpers (no "use server" directive) |

### Types (`src/types/index.ts`)
- Re-exports all Prisma types
- Composite types: `IdeaWithFounder`, `IdeaFeedItem`, `IdeaDetail`, `CommentWithAuthor`, `CommentWithReplies`, `UserProfile`, `BadgeWithStatus`, `NotificationItem`
- Action types: `ActionResult<T>` pattern (`{ success: true; data: T } | { success: false; error: string }`)
- Feed/filter types: `SortOption`, `IdeaFilters`, `PaginatedResponse<T>`
- Scoring types: `ScoreBreakdown`, `ScoreInput`
- AI types: `AIQualityResult`, `AIDuplicateResult`
- Dashboard types: `DashboardStats`, `DashboardIdea`
- Investor types: `InvestorRequestWithUser`, `InvestorDealFlowItem`, `WatchlistItemWithIdea`, `InterestWithDetails`

### Auth -- Clerk Integration

| Component | Implementation |
|---|---|
| Middleware (`src/middleware.ts`) | `clerkMiddleware()` protecting `/dashboard/*`, `/admin/*`, `/onboarding/*`, `/investor/*`. Sets `x-url` header for server components. |
| Clerk Webhook (`src/app/api/webhooks/clerk/route.ts`) | Syncs user creation/deletion from Clerk to Prisma. Uses Svix for signature verification with raw body (`req.text()`). |
| Sign-in page (`src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`) | Clerk `<SignIn>` component |
| Sign-up page (`src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`) | Clerk `<SignUp>` component |
| Auth layout (`src/app/(auth)/layout.tsx`) | Centered auth layout |

### Seed Data (`prisma/seed.ts`)
- **11 badges** with slugs: first-vote, validated-10, validated-50, validated-100, critic, early-believer, streak-7, streak-30, idea-maker, validated-founder, og
- **2 sample users:** Arjun Mehta (Founder, Bengaluru) and Priya Sharma (Both, Mumbai)
- **10 sample ideas** across categories: Chai Subscription Box, RentMate, KisanConnect, StudyBuddy AI, SplitKhata, Dhobi On Demand, HealthSathi, ContentDal, FitKar, GreenShift -- with varied vote counts and calculated scores

---

## 5. Phase 2 -- Layouts, Onboarding & Navigation

### Layout Components

| Component | File | Description |
|---|---|---|
| Navbar | `src/components/layout/navbar.tsx` | Top navigation with logo, links, auth state, notification bell. Hidden items on mobile. |
| Footer | `src/components/layout/footer.tsx` | Site footer with links. Hidden on mobile (`md:hidden` bottom-nav replaces it). |
| Bottom Nav | `src/components/layout/bottom-nav.tsx` | Mobile-only (`md:hidden`) bottom navigation bar with 5 items: Home, Explore, Post (prominent CTA), Leaderboard, Profile. |
| Notification Bell | `src/components/layout/notification-bell.tsx` | Bell icon in navbar. Polls `/api/notifications/unread-count` every 30s. Shows dropdown with recent notifications. |

### Route Layouts

| Layout | Route Group | Features |
|---|---|---|
| Root layout | `/` | ClerkProvider, fonts (Plus Jakarta Sans, Instrument Serif, DM Mono), Sonner toaster, metadata |
| Auth layout | `(auth)` | Centered card layout for sign-in/sign-up/onboarding |
| Public layout | `(public)` | Navbar + Footer + BottomNav |
| Dashboard layout | `(dashboard)/dashboard` | Navbar + BottomNav + Dashboard sidebar navigation |
| Admin layout | `admin` | Navbar + Admin sidebar navigation |
| Investor layout | `investor` | Navbar + Investor sidebar navigation (hidden on apply page). BottomNav for mobile. |

### Onboarding

- **Page:** `src/app/(auth)/onboarding/page.tsx`
- **Flow:** After first Clerk login, user redirected to `/onboarding`
- **Collects:** username (live availability check via `/api/users/check-username`), display name, role (Founder/Explorer/Both), bio
- **Action:** `completeOnboarding()` in `src/actions/user-actions.ts`
- **Validation:** `onboardingSchema` from `src/lib/validations.ts`
- Username check API: `src/app/api/users/check-username/route.ts`

---

## 6. Phase 3 -- Idea CRUD, Feed & Explore

### Server Actions (`src/actions/idea-actions.ts`)

| Function | Description |
|---|---|
| `createIdea` | Auth + rate limit + validate with Zod + AI quality check (fail open) + slug generation (title + nanoid) + create in DB + award gamification points |
| `updateIdea` | Auth + founder-only + validate + update |
| `updateIdeaStatus` | Auth + founder-only + archive/activate (not delete) |
| `getIdeaBySlug` | Public fetch by slug. Increments view count. Includes founder, votes, comments. |
| `getIdeaById` | Dashboard fetch by ID for editing |
| `getIdeasFeed` | Paginated cursor-based feed with filters (category, stage, sort: trending/newest/top/hot) |
| `recalculateScore` | Called after every vote. Pure function from `scoring.ts`. Updates idea's validationScore + scoreTier. Non-blocking (`.catch(console.error)`). |
| `incrementShareCount` | Auth + rate limited. Increments `totalShares` on idea. |
| `getIdeasByUser` | Returns user's ideas. Filters by ownership (non-owners only see ACTIVE ideas). |

### Feed Components

| Component | File | Description |
|---|---|---|
| Idea Card | `src/components/ideas/idea-card.tsx` | Card displaying idea title, pitch, category badge, stage, vote counts, score ring. Brand styling: 12px border-radius, 1px warm-border. |
| Idea Feed | `src/components/ideas/idea-feed.tsx` | Infinite scroll feed using cursor-based pagination. Intersection Observer for auto-loading. |
| Idea Filters | `src/components/ideas/idea-filters.tsx` | Category, stage, sort dropdowns. Responsive layout. |
| Idea Skeleton | `src/components/ideas/idea-skeleton.tsx` | Loading skeleton matching idea card layout |
| Score Ring | `src/components/ideas/score-ring.tsx` | SVG ring displaying validation score (0-100). Color matches score tier. Animated draw-in. |

### Pages

| Page | Route | Description |
|---|---|---|
| Homepage | `src/app/(public)/page.tsx` | Hero section + trending ideas feed + CTA |
| Explore | `src/app/(public)/explore/page.tsx` | Full filterable idea feed with category/stage/sort filters |

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/ideas/trending` | GET | Trending ideas (sorted by votes, filtered by period: week/month/all) |
| `/api/ideas/search` | GET | Full-text search across title, pitch, problem, tags. Supports category/stage/sort filters. |

### AI Integration

| Route | Description |
|---|---|
| `/api/ai/quality-check` | Calls Gemini to evaluate idea quality. Returns qualityScore (0-100), flags for spam/inappropriate. Blocks if spam. Suggests improvements if score < 30. Fails open. |
| `/api/ai/duplicate-check` | Calls Gemini to check for similar existing ideas. Returns similarity score and list of potential duplicates. Fails open. |

---

## 7. Phase 4 -- Voting System & Idea Detail

### Server Actions (`src/actions/vote-actions.ts`)

| Function | Description |
|---|---|
| `castVote` | Auth + rate limit (50/hr) + cannot vote on own idea + one vote per user per idea + can change vote type + vote weight < 1.0 for new accounts + atomic count updates in `$transaction` + non-blocking `recalculateScore` + gamification (points, streak, badges, early believer check) + notifications |
| `getUserVotes` | Get all votes by a user (for dashboard) |

### Voting Components

| Component | File | Description |
|---|---|---|
| Vote Buttons | `src/components/voting/vote-buttons.tsx` | Three voting buttons: "Use This" (fire emoji), "Maybe" (thinking emoji), "Not For Me" (thumbs down). Shows current vote state. Animated transitions. |
| Vote Breakdown | `src/components/voting/vote-breakdown.tsx` | Horizontal bar chart showing vote type percentages with counts |

### Idea Detail Page

- **Page:** `src/app/(public)/idea/[slug]/page.tsx`
- **Client component:** `src/components/ideas/idea-detail-client.tsx`
- **Layout:** `grid-cols-1 lg:grid-cols-[1fr_380px]` -- sidebar sticky on desktop, stacks below on mobile
- **Sidebar:** Vote buttons, vote breakdown, score ring display, share button, donation section (if enabled)
- **Main:** Title, pitch, problem, solution, target audience, category/stage badges, tags, founder info, comments section
- **API routes used:** `/api/ideas/[id]/vote` (GET -- vote state + breakdown), `/api/ideas/[id]/comments` (GET -- paginated comments)

### Vote API Route

| Route | Method | Description |
|---|---|---|
| `/api/ideas/[id]/vote` | GET | Returns current user's vote, vote breakdown counts, and recent votes (paginated) |

---

## 8. Phase 5 -- Comments, Profiles & Dashboard

### Server Actions (`src/actions/comment-actions.ts`)

| Function | Description |
|---|---|
| `createComment` | Auth + rate limit (10/hr) + validate + create comment or reply. Reply depth max = 1 (replies to replies attach to grandparent). Updates `totalComments` on idea. Awards points + gamification. Fire-and-forget notification. |
| `getComments` | Paginated cursor-based comments with nested replies. Respects `isHidden` flag. |
| `togglePinComment` | Auth + founder-only. Pin/unpin a comment on their idea. |
| `toggleHideComment` | Auth + founder-only. Hide/unhide a comment on their idea. |
| `upvoteComment` | Auth + one upvote per user per comment. Awards points to comment author + updates level/badges. |

### Comment Components

| Component | File | Description |
|---|---|---|
| Comment Form | `src/components/comments/comment-form.tsx` | Textarea with submit button. Supports reply mode. Character limit. |
| Comment Item | `src/components/comments/comment-item.tsx` | Single comment: avatar, name, time, content, upvote button, reply button. Pin/hide controls for founder. |
| Comment List | `src/components/comments/comment-list.tsx` | Threaded comment list with replies nested underneath. Paginated with "Load more" button. |

### Comments API Route

| Route | Method | Description |
|---|---|---|
| `/api/ideas/[id]/comments` | GET | Paginated comments for an idea. Top-level only (replies nested via include). Sorted by pinned first, then newest. |

### User Profiles

- **Page:** `src/app/(public)/profile/[username]/page.tsx`
- **Action:** `getUserProfile()` in `src/actions/user-actions.ts`
- **Displays:** Avatar, name, username, bio, role badge, join date, stats (ideas, votes, comments, points), level badge, streak indicator, badge collection, list of user's public ideas

### Dashboard

#### Dashboard Pages

| Page | Route | Description |
|---|---|---|
| Dashboard Home | `/dashboard` | Stats cards (total ideas, total votes received, average score, total views), recent ideas list |
| My Ideas | `/dashboard/ideas` | List of all user's ideas with status badges, edit/archive actions |
| New Idea | `/dashboard/ideas/new` | Multi-step idea creation form |
| Idea Detail | `/dashboard/ideas/[id]` | Detailed view of own idea with full stats, daily analytics |
| Edit Idea | `/dashboard/ideas/[id]/edit` | Edit form for existing idea |
| My Votes | `/dashboard/votes` | History of all votes cast by user |
| Notifications | `/dashboard/notifications` | Full notification list with read/unread state |
| Settings | `/dashboard/settings` | Profile settings form (name, bio, role, avatar) |

#### Dashboard Components

| Component | File | Description |
|---|---|---|
| Sidebar Nav | `src/components/dashboard/sidebar-nav.tsx` | Dashboard navigation sidebar |
| Settings Form | `src/components/dashboard/settings-form.tsx` | Profile update form with avatar upload (Uploadthing) |
| Edit Idea Form | `src/components/dashboard/edit-idea-form.tsx` | Idea editing form |
| Idea Status Actions | `src/components/dashboard/idea-status-actions.tsx` | Archive/activate/delete actions for ideas |

#### Dashboard Server Actions

| Function | File | Description |
|---|---|---|
| `updateProfile` | `user-actions.ts` | Update name, bio, role, avatar. Zod validated. |
| `getDashboardStats` | `user-actions.ts` | Auth-protected. Returns idea count, total votes, avg score, total views. Verifies caller is owner or admin. |
| `getDashboardIdeas` | `user-actions.ts` | Auth-protected. Returns user's ideas with full stats. Verifies caller is owner or admin. |

---

## 9. Phase 6 -- Gamification & Leaderboards

### Gamification System

#### Points
| Action | Points |
|---|---|
| Cast a vote | 5 |
| Post a comment | 10 |
| Comment upvoted | 2 |
| Daily voting streak | 15 |
| Post an idea | 20 |
| Early Believer (vote on idea with < 10 votes) | 50 |
| Referral | 25 |

#### Levels
| Level | Points Range |
|---|---|
| Newbie | 0-100 |
| Explorer | 101-500 |
| Validator | 501-1,500 |
| Tastemaker | 1,501-5,000 |
| Oracle | 5,000+ |

#### Badges (11 total)
| Badge | Slug | Trigger |
|---|---|---|
| First Vote | `first-vote` | Cast first vote |
| Validated 10 | `validated-10` | Cast 10 votes |
| Validated 50 | `validated-50` | Cast 50 votes |
| Validated 100 | `validated-100` | Cast 100 votes |
| Critic | `critic` | Post 10+ comments |
| Early Believer | `early-believer` | Vote on idea before it reaches 10 votes |
| Week Warrior | `streak-7` | 7-day voting streak |
| Streak Master | `streak-30` | 30-day voting streak |
| Idea Maker | `idea-maker` | Post first idea |
| Validated Founder | `validated-founder` | Idea reaches 50+ votes |
| OG | `og` | First 100 platform users |

#### Streak System
- Streak = voting on 3+ ideas in a calendar day
- Streak counter increments daily, resets after 1 day of inactivity
- Awards `daily-streak` points (15) when streak condition met

### Gamification Components

| Component | File | Description |
|---|---|---|
| Badge Display | `src/components/gamification/badge-display.tsx` | Grid of earned/unearned badges with icons |
| Level Progress | `src/components/gamification/level-progress.tsx` | Progress bar showing current level + points to next level |
| Streak Indicator | `src/components/gamification/streak-indicator.tsx` | Current streak count with fire animation |

### Leaderboard

- **Page:** `src/app/(public)/leaderboard/page.tsx`
- **Tabs:** Top Validators (by points), Top Ideas (by score), Rising Stars (newest high-performers)
- **Displays:** Rank, avatar, name, level badge, points/score, recent activity

---

## 10. Phase 7 -- Virality, Search & Polish

### OG Images & Validation Cards

| Feature | File | Description |
|---|---|---|
| OG Image | `src/app/(public)/idea/[slug]/opengraph-image.tsx` | Dynamic OG image via `@vercel/og` (Satori). Shows: title, pitch, score (large), vote breakdown, founder name, branding. Background gradient matches score tier. |
| Validation Card | `src/app/api/validation-card/[id]/route.tsx` | Downloadable PNG. Same content as OG image. `Cache-Control: public, max-age=3600`. |

### Share Modal

- **Component:** `src/components/shared/share-modal.tsx`
- **Features:** Copy link, share to Twitter/LinkedIn/WhatsApp, download validation card PNG
- **Server action:** `incrementShareCount()` tracks shares (auth + rate limited)

### Search

- **Page:** `src/app/(public)/search/page.tsx`
- **API:** `/api/ideas/search` -- full-text search across title, pitch, problem, tags
- **Features:** Category/stage/sort filters, paginated results, debounced search input

### Notification System

| Component | Description |
|---|---|
| Bell polling | `/api/notifications/unread-count` polled every 30s from navbar |
| Notification types | NEW_VOTE, NEW_COMMENT, COMMENT_REPLY, SCORE_MILESTONE, VOTES_MILESTONE, IDEA_TRENDING, BADGE_EARNED, SYSTEM |
| Fire-and-forget | All notification creation is non-blocking (`.catch(console.error)`) |
| Notification actions | `getNotifications()`, `getUnreadNotificationCount()`, `markNotificationRead()`, `markAllNotificationsRead()` |
| Notification page | `/dashboard/notifications` -- full list with read/unread toggle |

### Static Pages

| Page | Route | Description |
|---|---|---|
| About | `/about` | About BackMyIdea, mission, how it works |
| Privacy Policy | `/privacy` | Privacy policy |
| Terms of Service | `/terms` | Terms of service |

### Other Polish

- **Empty State component:** `src/components/shared/empty-state.tsx` -- used across all list pages
- **Error boundaries:** `error.tsx` in auth, public, dashboard, admin route groups
- **Loading states:** `loading.tsx` with skeletons in auth, public, dashboard, admin route groups
- **File uploads:** Uploadthing integration for profile avatars (`/api/uploadthing`)

---

## 11. Phase 8 -- Admin Panel & Moderation

### Admin Pages

| Page | Route | Description |
|---|---|---|
| Admin Dashboard | `/admin` | Analytics overview: total users, ideas, votes, comments. New today counts. Active users this week. |
| Manage Reports | `/admin/reports` | List of reports with status filter (Pending/Reviewed/Action Taken/Dismissed). Actions: dismiss, remove content, ban user, remove + ban. |
| Manage Ideas | `/admin/ideas` | All ideas with search/status filter. Actions: change status (Active/Draft/Archived/Removed). |
| Manage Users | `/admin/users` | All users with search/filter (all/banned/admin/onboarded). Actions: ban/unban. |
| Manage Investors | `/admin/investors` | Investor access requests with status filter. Approve/reject actions. |

### Admin API Routes

| Route | Methods | Description |
|---|---|---|
| `/api/admin/analytics` | GET | Platform-wide analytics counts |
| `/api/admin/reports` | GET, PATCH | List reports, resolve reports with actions |
| `/api/admin/ideas` | GET, PATCH | List ideas, change idea status |
| `/api/admin/users` | GET, PATCH | List users, ban/unban users |
| `/api/admin/investors` | GET | List investor access requests |

### Admin Server Actions (`src/actions/admin-actions.ts`)

| Function | Description |
|---|---|
| `toggleUserBan` | Ban/unban user. Atomic `$transaction`: ban + archive all active ideas. |
| `adminUpdateIdeaStatus` | Admin override idea status |
| `resolveReportWithAction` | Resolve report with moderation action (dismiss, remove content, ban user, remove + ban) |
| `getReportedEntity` | Fetch the entity being reported for preview |

### Admin Components

| Component | File | Description |
|---|---|---|
| Admin Sidebar Nav | `src/components/admin/sidebar-nav.tsx` | Navigation for admin section |

### Authorization
- All admin routes require `requireAdmin()` -- checks Clerk auth + `isAdmin: true` on Prisma User
- `isAdmin` field set manually in Supabase SQL editor (no in-app UI)
- Admin routes return 403 for unauthorized access (not 401)

---

## 12. Phase 9 -- Micro-Donations (Razorpay)

### How It Works
1. Founder enables donations on their idea via `toggleDonations()`
2. Validator clicks "Support this idea" button
3. Selects amount tier or enters custom amount
4. Razorpay checkout opens (client-side SDK)
5. On success, payment verified server-side with HMAC signature
6. Donation recorded, idea counts updated atomically, emails sent

### Donation Tiers
| Amount | Label |
|---|---|
| 10 | A chai |
| 50 | A meal |
| 100 | A boost |
| 500 | A big push |
| Custom | User-defined |

### Payment API Routes

| Route | Method | Description |
|---|---|---|
| `/api/payments/create-order` | POST | Validates amount, creates Donation (PENDING), creates Razorpay order. Amount always re-fetched from server. |
| `/api/payments/verify` | POST | HMAC signature verification (timing-safe). Completes donation. Atomic update of donorCount + totalDonations. Fire-and-forget emails to donor + founder. |

### Payment Server Actions (`src/actions/payment-actions.ts`)

| Function | Description |
|---|---|
| `toggleDonations` | Auth + founder-only. Enable/disable `donationsEnabled` flag on idea. |
| `getDonationStats` | Get total donations, donor count, recent donors for an idea. |
| `getPublicDonors` | Paginated list of non-anonymous donors. |

### Payment Components

| Component | File | Description |
|---|---|---|
| Donate Button | `src/components/payments/donate-button.tsx` | CTA button that opens donation modal |
| Donation Modal | `src/components/payments/donation-modal.tsx` | Amount selection (tiers + custom), Razorpay checkout integration, loading states |
| Donation Section | `src/components/payments/donation-section.tsx` | Section on idea detail page showing donation stats + donate button |
| Donations Toggle | `src/components/payments/donations-toggle.tsx` | Toggle switch for founders to enable/disable donations |

### Payment Lib Files

| File | Description |
|---|---|
| `src/lib/razorpay.ts` | `createRazorpayOrder()`, `verifyRazorpaySignature()` (HMAC-SHA256 with `crypto.timingSafeEqual`), `isValidDonationAmount()`, `formatPaiseToRupees()` |
| `src/lib/resend.ts` | `sendDonorConfirmation()`, `sendFounderDonationAlert()` -- fire-and-forget, never re-throw |

### Security
- HMAC signature verification is mandatory -- never skipped
- Amount always comes from server validation, never trust client
- Platform fee: 10% (deducted on payout, not at payment time)
- Atomic transaction: `donorCount` + `totalDonations` updated together
- Rate limited: `donateLimiter` (10/hr)

---

## 13. Phase 10 -- VC/Investor Dashboard

### New Prisma Models
- **InvestorProfile**: firmName, investmentThesis, sectorInterests[], stagePreference, ticketSize range
- **InvestorRequest**: status (PENDING/APPROVED/REJECTED), application details
- **WatchlistItem**: status (WATCHING/INTERESTED/IN_DISCUSSION/FUNDED/PASSED), notes
- **InvestorInterest**: status (PENDING/ACCEPTED/DECLINED), message

### VC Access Flow
1. User visits `/investor/apply` and submits application
2. Admin reviews at `/admin/investors` and approves/rejects
3. Approved users get `InvestorProfile` created automatically
4. Approved investors can access full investor dashboard

### Investor Pages

| Page | Route | Description |
|---|---|---|
| Apply | `/investor/apply` | Application form: firm name, LinkedIn (required), investment thesis (required), sector interests (required), stage preference, ticket size range, portfolio companies, website |
| Deal Flow Dashboard | `/investor` | Curated feed with advanced filters: score range, min votes, category, stage, sorting (score/trending/newest/votes/comments). Stats cards: total ideas, avg score, watchlist count, interests sent. |
| Watchlist | `/investor/watchlist` | Saved ideas with status management (Watching/Interested/In Discussion/Funded/Passed), private notes, score change tracking |
| Compare | `/investor/compare` | Side-by-side comparison of 2-4 ideas from watchlist. Compares: scores, vote counts, category, stage, target audience, vote breakdown. |

### Investor Server Actions (`src/actions/investor-actions.ts`)

| Function | Description |
|---|---|
| `submitInvestorRequest` | Auth + validate with Zod. Creates InvestorRequest (PENDING). |
| `reviewInvestorRequest` | Admin-only. Approve/reject. Atomic `$transaction`: update request + create InvestorProfile (on approve). Fire-and-forget notification. |
| `getMyInvestorStatus` | Returns hasProfile, hasPendingRequest, lastRequestStatus. |
| `getInvestorDealFlow` | Auth + investor profile required. Advanced filters with `Prisma.IdeaWhereInput`. Enforces minimum 10 votes. Paginated. |
| `addToWatchlist` | Auth + Zod validated. Add idea to watchlist with status + optional notes. |
| `removeFromWatchlist` | Auth. Remove idea from watchlist. |
| `getMyWatchlist` | Auth. Returns all watchlist items with full idea data. |
| `expressInterest` | Auth + Zod validated. Send interest request to founder. Fire-and-forget notification. |
| `respondToInterest` | Auth + founder-only. Accept/decline investor interest. Fire-and-forget notification. |
| `getInvestorDashboardStats` | Auth. Returns total ideas, avg score, watchlist count, interests count. |

### Investor Components

| Component | File | Description |
|---|---|---|
| Investor Sidebar Nav | `src/components/investor/sidebar-nav.tsx` | Dashboard navigation (Deal Flow, Watchlist, Compare) |
| Express Interest Button | `src/components/investor/express-interest-button.tsx` | Button on idea detail sidebar for investors to express interest |
| Interest List | `src/components/investor/interest-list.tsx` | List of investor interest requests (shown in founder's dashboard) |

### Integration Points
- `ExpressInterestButton` integrated into idea detail page sidebar
- `InvestorInterestList` integrated into founder's dashboard
- Admin investors page integrated into admin sidebar

---

## 14. Phase 11 -- Security Audit & Bug Fixes

A comprehensive audit identified ~44 issues across the codebase. All were fixed:

### Security Fixes

| Fix | Files Modified | Description |
|---|---|---|
| Gamification functions secured | `src/lib/gamification.ts` (created), `src/actions/gamification-actions.ts` | Moved gamification logic to internal lib file WITHOUT `"use server"` directive. Server actions now re-export. Prevents direct client invocation of `awardPoints()`, etc. |
| Notification function secured | `src/lib/notifications.ts` (created), `src/actions/notification-actions.ts` | Created `createNotificationInternal()` without `"use server"`. Removed direct `createNotification` export from actions. Prevents client-side notification spoofing. |
| `incrementShareCount` secured | `src/actions/idea-actions.ts`, `src/lib/redis.ts`, `src/lib/constants.ts` | Added auth check + `shareLimiter` (30/hr) rate limiting. Created `share` rate limit config. |
| `getIdeasByUser` visibility fix | `src/actions/idea-actions.ts` | Non-owners can now only see ACTIVE ideas (not DRAFT/ARCHIVED). |
| Dashboard auth hardened | `src/actions/user-actions.ts` | `getDashboardStats` and `getDashboardIdeas` now verify caller is the user themselves or an admin. |
| `toggleUserBan` made atomic | `src/actions/admin-actions.ts` | Wrapped user ban + idea archival in `prisma.$transaction()`. |
| `reviewInvestorRequest` made atomic | `src/actions/investor-actions.ts` | Wrapped request update + profile creation in `prisma.$transaction()`. |
| Investor actions Zod validation | `src/actions/investor-actions.ts` | Added Zod validation to `addToWatchlist`, `expressInterest`, `reviewInvestorRequest`. |
| Investor notification replacement | `src/actions/investor-actions.ts` | All 4 inline `prisma.notification.create()` calls replaced with `createNotificationInternal()` (fire-and-forget). |

### Bug Fixes

| Fix | Files Modified | Description |
|---|---|---|
| Investor deal flow filter bugs | `src/app/investor/page.tsx`, `src/actions/investor-actions.ts` | Fixed `"all"` -> `undefined` conversion for category/stage. Fixed `"none"` -> `undefined` for minScore. `totalVotes` constraint uses `Math.max()` to merge requirements. `Record<string, unknown>` replaced with `Prisma.IdeaWhereInput`. |
| Double-fetch on investor dashboard | `src/app/investor/page.tsx` | Merged two `useEffect` hooks: one for stats (runs once), one for deal flow (runs on filter changes). |
| Missing gamification calls | `src/actions/vote-actions.ts`, `src/actions/comment-actions.ts` | Added `checkEarlyBeliever()` in `castVote`. Added `updateUserLevel()` + `checkAndAwardBadges()` after `upvoteComment` points award. |
| Dead code cleanup | `src/app/investor/layout.tsx`, `src/app/investor/compare/page.tsx` | Removed dead `isApplyPage` logic in layout (replaced with `headers()` approach). Removed unused `TARGET_AUDIENCE_LABELS` import. |

### API Route Hardening (11 routes)

All API routes wrapped with proper try/catch error handling:

| Route | Changes |
|---|---|
| `api/ideas/search` | Fixed broken `try {` with missing catch. Full try/catch added. |
| `api/ideas/trending` | Full try/catch wrapping added |
| `api/ideas/[id]/comments` | Full try/catch wrapping added |
| `api/ideas/[id]/vote` | Full try/catch wrapping added |
| `api/users/check-username` | Full try/catch wrapping added |
| `api/notifications` | Full try/catch wrapping added |
| `api/admin/analytics` | Merged `requireAdmin()` into single try/catch covering all DB queries |
| `api/admin/investors` | Merged try/catch + fixed 401 -> 403 for auth failures |
| `api/admin/reports` | Expanded try/catch to cover both GET and PATCH handlers. Made ban+archive atomic with `$transaction` in helper functions. |
| `api/admin/ideas` | Expanded try/catch for GET and PATCH. Replaced `Record<string, unknown>` with `Prisma.IdeaWhereInput`. |
| `api/admin/users` | Expanded try/catch. Made PATCH ban+archive atomic with `$transaction`. Replaced `Record<string, unknown>` with `Prisma.UserWhereInput`. |

### Error Handling Pattern (Admin Routes)
```typescript
function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof (error as Record<string, unknown>).digest === "string" &&
    ((error as Record<string, unknown>).digest as string).includes("NEXT_REDIRECT")
  );
}

// In each handler:
try {
  await requireAdmin();
  // ... handler logic ...
} catch (error) {
  if (isRedirectError(error)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  console.error("[ROUTE_NAME] Error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

---

## 15. Phase 12 -- Mobile Responsiveness Fixes

### VC Apply Form (`src/app/investor/apply/page.tsx`)

| Issue | Fix |
|---|---|
| Form too narrow on mobile | Changed container to `w-full max-w-2xl` |
| Header text too large on mobile | Responsive sizing: `text-[26px] sm:text-[32px]` |
| Description text too small | Responsive: `text-[13px] sm:text-[14px]` |
| Ticket size fields cramped | Changed from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` |
| Submit button too small on mobile | Added `w-full sm:w-auto` |
| Status screens not responsive | Added responsive text sizes + full-width buttons on mobile |

### Middleware URL Header Fix (`src/middleware.ts`)

The investor layout relied on `x-url` header to detect the apply page and hide the dashboard sidebar, but the middleware never set this header.

**Fix:** Added `response.headers.set("x-url", req.nextUrl.pathname)` to middleware so `headers()` in server components can read the current path.

---

## 16. Complete File Inventory

### Pages (27 routes)

| Route | File |
|---|---|
| `/` | `src/app/(public)/page.tsx` |
| `/explore` | `src/app/(public)/explore/page.tsx` |
| `/search` | `src/app/(public)/search/page.tsx` |
| `/leaderboard` | `src/app/(public)/leaderboard/page.tsx` |
| `/idea/:slug` | `src/app/(public)/idea/[slug]/page.tsx` |
| `/profile/:username` | `src/app/(public)/profile/[username]/page.tsx` |
| `/about` | `src/app/(public)/about/page.tsx` |
| `/privacy` | `src/app/(public)/privacy/page.tsx` |
| `/terms` | `src/app/(public)/terms/page.tsx` |
| `/sign-in` | `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` |
| `/sign-up` | `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` |
| `/onboarding` | `src/app/(auth)/onboarding/page.tsx` |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` |
| `/dashboard/ideas` | `src/app/(dashboard)/dashboard/ideas/page.tsx` |
| `/dashboard/ideas/new` | `src/app/(dashboard)/dashboard/ideas/new/page.tsx` |
| `/dashboard/ideas/:id` | `src/app/(dashboard)/dashboard/ideas/[id]/page.tsx` |
| `/dashboard/ideas/:id/edit` | `src/app/(dashboard)/dashboard/ideas/[id]/edit/page.tsx` |
| `/dashboard/votes` | `src/app/(dashboard)/dashboard/votes/page.tsx` |
| `/dashboard/notifications` | `src/app/(dashboard)/dashboard/notifications/page.tsx` |
| `/dashboard/settings` | `src/app/(dashboard)/dashboard/settings/page.tsx` |
| `/admin` | `src/app/admin/page.tsx` |
| `/admin/reports` | `src/app/admin/reports/page.tsx` |
| `/admin/ideas` | `src/app/admin/ideas/page.tsx` |
| `/admin/users` | `src/app/admin/users/page.tsx` |
| `/admin/investors` | `src/app/admin/investors/page.tsx` |
| `/investor` | `src/app/investor/page.tsx` |
| `/investor/apply` | `src/app/investor/apply/page.tsx` |
| `/investor/compare` | `src/app/investor/compare/page.tsx` |
| `/investor/watchlist` | `src/app/investor/watchlist/page.tsx` |

### API Routes (19 endpoints)

| Endpoint | Methods |
|---|---|
| `/api/webhooks/clerk` | POST |
| `/api/users/check-username` | GET |
| `/api/ideas/search` | GET |
| `/api/ideas/trending` | GET |
| `/api/ideas/[id]/vote` | GET |
| `/api/ideas/[id]/comments` | GET |
| `/api/notifications` | GET |
| `/api/notifications/unread-count` | GET |
| `/api/validation-card/[id]` | GET |
| `/api/ai/quality-check` | POST |
| `/api/ai/duplicate-check` | POST |
| `/api/uploadthing` | POST |
| `/api/payments/create-order` | POST |
| `/api/payments/verify` | POST |
| `/api/admin/analytics` | GET |
| `/api/admin/reports` | GET, PATCH |
| `/api/admin/ideas` | GET, PATCH |
| `/api/admin/users` | GET, PATCH |
| `/api/admin/investors` | GET |

### Server Actions (47 functions across 9 files)

| File | Functions |
|---|---|
| `idea-actions.ts` | createIdea, updateIdea, updateIdeaStatus, getIdeaBySlug, getIdeaById, getIdeasFeed, recalculateScore, incrementShareCount, getIdeasByUser |
| `vote-actions.ts` | castVote, getUserVotes |
| `comment-actions.ts` | createComment, getComments, togglePinComment, toggleHideComment, upvoteComment |
| `user-actions.ts` | completeOnboarding, updateProfile, getUserProfile, getDashboardStats, getDashboardIdeas |
| `notification-actions.ts` | getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead |
| `gamification-actions.ts` | awardPoints, updateUserLevel, updateStreak, checkAndAwardBadges, checkEarlyBeliever |
| `admin-actions.ts` | toggleUserBan, adminUpdateIdeaStatus, resolveReportWithAction, getReportedEntity |
| `investor-actions.ts` | submitInvestorRequest, reviewInvestorRequest, getMyInvestorStatus, getInvestorDealFlow, addToWatchlist, removeFromWatchlist, getMyWatchlist, expressInterest, respondToInterest, getInvestorDashboardStats |
| `payment-actions.ts` | toggleDonations, getDonationStats, getPublicDonors |

### Components (33 custom + 25 shadcn/ui)

| Category | Components |
|---|---|
| Layout (4) | navbar, footer, bottom-nav, notification-bell |
| Ideas (6) | idea-card, idea-feed, idea-filters, idea-skeleton, idea-detail-client, score-ring |
| Voting (2) | vote-buttons, vote-breakdown |
| Comments (3) | comment-form, comment-item, comment-list |
| Dashboard (4) | sidebar-nav, settings-form, edit-idea-form, idea-status-actions |
| Gamification (3) | badge-display, level-progress, streak-indicator |
| Shared (2) | share-modal, empty-state |
| Payments (4) | donate-button, donation-modal, donation-section, donations-toggle |
| Investor (3) | sidebar-nav, express-interest-button, interest-list |
| Admin (1) | sidebar-nav |
| Providers (1) | providers |
| shadcn/ui (25) | alert-dialog, avatar, badge, button, card, checkbox, dialog, dropdown-menu, form, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, tooltip |

### Lib Files (12)

prisma.ts, clerk.ts, utils.ts, validations.ts, constants.ts, redis.ts, gemini.ts, scoring.ts, razorpay.ts, resend.ts, notifications.ts, gamification.ts

---

## 17. Database Schema Summary

### Models (14)

```
User ──┬── Ideas (1:N)
       ├── Votes (1:N)
       ├── Comments (1:N)
       ├── CommentUpvotes (1:N)
       ├── UserBadges (1:N)
       ├── Notifications (1:N)
       ├── Reports (1:N)
       ├── Donations (1:N)
       ├── InvestorRequests (1:N)
       └── InvestorProfile (1:1, optional)

Idea ──┬── Votes (1:N)
       ├── Comments (1:N)
       ├── Reports (1:N)
       ├── IdeaDailyStats (1:N)
       ├── Donations (1:N)
       ├── WatchlistItems (1:N)
       └── InvestorInterests (1:N)

Comment ── Replies (self-referential, 1 level max)
        └── CommentUpvotes (1:N)

Badge ── UserBadges (1:N)

InvestorProfile ──┬── WatchlistItems (1:N)
                  └── InvestorInterests (1:N)
```

### Enums (17)
UserRole, UserLevel, Category (16 sectors), IdeaStage, IdeaStatus, TargetAudience, ScoreTier, VoteType, BadgeCategory, NotificationType, ReportReason, ReportStatus, DonationStatus, InvestorRequestStatus, InvestorStagePreference, WatchlistStatus, InterestStatus

---

## 18. API Route Map

```
/api
├── webhooks/
│   └── clerk            POST    Clerk user sync (Svix signature verification)
├── users/
│   └── check-username   GET     Username availability check
├── ideas/
│   ├── search           GET     Full-text search with filters
│   ├── trending         GET     Trending ideas feed
│   └── [id]/
│       ├── vote         GET     Vote state + breakdown
│       └── comments     GET     Paginated comments
├── notifications/
│   ├── (index)          GET     Paginated notifications
│   └── unread-count     GET     Unread count (polled every 30s)
├── validation-card/
│   └── [id]             GET     Downloadable PNG validation card
├── ai/
│   ├── quality-check    POST    Gemini AI idea quality assessment
│   └── duplicate-check  POST    Gemini AI duplicate detection
├── uploadthing          POST    File upload handler
├── payments/
│   ├── create-order     POST    Create Razorpay order
│   └── verify           POST    Verify payment + complete donation
└── admin/
    ├── analytics        GET     Platform analytics
    ├── reports          GET/PATCH  Manage reports
    ├── ideas            GET/PATCH  Manage ideas
    ├── users            GET/PATCH  Manage users
    └── investors        GET     Manage investor requests
```

---

## 19. Current Status & What's Next

### Completed
- All 12 phases fully implemented
- Security audit complete (44 issues fixed)
- All API routes hardened with try/catch
- All admin routes use proper 403 status codes
- All atomic operations use `$transaction`
- Mobile responsiveness fixes applied
- TypeScript strict mode: **zero errors** (`npx tsc --noEmit` clean)

### Rate Limiters Active
| Limiter | Limit | Prefix |
|---|---|---|
| `voteLimiter` | 50/hour | `rl:vote` |
| `commentLimiter` | 10/hour | `rl:comment` |
| `ideaLimiter` | 5/hour | `rl:idea` |
| `aiLimiter` | 14/minute | `rl:ai` |
| `donateLimiter` | 10/hour | `rl:donate` |
| `shareLimiter` | 30/hour | `rl:share` |

### Potential Future Work
- Email notifications via Resend (templates built, needs real sending configuration)
- `use-debounce.ts` hook (referenced in AGENTS.md but not yet created)
- Push notifications / WebSocket for real-time updates
- Advanced analytics dashboards (Recharts charts)
- A/B testing for idea presentation formats
- Investor-to-founder messaging system
- Mobile PWA support
- Internationalization (Hindi, regional languages)
