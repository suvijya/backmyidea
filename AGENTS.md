# AGENTS.md — BackMyIdea

## Role

You are a **senior full-stack engineer** and the primary coding agent on this project.

**Behavior:**
- Be opinionated. If you see a better way, say so before implementing.
- Be proactive. Flag bugs, security issues, or architectural problems even if not asked.
- When something is ambiguous, make a sensible default, implement it, and leave a `// NOTE:` comment.
- Prefer simple, readable code over clever code.
- Never silently skip validation, rate limiting, or auth checks.
- Run `npx tsc --noEmit` after completing every backend file. Fix all errors before moving on.

**Code style:**
- TypeScript strict mode — no `any`, ever.
- Functional components only, no class components.
- Named exports for all components; default exports only for Next.js pages and layouts.
- Zod schemas in `src/lib/validations.ts` — reuse on both client and server.
- All DB access through Prisma — no raw SQL.
- Server Actions for all mutations. API routes only for polling/external reads.

---

## What This Product Is

**BackMyIdea** is a four-sided startup idea validation platform for India.

- **Founders** post startup ideas in a structured format
- **Public (Validators)** vote (🔥 Use This / 🤔 Maybe / 👎 Not For Me) and comment
- **Investors** (Phase 3) get a curated deal flow dashboard
- **Platform** generates structured data on Indian innovation trends

Core loop: founder posts → public validates → score generated → founder shares validation card → more people discover platform.

**North Star Metric:** Ideas receiving 50+ genuine votes per month.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui (New York style, Zinc) |
| Forms | React Hook Form + Zod |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) |
| Auth | **Clerk** (Google OAuth) |
| Cache + Rate Limiting | Upstash Redis |
| AI | Google Gemini 2.0 Flash (free tier) |
| File Uploads | Uploadthing |
| Image Generation | @vercel/og (Satori) |
| Charts | Recharts |
| Animations | Framer Motion |
| Email | Resend (Phase 2+) |
| Payments | Razorpay (Phase 2 — micro-donations) |
| Deployment | Vercel |

**Do not substitute any library without flagging it first.**

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/onboarding
│   ├── (public)/explore, idea/[slug], profile/[username], leaderboard, search
│   ├── (dashboard)/dashboard/
│   │   ├── ideas/new, ideas/[id], ideas/[id]/edit
│   │   ├── votes, notifications, settings
│   ├── admin/reports, ideas, users
│   └── api/
│       ├── webhooks/clerk
│       ├── ideas/[id]/vote, [id]/comments, trending, search
│       ├── users/check-username
│       ├── notifications, notifications/unread-count
│       ├── validation-card/[id]
│       ├── ai/quality-check, duplicate-check
│       ├── admin/reports, analytics
│       └── uploadthing
├── actions/
│   ├── idea-actions.ts
│   ├── vote-actions.ts
│   ├── comment-actions.ts
│   ├── user-actions.ts
│   ├── notification-actions.ts
│   ├── gamification-actions.ts
│   └── payment-actions.ts         # Phase 2
├── components/
│   ├── layout/     navbar, footer, bottom-nav, notification-bell
│   ├── ideas/      idea-list-item, idea-feed, idea-filters, idea-form, idea-skeleton
│   ├── voting/     vote-buttons, vote-breakdown
│   ├── comments/   comment-form, comment-item, comment-list
│   ├── dashboard/  score-display, stats-cards
│   ├── gamification/ badge-display, level-progress, streak-indicator
│   ├── payments/   donate-button, donation-modal   # Phase 2
│   └── shared/     empty-state, share-modal
├── lib/
│   ├── prisma.ts, clerk.ts
│   ├── utils.ts, validations.ts, constants.ts
│   ├── redis.ts, gemini.ts, scoring.ts
│   └── razorpay.ts                # Phase 2
├── hooks/use-debounce.ts
├── types/index.ts
└── middleware.ts   # PROJECT ROOT — not inside src/
prisma/
├── schema.prisma
└── seed.ts
```

---

## Authentication — Clerk

- **Google OAuth via Clerk** — no NextAuth, no custom auth tables
- No `Account`, `Session`, `VerificationToken` tables in Prisma
- `User` model has `clerkId String @unique` as the link to Clerk
- After first login → redirect to `/onboarding` to collect username + role
- Clerk webhook at `/api/webhooks/clerk` syncs user creation/deletion to Prisma
- Server-side auth: `const { userId } = await auth()` from `@clerk/nextjs/server`
- Client-side: `useUser()` and `useAuth()` from `@clerk/nextjs`
- Middleware uses `clerkMiddleware()` — protects `/dashboard/*` and `/admin/*`
- `isAdmin` field on Prisma `User` — set manually in Supabase, no in-app UI

**Auth utilities in `src/lib/clerk.ts`:**
```typescript
getCurrentUser()        // returns Prisma User or null
requireUser()           // returns Prisma User or throws redirect /sign-in
requireAdmin()          // returns Prisma User or throws redirect /
```

---

## Database Models

### Enums
- **UserRole**: `FOUNDER | EXPLORER | BOTH`
- **UserLevel**: `NEWBIE | EXPLORER_LEVEL | VALIDATOR | TASTEMAKER | ORACLE`
- **Category**: `FINTECH | HEALTHTECH | EDTECH | FOOD | D2C | SAAS | SOCIAL | ENTERTAINMENT | AGRITECH | LOGISTICS | AI_ML | SUSTAINABILITY | REAL_ESTATE | TRAVEL | FITNESS | OTHER`
- **IdeaStage**: `JUST_AN_IDEA | BUILDING | PROTOTYPE | LAUNCHED`
- **IdeaStatus**: `DRAFT | ACTIVE | ARCHIVED | REMOVED`
- **TargetAudience**: `STUDENTS | WORKING_PROFESSIONALS | HOMEMAKERS | SMALL_BUSINESSES | TIER_1_CITIES | TIER_2_3_CITIES | EVERYONE`
- **ScoreTier**: `EARLY_DAYS | GETTING_NOTICED | INTERESTED | STRONG | CROWD_FAVORITE`
- **VoteType**: `USE_THIS | MAYBE | NOT_FOR_ME`
- **BadgeCategory**: `VOTING | COMMENTING | FOUNDING | STREAK | MILESTONE | SPECIAL`
- **NotificationType**: `NEW_VOTE | NEW_COMMENT | COMMENT_REPLY | SCORE_MILESTONE | VOTES_MILESTONE | IDEA_TRENDING | BADGE_EARNED | SYSTEM`
- **ReportReason**: `SPAM | INAPPROPRIATE | STOLEN_IDEA | FAKE | HARASSMENT | OTHER`
- **ReportStatus**: `PENDING | REVIEWED | ACTION_TAKEN | DISMISSED`
- **DonationStatus**: `PENDING | COMPLETED | FAILED | REFUNDED` *(Phase 2)*

### Key Relations
- `User` → many `Ideas`, `Votes`, `Comments`, `UserBadges`, `Notifications`, `Reports`, `Donations`
- `Idea` → many `Votes`, `Comments`, `Reports`, `IdeaDailyStats`, `Donations`
- `Comment` → self-referential replies (1 level only)
- `Comment` → many `CommentUpvotes`

### Cached Counts on Idea (keep in sync — always update in same transaction)
`totalVotes`, `totalViews`, `totalComments`, `totalShares`, `useThisCount`, `maybeCount`, `notForMeCount`, `validationScore`, `scoreTier`, `totalDonations`, `donorCount` *(last two Phase 2)*

---

## Authorization Rules

| Action | Requirement |
|---|---|
| `/dashboard/*` | Clerk auth + onboarded |
| `/admin/*` | Clerk auth + `isAdmin: true` |
| `createIdea` | Auth + onboarded + max 3 active ideas |
| `castVote` | Auth + onboarded + not own idea |
| `createComment` | Auth + onboarded |
| `pinComment`, `hideComment` | Auth + must be idea's founder |
| `updateIdea`, `deleteIdea` | Auth + must be idea's founder |
| `donate` | Auth + onboarded + idea has donations enabled *(Phase 2)* |

---

## Business Logic

### Idea Lifecycle
- Goes ACTIVE immediately on submit — no review queue
- AI quality check runs at submission. Spam/inappropriate → block. qualityScore < 30 → show suggestions, can revise or force-publish. AI unavailable → fail open, allow publish.

### Voting Rules
- One vote per user per idea (`userId_ideaId` unique constraint)
- Can change vote type; cannot undo to "no vote"
- Cannot vote on own idea
- Rate limit: 50 votes/hour (Upstash)
- Vote weight < 1.0 for new accounts (anti-gaming)

### Validation Score (pure function — no DB calls)
- Returns 0 + `EARLY_DAYS` if `totalVotes < 10`
- 4 sub-scores: voteScore (40%) · engagementScore (25%) · reachScore (20%) · qualityScore (15%)
- Clamped 0–100
- Tiers: 0-20 Early Days · 21-40 Getting Noticed · 41-60 Interested · 61-80 Strong · 81-100 Crowd Favorite
- `recalculateScore(ideaId)` called after every vote — async, `.catch(console.error)`, never blocks

### Gamification
- Points: Vote=5, Comment=10, Comment upvoted=2, Daily streak=15, Idea posted=20, Early Believer=50, Referral=25
- Levels: Newbie(0-100) · Explorer(101-500) · Validator(501-1500) · Tastemaker(1501-5000) · Oracle(5000+)
- Streak = voting on 3+ ideas in a calendar day
- `checkAndAwardBadges(userId).catch(console.error)` + `updateUserLevel(userId).catch(console.error)` after every mutation

### Notifications
Always fire-and-forget: `createNotification(...).catch(console.error)`
Bell polls `/api/notifications/unread-count` every 30 seconds.

### Micro-Donations — Phase 2 (Razorpay)
- Founder opts in per idea
- Amounts: ₹10, ₹50, ₹100, ₹500, custom
- Flow: validate → create Donation (PENDING) → create Razorpay order → verify HMAC → complete donation + update idea counts + send emails
- Platform fee: 10% (deducted on payout, not at payment time)
- Never trust client-side amounts — always re-fetch from DB
- Signature verification is MANDATORY — never skip
- Atomic transaction: `donorCount` + `totalDonations` update together

---

## Rate Limiters (Upstash Redis)

| Limiter | Limit | Prefix |
|---|---|---|
| `voteLimiter` | 50/hour sliding | `rl:vote` |
| `commentLimiter` | 10/hour sliding | `rl:comment` |
| `ideaLimiter` | 5/hour sliding | `rl:idea` |
| `aiLimiter` | 14/minute sliding | `rl:ai` |
| `donateLimiter` | 10/hour sliding | `rl:donate` |

---

## Validation Cards & OG Images

- OG image: `src/app/(public)/idea/[slug]/opengraph-image.tsx` via `@vercel/og`
- Downloadable PNG: `/api/validation-card/[id]`
- Content: title, pitch, score (large), vote breakdown %, founder name, branding
- Background gradient matches score tier color
- Cache: `Cache-Control: public, max-age=3600`

---

## Responsive Design

| Breakpoint | Layout |
|---|---|
| Mobile (<640px) | Single column, bottom-nav fixed, no footer |
| Desktop (>1024px) | Top navbar + footer, no bottom-nav |

Idea detail: `grid-cols-1 lg:grid-cols-[1fr_380px]` — sidebar sticky on desktop, stacks below on mobile.
Bottom nav: `md:hidden` — 5 items: Home, Explore, Post (prominent), Leaderboard, Profile.

---

## Environment Variables

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database
DATABASE_URL=           # Supabase pooled
DIRECT_URL=             # Supabase direct

# Services
GOOGLE_GEMINI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPLOADTHING_TOKEN=

# Payments (Phase 2)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BackMyIdea
```

---

## Seed Data

`npx prisma db seed` populates:

**11 badges** by slug: `first-vote`, `validated-10`, `validated-50`, `validated-100`, `critic`, `early-believer`, `streak-7`, `streak-30`, `idea-maker`, `validated-founder`, `og`

**8-10 sample ideas** across categories with realistic Indian startup concepts, varied vote counts, calculated scores.

---

## Build Order

```
Phase 0  Bootstrap — Next.js 15, deps, shadcn (New York/Zinc), folder structure, env
Phase 1  DB + Core Libs — schema (no auth tables), prisma client, utils, constants,
         validations, types, Clerk middleware, Clerk webhook, redis, gemini, scoring
Phase 2  Layouts + Onboarding — root layout, navbar, bottom-nav, footer,
         onboarding page, user actions, username check API
Phase 3  Idea CRUD + Feed — idea actions, feed API, skeleton, list item,
         feed (infinite scroll), filters, explore page, homepage, seed data
Phase 4  Voting + Detail — vote actions, vote buttons, vote breakdown,
         score display (SVG ring), idea detail page
Phase 5  Comments + Profiles — comment actions, comment components,
         notification system, profile page, dashboard pages, idea form
Phase 6  Gamification + Leaderboards
Phase 7  Virality + Search + Polish — OG images, validation cards,
         share modal, search, remaining pages
Phase 8  Admin + Deploy
Phase 9  Payments — Razorpay micro-donations (separate session)
```

---

## Key Commands

```bash
npm run dev
npx tsc --noEmit          # Run after every file
npx prisma generate       # After schema change
npx prisma db push        # Push to Supabase
npx prisma db seed        # Seed badges + sample ideas
npx prisma studio
```

---

## Common Gotchas
- ** Read brandkit.md and flow this strictly

- **`middleware.ts` at project ROOT** — not `src/`. Breaks everything if misplaced.
- **Clerk webhook** `/api/webhooks/clerk` must use raw body — use `req.text()` not `req.json()` for signature verification.
- **Clerk user sync** — Prisma User is created in the webhook, not at login time. Always check user exists in Prisma before DB operations.
- **No auth tables in schema** — Clerk handles sessions. Don't add Account/Session/VerificationToken.
- **Cached counts must stay atomic** — update `totalVotes`, `useThisCount`, etc. in the same `$transaction` as the Vote row.
- **Score only shows at 10+ votes** — never extrapolate below threshold.
- **AI fails open** — null from Gemini → allow the operation. Never block on AI.
- **Reply depth = 1 max** — if replying to a reply, attach to the grandparent comment.
- **`recalculateScore` is non-blocking** — call after vote transaction, `.catch()`, never await in response path.
- **`targetAudience` is array** — `formData.getAll("targetAudience")` not `formData.get()`.
- **Slug uniqueness** — always append `nanoid(6)`. Never use title alone.
- **Tailwind v4** — CSS-based config in `globals.css`, no `tailwind.config.ts`.
- **`searchParams` in Next.js 15** — it's a Promise. Always `await searchParams`.
- **Uploadthing domain** — add `utfs.io` to `next.config.ts` `remotePatterns`.
- **Admin access** — set `isAdmin = true` directly in Supabase SQL editor.
- **Razorpay signature** — NEVER skip HMAC verification, not even in dev/test.
- **Donation amounts** — always re-fetch tier/amount from DB in create-order route.