This file is designed for AI coding agents (OpenCode, Claude Code, Cursor).

RULES FOR THE AGENT:

1. Execute tasks in EXACT order (TASK-001, TASK-002, etc.)
2. Do NOT skip tasks — each builds on the previous
3. After each task, verify the acceptance criteria
4. If a task references another file, that file MUST exist already
5. Do NOT modify files from previous tasks unless explicitly told
6. Use the EXACT file paths specified
7. Follow the tech stack — do not substitute libraries
8. When told "paste schema" or "paste types", reference the  
    files already created in previous tasks
9. Each task is ONE atomic unit — complete it fully before moving on
10. Run terminal commands when specified (marked with $)

TECH STACK (do not change):  
├── Next.js 15 (App Router)  
├── TypeScript (strict)  
├── Tailwind CSS v4  
├── shadcn/ui (New York style, Zinc)  
├── Prisma ORM  
├── PostgreSQL (Supabase)  
├── NextAuth.js v5 (beta)  
├── Google Gemini 2.0 Flash (free API)  
├── Upstash Redis  
├── Uploadthing  
├── Framer Motion  
├── Recharts  
├── @vercel/og (Satori)  
├── Resend (optional, week 2)  
├── Deployed on Vercel

COST: ₹0 — all free tiers

text

```

---

## PHASE 0: PROJECT BOOTSTRAP

---

### TASK-001: Create Next.js Project
```

TYPE: Terminal Command  
ESTIMATED TIME: 2 minutes

text

````

```bash
$ npx create-next-app@latest Piqd \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --turbopack

$ cd Piqd
````

**VERIFY:**

- [ ]  `Piqd/` directory exists
- [ ]  `src/app/page.tsx` exists
- [ ]  `npm run dev` starts without errors

---

### TASK-002: Install All Dependencies

text

```
TYPE: Terminal Command
ESTIMATED TIME: 3 minutes
```

Bash

```
# Core
$ npm install \
    prisma @prisma/client \
    next-auth@beta @auth/prisma-adapter \
    @google/generative-ai \
    @upstash/redis @upstash/ratelimit \
    zod react-hook-form @hookform/resolvers \
    framer-motion \
    lucide-react \
    date-fns \
    slugify nanoid \
    clsx tailwind-merge \
    recharts \
    uploadthing @uploadthing/react \
    nuqs \
    server-only

# Dev
$ npm install -D prisma @types/node tsx
```

**VERIFY:**

- [ ]  `package.json` has all dependencies listed
- [ ]  `node_modules/` exists
- [ ]  No install errors

---

### TASK-003: Setup shadcn/ui

text

```
TYPE: Terminal Command
ESTIMATED TIME: 2 minutes
```

Bash

```
$ npx shadcn@latest init
# When prompted:
# Style: New York
# Base color: Zinc  
# CSS variables: Yes

$ npx shadcn@latest add \
    button card input textarea badge dialog \
    dropdown-menu avatar toast skeleton tabs \
    separator sheet popover select label \
    tooltip progress table alert-dialog \
    scroll-area switch sonner form checkbox \
    radio-group
```

**VERIFY:**

- [ ]  `src/components/ui/` directory has component files
- [ ]  `components.json` exists at root
- [ ]  `src/lib/utils.ts` was created by shadcn (we'll modify it)

---

### TASK-004: Create Folder Structure

text

```
TYPE: Terminal Command
ESTIMATED TIME: 1 minute
```

Bash

```
$ mkdir -p src/lib
$ mkdir -p src/actions
$ mkdir -p src/hooks
$ mkdir -p src/types
$ mkdir -p src/components/{layout,ideas,voting,comments,dashboard,leaderboard,profile,gamification,shared}
$ mkdir -p "src/app/(auth)/{login,onboarding}"
$ mkdir -p "src/app/(public)/{explore,leaderboard,search}"
$ mkdir -p "src/app/(public)/idea/[slug]"
$ mkdir -p "src/app/(public)/profile/[username]"
$ mkdir -p "src/app/(dashboard)/dashboard/{ideas/{new,[id],[id]/edit},votes,notifications,settings}"
$ mkdir -p "src/app/admin/{reports,ideas,users}"
$ mkdir -p "src/app/api/auth/[...nextauth]"
$ mkdir -p "src/app/api/ideas/[id]/{vote,comments}"
$ mkdir -p "src/app/api/ideas/{trending,search}"
$ mkdir -p "src/app/api/users/{me,[username]}"
$ mkdir -p "src/app/api/{leaderboard,notifications}"
$ mkdir -p "src/app/api/notifications/unread-count"
$ mkdir -p "src/app/api/validation-card/[id]"
$ mkdir -p "src/app/api/ai/{quality-check,duplicate-check}"
$ mkdir -p "src/app/api/admin/{reports,analytics}"
$ mkdir -p "src/app/api/uploadthing"
$ mkdir -p prisma
$ mkdir -p public/icons
```

**VERIFY:**

- [ ]  `src/components/ideas/` exists
- [ ]  `src/app/(public)/idea/[slug]/` exists
- [ ]  `src/app/(dashboard)/dashboard/ideas/new/` exists
- [ ]  `src/app/api/ideas/[id]/vote/` exists

---

### TASK-005: Create Environment File

text

```
TYPE: Create File
FILE: .env.example
```

env

```
# ── Database (Supabase) ──
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# ── Auth ──
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_TRUST_HOST=true

# ── Google Gemini (FREE) ──
GOOGLE_GEMINI_API_KEY=""

# ── Upstash Redis ──
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# ── Uploadthing ──
UPLOADTHING_TOKEN=""

# ── Public ──
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Piqd"
```

text

```
INSTRUCTION TO HUMAN: 
Copy .env.example to .env.local and fill in real values.
Run: npx auth secret (copy output to AUTH_SECRET)
```

**VERIFY:**

- [ ]  `.env.example` exists
- [ ]  Human confirms `.env.local` created with real values

---

### TASK-006: Update .gitignore

text

```
TYPE: Modify File
FILE: .gitignore
ACTION: Append these lines if not already present
```

gitignore

```
# env
.env
.env.local
.env.production.local

# prisma
prisma/migrations/

# uploadthing
.uploadthing/
```

---

## PHASE 1: DATABASE + CORE LIBRARIES

---

### TASK-007: Prisma Schema

text

```
TYPE: Create File
FILE: prisma/schema.prisma
COMPLEXITY: High
NOTES: This is the entire database. Get it right.
```

Create the complete Prisma schema with these exact models, enums, and indexes:

prisma

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ═══════════════════════════════
// ENUMS
// ═══════════════════════════════

enum UserRole {
  FOUNDER
  EXPLORER
  BOTH
}

enum UserLevel {
  NEWBIE
  EXPLORER_LEVEL
  VALIDATOR
  TASTEMAKER
  ORACLE
}

enum Category {
  FINTECH
  HEALTHTECH
  EDTECH
  FOOD
  D2C
  SAAS
  SOCIAL
  ENTERTAINMENT
  AGRITECH
  LOGISTICS
  AI_ML
  SUSTAINABILITY
  REAL_ESTATE
  TRAVEL
  FITNESS
  OTHER
}

enum IdeaStage {
  JUST_AN_IDEA
  BUILDING
  PROTOTYPE
  LAUNCHED
}

enum IdeaStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  REMOVED
}

enum TargetAudience {
  STUDENTS
  WORKING_PROFESSIONALS
  HOMEMAKERS
  SMALL_BUSINESSES
  TIER_1_CITIES
  TIER_2_3_CITIES
  EVERYONE
}

enum ScoreTier {
  EARLY_DAYS
  GETTING_NOTICED
  INTERESTED
  STRONG
  CROWD_FAVORITE
}

enum VoteType {
  USE_THIS
  MAYBE
  NOT_FOR_ME
}

enum BadgeCategory {
  VOTING
  COMMENTING
  FOUNDING
  STREAK
  MILESTONE
  SPECIAL
}

enum NotificationType {
  NEW_VOTE
  NEW_COMMENT
  COMMENT_REPLY
  SCORE_MILESTONE
  VOTES_MILESTONE
  IDEA_TRENDING
  BADGE_EARNED
  SYSTEM
}

enum ReportReason {
  SPAM
  INAPPROPRIATE
  STOLEN_IDEA
  FAKE
  HARASSMENT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  ACTION_TAKEN
  DISMISSED
}

// ═══════════════════════════════
// AUTH MODELS
// ═══════════════════════════════

model User {
  id            String    @id @default(cuid())
  name          String
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  // Profile
  username      String?   @unique @db.VarChar(30)
  bio           String?   @db.VarChar(300)
  city          String?   @db.VarChar(100)
  state         String?   @db.VarChar(100)
  college       String?   @db.VarChar(200)
  company       String?   @db.VarChar(200)
  linkedinUrl   String?
  role          UserRole  @default(EXPLORER)
  onboarded     Boolean   @default(false)

  // Gamification
  points        Int       @default(0)
  level         UserLevel @default(NEWBIE)
  lastVoteDate  DateTime?
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)

  // Admin
  isAdmin       Boolean   @default(false)
  isBanned      Boolean   @default(false)

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastActiveAt  DateTime  @default(now())

  // Relations
  accounts       Account[]
  sessions       Session[]
  ideas          Idea[]
  votes          Vote[]
  comments       Comment[]
  commentUpvotes CommentUpvote[]
  badges         UserBadge[]
  notifications  Notification[]
  reports        Report[]

  @@index([username])
  @@index([points(sort: Desc)])
  @@index([createdAt])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ═══════════════════════════════
// CORE MODELS
// ═══════════════════════════════

model Idea {
  id               String          @id @default(cuid())
  slug             String          @unique @db.VarChar(120)
  title            String          @db.VarChar(60)
  pitch            String          @db.VarChar(140)
  problem          String          @db.VarChar(500)
  solution         String          @db.VarChar(500)
  category         Category
  stage            IdeaStage
  targetAudience   TargetAudience[]
  status           IdeaStatus      @default(ACTIVE)

  // Optional
  imageUrl         String?
  linkUrl          String?
  feedbackQuestion String?         @db.VarChar(200)
  tags             String[]        @default([])

  // Cached counts
  totalViews       Int             @default(0)
  totalVotes       Int             @default(0)
  totalComments    Int             @default(0)
  totalShares      Int             @default(0)
  useThisCount     Int             @default(0)
  maybeCount       Int             @default(0)
  notForMeCount    Int             @default(0)

  // Score
  validationScore  Int             @default(0)
  scoreTier        ScoreTier       @default(EARLY_DAYS)
  qualityScore     Int?

  // AI flags
  aiChecked        Boolean         @default(false)
  isDuplicate      Boolean         @default(false)
  isSpam           Boolean         @default(false)

  // Timestamps
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  editedAt         DateTime?

  // Relations
  founderId        String
  founder          User            @relation(fields: [founderId], references: [id])
  votes            Vote[]
  comments         Comment[]
  reports          Report[]
  dailyStats       IdeaDailyStat[]

  @@index([slug])
  @@index([status, validationScore(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([status, totalVotes(sort: Desc)])
  @@index([category, status])
  @@index([founderId])
}

model Vote {
  id        String   @id @default(cuid())
  type      VoteType
  reason    String?  @db.VarChar(200)
  ipHash    String?
  weight    Float    @default(1.0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId    String
  ideaId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)

  @@unique([userId, ideaId])
  @@index([ideaId, createdAt])
  @@index([userId])
}

model Comment {
  id           String   @id @default(cuid())
  content      String   @db.VarChar(500)
  isPinned     Boolean  @default(false)
  isHidden     Boolean  @default(false)
  isVoteReason Boolean  @default(false)
  upvoteCount  Int      @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  userId       String
  ideaId       String
  parentId     String?

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  idea         Idea          @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  parent       Comment?      @relation("Replies", fields: [parentId], references: [id])
  replies      Comment[]     @relation("Replies")
  upvotes      CommentUpvote[]

  @@index([ideaId, isPinned(sort: Desc), createdAt(sort: Desc)])
  @@index([parentId])
}

model CommentUpvote {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  userId    String
  commentId String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, commentId])
}

// ═══════════════════════════════
// GAMIFICATION
// ═══════════════════════════════

model Badge {
  id          String        @id @default(cuid())
  name        String        @unique
  slug        String        @unique
  description String
  icon        String
  category    BadgeCategory

  users       UserBadge[]
}

model UserBadge {
  id       String   @id @default(cuid())
  earnedAt DateTime @default(now())

  userId   String
  badgeId  String
  user     User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge    Badge @relation(fields: [badgeId], references: [id])

  @@unique([userId, badgeId])
}

// ═══════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════

model Notification {
  id     String           @id @default(cuid())
  type   NotificationType
  title  String
  body   String
  data   Json?
  isRead Boolean          @default(false)

  createdAt DateTime @default(now())

  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt(sort: Desc)])
}

// ═══════════════════════════════
// MODERATION
// ═══════════════════════════════

model Report {
  id         String       @id @default(cuid())
  reason     ReportReason
  details    String?      @db.VarChar(300)
  status     ReportStatus @default(PENDING)
  entityType String
  entityId   String

  createdAt  DateTime     @default(now())
  resolvedAt DateTime?

  userId     String
  user       User @relation(fields: [userId], references: [id])

  @@index([status, createdAt])
}

// ═══════════════════════════════
// ANALYTICS
// ═══════════════════════════════

model IdeaDailyStat {
  id       String   @id @default(cuid())
  date     DateTime @db.Date
  views    Int      @default(0)
  votes    Int      @default(0)
  comments Int      @default(0)
  shares   Int      @default(0)
  score    Int      @default(0)

  ideaId   String
  idea     Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)

  @@unique([ideaId, date])
  @@index([date])
}
```

**After creating the file, run:**

Bash

```
$ npx prisma generate
$ npx prisma db push
```

**VERIFY:**

- [ ]  `npx prisma generate` succeeds without errors
- [ ]  `npx prisma db push` succeeds
- [ ]  Supabase dashboard shows all tables created
- [ ]  `node_modules/.prisma/client/` exists

---

### TASK-008: Prisma Client Singleton

text

```
TYPE: Create File
FILE: src/lib/prisma.ts
DEPENDS ON: TASK-007
```

TypeScript

```
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

**VERIFY:**

- [ ]  File exists at `src/lib/prisma.ts`
- [ ]  No TypeScript errors

---

### TASK-009: Utility Functions

text

```
TYPE: Create File
FILE: src/lib/utils.ts
DEPENDS ON: TASK-003 (shadcn creates initial utils.ts — REPLACE it)
NOTES: shadcn already created this file with cn(). 
       Replace it entirely with expanded version below.
```

Create `src/lib/utils.ts` with these exports:

1. `cn(...inputs: ClassValue[]): string` — clsx + tailwind-merge (keep from shadcn)
2. `generateSlug(title: string): string` — slugify(title, {lower:true, strict:true, trim:true}) + "-" + nanoid(6)
3. `timeAgo(date: Date | string): string` — formatDistanceToNowStrict(new Date(date), {addSuffix: true})
4. `truncate(str: string, length: number): string` — slice to length, add "..." if truncated
5. `formatNumber(num: number): string` — "1.2K", "3.4M" format, return plain number if <1000
6. `getScoreTier(score: number): { tier, label, color, bg, ring }` — map score ranges:
    - 0-20: EARLY_DAYS, "Early Days", text-gray-400, bg-gray-50, stroke-gray-300
    - 21-40: GETTING_NOTICED, "Getting Noticed", text-blue-500, bg-blue-50, stroke-blue-500
    - 41-60: INTERESTED, "People Are Interested", text-green-500, bg-green-50, stroke-green-500
    - 61-80: STRONG, "Strong Validation", text-orange-500, bg-orange-50, stroke-orange-500
    - 81-100: CROWD_FAVORITE, "Crowd Favorite 🔥", text-red-500, bg-red-50, stroke-red-500
7. `getLevelInfo(points: number): { level, label, next, progress }` — map point ranges:
    - 0-100: NEWBIE, "Newbie", next=101, progress=points/101*100
    - 101-500: EXPLORER_LEVEL, "Explorer", next=501, progress=(points-101)/(501-101)*100
    - 501-1500: VALIDATOR, "Validator", next=1501
    - 1501-5000: TASTEMAKER, "Tastemaker", next=5001
    - 5000+: ORACLE, "Oracle", next=null, progress=100

Import: clsx, twMerge from tailwind-merge, ClassValue from clsx, formatDistanceToNowStrict from date-fns, slugify, nanoid

**VERIFY:**

- [ ]  File compiles without errors
- [ ]  All 7 functions are exported

---

### TASK-010: Constants

text

```
TYPE: Create File
FILE: src/lib/constants.ts
DEPENDS ON: None
```

Create `src/lib/constants.ts` with:

TypeScript

```
export const CATEGORIES = [
  { value: "FINTECH", label: "Fintech", emoji: "💰" },
  { value: "HEALTHTECH", label: "Healthtech", emoji: "🏥" },
  { value: "EDTECH", label: "Edtech", emoji: "📚" },
  { value: "FOOD", label: "Food", emoji: "🍕" },
  { value: "D2C", label: "D2C", emoji: "📦" },
  { value: "SAAS", label: "SaaS", emoji: "☁️" },
  { value: "SOCIAL", label: "Social", emoji: "💬" },
  { value: "ENTERTAINMENT", label: "Entertainment", emoji: "🎮" },
  { value: "AGRITECH", label: "Agritech", emoji: "🌾" },
  { value: "LOGISTICS", label: "Logistics", emoji: "🚚" },
  { value: "AI_ML", label: "AI / ML", emoji: "🤖" },
  { value: "SUSTAINABILITY", label: "Sustainability", emoji: "♻️" },
  { value: "REAL_ESTATE", label: "Real Estate", emoji: "🏠" },
  { value: "TRAVEL", label: "Travel", emoji: "✈️" },
  { value: "FITNESS", label: "Fitness", emoji: "💪" },
  { value: "OTHER", label: "Other", emoji: "💡" },
] as const

export const STAGES = [
  { value: "JUST_AN_IDEA", label: "Just an Idea", emoji: "💭" },
  { value: "BUILDING", label: "Building", emoji: "🔨" },
  { value: "PROTOTYPE", label: "Prototype / MVP", emoji: "🧪" },
  { value: "LAUNCHED", label: "Launched", emoji: "🚀" },
] as const

export const AUDIENCES = [
  { value: "STUDENTS", label: "Students" },
  { value: "WORKING_PROFESSIONALS", label: "Working Professionals" },
  { value: "HOMEMAKERS", label: "Homemakers" },
  { value: "SMALL_BUSINESSES", label: "Small Businesses" },
  { value: "TIER_1_CITIES", label: "Tier 1 Cities" },
  { value: "TIER_2_3_CITIES", label: "Tier 2/3 Cities" },
  { value: "EVERYONE", label: "Everyone" },
] as const

export const LIMITS = {
  MAX_IDEAS_FREE: 3,
  MIN_VOTES_FOR_SCORE: 10,
  MAX_VOTES_PER_HOUR: 50,
  MAX_COMMENTS_PER_HOUR: 10,
  IDEAS_PER_PAGE: 15,
  COMMENTS_PER_PAGE: 20,
} as const

export const POINTS = {
  VOTE: 5,
  COMMENT: 10,
  COMMENT_UPVOTED: 2,
  DAILY_STREAK: 15,
  IDEA_POSTED: 20,
  EARLY_BELIEVER: 50,
  REFERRAL: 25,
} as const
```

**VERIFY:**

- [ ]  File compiles
- [ ]  CATEGORIES has 16 items
- [ ]  STAGES has 4 items

---

### TASK-011: Zod Validation Schemas

text

```
TYPE: Create File
FILE: src/lib/validations.ts
DEPENDS ON: TASK-010 (constants)
```

Create Zod schemas for all data inputs:

1. **usernameSchema**: z.string(), min(3), max(20), regex /^[a-zA-Z0-9_]+$/, refine to exclude reserved words: ["admin", "api", "dashboard", "login", "signup", "settings", "explore", "search", "leaderboard", "idea", "profile", "about", "help"]
    
2. **onboardingSchema**: z.object with username (usernameSchema), role (z.enum FOUNDER/EXPLORER/BOTH), city (z.string max 100 optional), college (z.string max 200 optional), company (z.string max 200 optional)
    
3. **createIdeaSchema**: z.object with:
    
    - title: z.string min(5) max(60)
    - pitch: z.string min(10) max(140)
    - problem: z.string min(20) max(500)
    - solution: z.string min(20) max(500)
    - category: z.enum of all 16 Category values
    - stage: z.enum of all 4 IdeaStage values
    - targetAudience: z.array of z.enum TargetAudience values, min(1)
    - feedbackQuestion: z.string max(200) optional or z.literal("")
    - imageUrl: z.string url optional or z.literal("")
    - linkUrl: z.string url optional or z.literal("")
    - tags: z.array z.string max(30) max(5) optional default([])
4. **updateIdeaSchema**: createIdeaSchema.partial()
    
5. **voteSchema**: z.object with type (z.enum USE_THIS/MAYBE/NOT_FOR_ME), reason (z.string max 200 optional)
    
6. **commentSchema**: z.object with content (z.string min(2) max(500)), parentId (z.string optional)
    
7. **reportSchema**: z.object with reason (z.enum of ReportReason values), details (z.string max 300 optional), entityType (z.enum idea/comment), entityId (z.string)
    
8. **profileSchema**: z.object with name (z.string min 1 max 100), bio (z.string max 300 optional or literal ""), city, college, company (all optional strings), linkedinUrl (z.string url optional or literal "")
    

**VERIFY:**

- [ ]  All 8 schemas exported
- [ ]  No TypeScript errors
- [ ]  Enum values match Prisma schema exactly

---

### TASK-012: TypeScript Types

text

```
TYPE: Create File
FILE: src/types/index.ts
DEPENDS ON: TASK-007 (prisma schema)
```

TypeScript

```
import type {
  User,
  Idea,
  Vote,
  Comment,
  Badge,
  UserBadge,
  Notification,
} from "@prisma/client"

// ── Idea Types ──

export type IdeaWithFounder = Idea & {
  founder: Pick<User, "id" | "name" | "image" | "username">
}

export type IdeaWithDetails = Idea & {
  founder: Pick<
    User,
    "id" | "name" | "image" | "username" | "bio" | "college" | "company"
  > & {
    _count: { ideas: number }
  }
  _count: { comments: number }
}

// ── Comment Types ──

export type CommentWithUser = Comment & {
  user: Pick<User, "id" | "name" | "image" | "username" | "level" | "role">
  replies?: CommentWithUser[]
  _count: { upvotes: number }
  hasUpvoted?: boolean
}

// ── User Types ──

export type UserWithBadges = User & {
  badges: (UserBadge & { badge: Badge })[]
  _count: { ideas: number; votes: number; comments: number }
}

export type PublicProfile = {
  id: string
  name: string
  image: string | null
  username: string | null
  bio: string | null
  city: string | null
  college: string | null
  company: string | null
  linkedinUrl: string | null
  role: string
  points: number
  level: string
  currentStreak: number
  createdAt: Date
  badges: (UserBadge & { badge: Badge })[]
  ideas: {
    id: string
    slug: string
    title: string
    validationScore: number
    totalVotes: number
    category: string
  }[]
  _count: { ideas: number; votes: number; comments: number }
}

// ── Leaderboard Types ──

export type LeaderboardEntry = {
  rank: number
  id: string
  name: string
  image: string | null
  username: string | null
  value: number
  extra?: string
}

// ── Sort/Filter Types ──

export type FeedSort = "trending" | "new" | "top"
export type LeaderboardType = "ideas" | "founders" | "validators"
export type LeaderboardPeriod = "today" | "week" | "alltime"

// ── API Response Types ──

export type ApiResponse<T = unknown> = {
  success?: boolean
  error?: string
  data?: T
}

export type PaginatedResponse<T> = {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

// ── NextAuth Type Extensions ──

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string | null
      username: string | null
      role: string
      isAdmin: boolean
      onboarded: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string | null
    role: string
    isAdmin: boolean
    onboarded: boolean
  }
}
```

**VERIFY:**

- [ ]  No TypeScript errors
- [ ]  All Prisma types resolve correctly

---

### TASK-013: Auth Configuration

text

```
TYPE: Create File
FILE: src/lib/auth.ts
DEPENDS ON: TASK-008 (prisma client), TASK-012 (types)
COMPLEXITY: High — most error-prone file
```

Create NextAuth v5 configuration:

TypeScript

```
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // First login — fetch from DB
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: {
            id: true,
            username: true,
            role: true,
            isAdmin: true,
            onboarded: true,
          },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.username = dbUser.username
          token.role = dbUser.role
          token.isAdmin = dbUser.isAdmin
          token.onboarded = dbUser.onboarded
        }
      }
      // Handle session updates (after onboarding)
      if (trigger === "update" && session) {
        if (session.username !== undefined) token.username = session.username
        if (session.role !== undefined) token.role = session.role
        if (session.onboarded !== undefined) token.onboarded = session.onboarded
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = (token.username as string | null) ?? null
        session.user.role = (token.role as string) ?? "EXPLORER"
        session.user.isAdmin = (token.isAdmin as boolean) ?? false
        session.user.onboarded = (token.onboarded as boolean) ?? false
      }
      return session
    },
  },
})
```

**VERIFY:**

- [ ]  File compiles without errors
- [ ]  Exports: handlers, auth, signIn, signOut

---

### TASK-014: Auth Utility Functions

text

```
TYPE: Create File
FILE: src/lib/auth-utils.ts
DEPENDS ON: TASK-013 (auth)
```

TypeScript

```
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireOnboarded() {
  const user = await requireAuth()
  if (!user.onboarded) redirect("/onboarding")
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (!user.isAdmin) redirect("/")
  return user
}
```

**VERIFY:**

- [ ]  All 4 functions exported
- [ ]  No circular dependency issues

---

### TASK-015: Auth API Route

text

```
TYPE: Create File
FILE: src/app/api/auth/[...nextauth]/route.ts
DEPENDS ON: TASK-013
```

TypeScript

```
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

---

### TASK-016: Middleware

text

```
TYPE: Create File
FILE: middleware.ts (ROOT of project, NOT in src/)
DEPENDS ON: TASK-013
```

TypeScript

```
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const isOnboarded = req.auth?.user?.onboarded
  const isAdmin = req.auth?.user?.isAdmin

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn || !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Force onboarding
  if (
    isLoggedIn &&
    !isOnboarded &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/login")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/onboarding"],
}
```

**VERIFY:**

- [ ]  File is at project ROOT (not src/)
- [ ]  `npm run dev` still works

---

### TASK-017: Redis Client

text

```
TYPE: Create File
FILE: src/lib/redis.ts
DEPENDS ON: TASK-002 (npm packages)
```

TypeScript

```
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const voteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"),
  analytics: true,
  prefix: "rl:vote",
})

export const commentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "rl:comment",
})

export const ideaLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "rl:idea",
})

export const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(14, "1 m"),
  analytics: true,
  prefix: "rl:ai",
})
```

---

### TASK-018: Gemini AI Client

text

```
TYPE: Create File
FILE: src/lib/gemini.ts
DEPENDS ON: TASK-017 (redis for rate limiting)
```

Create file with:

1. Initialize GoogleGenerativeAI with `process.env.GOOGLE_GEMINI_API_KEY`
    
2. Create model instance: `gemini-2.0-flash` with:
    
    - temperature: 0.3
    - maxOutputTokens: 1024
    - responseMimeType: "application/json"
    - Safety settings: BLOCK_NONE for all 4 HarmCategory values
3. Export `async function checkIdeaQuality(idea: {title, pitch, problem, solution, category}): Promise<QualityCheckResult | null>`
    
    QualityCheckResult type:
    
    TypeScript
    
    ```
    interface QualityCheckResult {
      qualityScore: number      // 0-100
      clarity: number           // 0-10
      specificity: number       // 0-10
      feasibility: number       // 0-10
      uniqueness: number        // 0-10
      feedback: string
      suggestions: string[]
      flags: string[]           // "spam" | "too_vague" | "joke" | "inappropriate"
    }
    ```
    
    Prompt: Tell AI it's a startup idea evaluator for an Indian platform. Send idea fields. Ask for JSON response matching the type above. Instruct: be encouraging, score generously for first-timers, only flag if genuinely problematic.
    
    Implementation:
    
    - Check aiLimiter first → return null if rate limited
    - Try/catch the entire thing → return null on ANY error
    - Parse response as JSON
    - Log errors but never throw
4. Export `async function checkDuplicate(newIdea, existingIdeas[]): Promise<DuplicateCheckResult | null>`
    
    DuplicateCheckResult type:
    
    TypeScript
    
    ```
    interface DuplicateCheckResult {
      isDuplicate: boolean
      similarIdeas: Array<{
        id: string
        title: string
        similarity: number
        reason: string
      }>
    }
    ```
    
    If existingIdeas is empty, return `{isDuplicate: false, similarIdeas: []}` immediately.  
    Same error handling pattern — fail open (return null).
    

**VERIFY:**

- [ ]  Exports checkIdeaQuality and checkDuplicate
- [ ]  Both functions return null on any error (never throw)
- [ ]  Both check rate limiter before calling API

---

### TASK-019: Scoring Algorithm

text

```
TYPE: Create File
FILE: src/lib/scoring.ts
DEPENDS ON: TASK-008 (prisma), TASK-010 (constants)
```

Create with two exports:

1. **`calculateValidationScore(input): { score: number, tier: string }`**
    
    Input type (define inline):
    
    TypeScript
    
    ```
    {
      totalVotes: number
      useThisCount: number
      maybeCount: number
      notForMeCount: number
      totalViews: number
      totalComments: number
      totalShares: number
      qualityScore: number | null
      imageUrl: string | null
      linkUrl: string | null
      feedbackQuestion: string | null
      tags: string[]
      problem: string
      solution: string
    }
    ```
    
    Algorithm:
    
    - If totalVotes < LIMITS.MIN_VOTES_FOR_SCORE → return {score: 0, tier: "EARLY_DAYS"}
    - Calculate 4 sub-scores (each 0-100):
        - **voteScore (40%)**: baseScore = (useThisCount/totalVotes)*100, bonus/penalty for ratios
        - **engagementScore (25%)**: comment ratio, share ratio, comment volume bonus, base 20
        - **reachScore (20%)**: log10(views)*25 capped 40, vote-to-view ratio, volume bonus, base 10
        - **qualityScore (15%)**: field completeness bonuses (image+15, link+15, feedbackQ+10, tags+5, long problem/solution+10 each), AI quality if available
    - Final = weighted sum, clamp 0-100
    - Tier from score ranges (same as getScoreTier)
    - This function MUST be pure — no database calls, no side effects
2. **`async recalculateScore(ideaId: string): Promise<{score, tier} | undefined>`**
    
    - Fetch idea from DB with all needed fields
    - Call calculateValidationScore
    - Update idea.validationScore and idea.scoreTier in DB
    - Return result

**VERIFY:**

- [ ]  calculateValidationScore is a pure function (no imports of prisma)
- [ ]  recalculateScore uses prisma to fetch and update
- [ ]  Both exported

---

### TASK-020: Providers Component

text

```
TYPE: Create File
FILE: src/components/providers.tsx
DEPENDS ON: TASK-003 (shadcn sonner)
```

TypeScript

```
"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="bottom-right" richColors />
    </SessionProvider>
  )
}
```

---

## PHASE 1 CHECKPOINT

Bash

```
$ npm run dev
```

**VERIFY ALL OF PHASE 1:**

- [ ]  App starts without errors
- [ ]  No TypeScript compilation errors
- [ ]  Database tables exist in Supabase
- [ ]  All lib files compile
- [ ]  Visiting localhost:3000 shows the default Next.js page

Bash

```
$ git add .
$ git commit -m "Phase 1: Database schema, auth, core libraries"
```

---

## PHASE 2: LAYOUTS + AUTH PAGES

---

### TASK-021: Root Layout

text

```
TYPE: Modify File (REPLACE contents)
FILE: src/app/layout.tsx
DEPENDS ON: TASK-020 (providers)
```

Create the root layout with:

- Import Inter font from `next/font/google`
- Metadata with title template `"%s | Piqd"`, default `"Piqd — Validate Your Startup Idea"`, description about Indian startup validation platform
- metadataBase from `NEXT_PUBLIC_APP_URL` env
- Body wraps children with Providers component
- Include `<Navbar />` component (create placeholder if needed)
- Main element with `className="min-h-screen pb-20 md:pb-0"`
- Include `<BottomNav />` component
- Import globals.css

**NOTE:** If Navbar and BottomNav don't exist yet, create them as simple placeholder components that render null. They will be built in the next tasks.

---

### TASK-022: Navbar Component

text

```
TYPE: Create File
FILE: src/components/layout/navbar.tsx
DEPENDS ON: TASK-013 (auth), TASK-021 (layout)
```

"use client" component.

Specifications:

- Sticky top-0, z-50, white background, border-b
- Max-w-6xl mx-auto, px-4, h-16
- Left: Logo text "Piqd" as Link to "/" (font-bold text-xl)
- Center (desktop only, hidden on mobile): Links to /explore ("Explore"), /leaderboard ("Leaderboard")
- Right:
    - Search icon button (Link to /search)
    - If session exists (useSession from next-auth/react):
        - "Post Idea" Button (Link to /dashboard/ideas/new, variant="default", size="sm")
        - NotificationBell component placeholder (just Bell icon for now)
        - Avatar dropdown (shadcn DropdownMenu):
            - Trigger: Avatar with user image/fallback
            - Items: "Dashboard" → /dashboard, "My Ideas" → /dashboard/ideas, "My Votes" → /dashboard/votes, "Settings" → /dashboard/settings, Separator, "Logout" → call signOut()
    - If no session:
        - "Login" Button (Link to /login, variant="outline", size="sm")
        - "Post Idea" Button (Link to /login, variant="default", size="sm")
- Mobile: Sheet (shadcn) with hamburger menu icon, containing all nav links

Use: lucide-react icons (Search, Menu, Bell, LogOut, LayoutDashboard, Lightbulb, ThumbsUp, Settings)

---

### TASK-023: Bottom Navigation (Mobile)

text

```
TYPE: Create File
FILE: src/components/layout/bottom-nav.tsx
DEPENDS ON: TASK-013 (auth)
```

"use client" component.

Specifications:

- Fixed bottom-0, z-50, white background, border-t
- Hidden on md+ screens: `className="md:hidden"`
- 5 items in flex row, equal width:
    1. Home (House icon) → /
    2. Explore (Compass icon) → /explore
    3. Post (PlusCircle icon) → /dashboard/ideas/new (or /login if not logged in)
        - This button is visually larger/different (primary color circle)
    4. Leaderboard (Trophy icon) → /leaderboard
    5. Profile (User icon) → /profile/[username] or /login
- Active state: icon + label colored blue-600
- Inactive: icon + label text-gray-400
- Determine active from usePathname()
- Each item: flex-col items-center gap-0.5, text-[10px] label below icon

---

### TASK-024: Footer Component

text

```
TYPE: Create File
FILE: src/components/layout/footer.tsx
```

Simple server component:

- Hidden on mobile (hidden md:block)
- border-t, py-8, text-center
- "Piqd — Validate your startup ideas"
- Links: About, Guidelines, Privacy (all link to / for now)
- "Built with ❤️ in India" text
- text-sm text-gray-500

---

### TASK-025: Empty State Component

text

```
TYPE: Create File
FILE: src/components/shared/empty-state.tsx
```

Server component.

Props:

TypeScript

```
{
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  icon?: React.ReactNode
}
```

Centered div (py-16 text-center), icon (default: Lightbulb from lucide, 48px, text-gray-300), h3 title (text-lg font-semibold), p description (text-gray-500), optional Button linked to actionHref.

---

### TASK-026: Login Page

text

```
TYPE: Create File
FILE: src/app/(auth)/login/page.tsx
DEPENDS ON: TASK-013 (auth)
```

This needs TWO parts:

**Part A: The page (server component)**

text

```
src/app/(auth)/login/page.tsx
```

- Check if user is already logged in → redirect to /explore
- Read `searchParams.callbackUrl` for redirect after login
- Render centered layout (max-w-md mx-auto, min-h-screen flex items-center)
- Card with: Logo/Title, tagline, LoginButton component, terms text

**Part B: Login button (client component)**

text

```
src/components/auth/login-button.tsx
```

- "use client"
- Props: callbackUrl?: string
- Button that calls `signIn("google", { callbackUrl: callbackUrl || "/explore" })`
- Google icon + "Continue with Google" text
- Loading state with spinner
- Full width, large size

---

### TASK-027: Onboarding Page

text

```
TYPE: Create File
FILE: src/app/(auth)/onboarding/page.tsx
DEPENDS ON: TASK-011 (validations), TASK-014 (auth-utils)
```

"use client" component.

Specifications:

- Centered layout (max-w-lg mx-auto, py-12)
- Title: "Welcome to Piqd! 🎉"
- Subtitle: "Let's set up your profile in 30 seconds"
- Form using react-hook-form + zodResolver with onboardingSchema:
    1. **Username** field:
        - Input with "@" prefix visual
        - onChange (debounced 500ms): check availability via fetch to `/api/users/check-username?username=X`
        - Show green check or red X with message
    2. **Role** selection:
        - 3 clickable cards (not a dropdown):
            - "💡 I have ideas" → FOUNDER
            - "🔍 I want to explore" → EXPLORER
            - "🚀 Both!" → BOTH
        - Selected card has blue border + bg-blue-50
    3. **Optional fields** (collapsible "Add more details" section):
        - City input
        - College input
        - Company input
    4. **Submit button**: "Get Started →" (full width, primary)
- On submit: POST form data to completeOnboarding server action (to be created in TASK-028)
- Loading state during submission
- Toast on error

---

### TASK-028: User Server Actions

text

```
TYPE: Create File
FILE: src/actions/user-actions.ts
DEPENDS ON: TASK-008, TASK-011, TASK-014
```

"use server"

Functions:

1. **completeOnboarding(formData: FormData)**
    
    - requireAuth()
    - Parse with onboardingSchema
    - Check username uniqueness (case-insensitive: where username equals input.toLowerCase())
    - If taken → return { error: "Username already taken" }
    - Update user: username (lowercased), role, city, college, company, onboarded=true
    - redirect("/explore")
2. **checkUsernameAvailability(username: string)**
    
    - Validate format (usernameSchema)
    - Query DB: findUnique where username = username.toLowerCase()
    - Return { available: boolean, message: string }
3. **updateProfile(formData: FormData)**
    
    - requireAuth()
    - Parse relevant fields from formData
    - Update user record
    - revalidatePath for profile page
    - Return { success: true }
4. **getPublicProfile(username: string)**
    
    - findUnique where username, isBanned=false
    - Select: id, name, image, username, bio, city, college, company, linkedinUrl, role, points, level, currentStreak, createdAt
    - Include: badges (with badge relation), ideas (where status=ACTIVE, select id/slug/title/validationScore/totalVotes/category, orderBy validationScore desc), _count (ideas, votes, comments)
    - Return result or null

---

### TASK-029: Username Check API Route

text

```
TYPE: Create File
FILE: src/app/api/users/check-username/route.ts
DEPENDS ON: TASK-028
```

TypeScript

```
import { NextRequest, NextResponse } from "next/server"
import { checkUsernameAvailability } from "@/actions/user-actions"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")
  if (!username) {
    return NextResponse.json({ available: false, message: "Username required" })
  }
  const result = await checkUsernameAvailability(username)
  return NextResponse.json(result)
}
```

---

## PHASE 2 CHECKPOINT

Bash

```
$ npm run dev
```

**VERIFY:**

- [ ]  Homepage loads with Navbar visible
- [ ]  Navbar shows Login and Post Idea buttons (logged out)
- [ ]  /login page renders with Google button
- [ ]  Google OAuth flow works (redirect → Google → back)
- [ ]  New user redirected to /onboarding
- [ ]  Onboarding form works:
    - [ ]  Username availability check works
    - [ ]  Role selection works
    - [ ]  Submit creates profile and redirects to /explore
- [ ]  After onboarding, navbar shows avatar dropdown
- [ ]  Logout works
- [ ]  Protected routes (/dashboard) redirect to login when logged out
- [ ]  Bottom nav visible on mobile viewport
- [ ]  Footer visible on desktop

Bash

```
$ git add .
$ git commit -m "Phase 2: Layouts, auth pages, onboarding"
```

---

## PHASE 3: IDEA CRUD + FEED

---

### TASK-030: Idea Server Actions

text

```
TYPE: Create File
FILE: src/actions/idea-actions.ts
DEPENDS ON: TASK-008, TASK-009, TASK-010, TASK-011, TASK-014, TASK-017, TASK-018
COMPLEXITY: High
```

"use server"

Create these functions:

1. **createIdea(formData: FormData)**
    
    - requireOnboarded()
    - Rate limit with ideaLimiter(user.id) → return error if limited
    - Count active ideas for user → if >= LIMITS.MAX_IDEAS_FREE, return error
    - Extract and parse formData:
        - Most fields from Object.fromEntries(formData)
        - targetAudience from formData.getAll("targetAudience")
        - tags: parse from JSON string if present, else empty array
    - Validate with createIdeaSchema → return error on failure
    - Generate slug from title using generateSlug()
    - Call checkIdeaQuality (non-blocking-ish — await but handle null)
        - If result has flags including "spam" or "inappropriate" → return error
        - If qualityScore < 30 → return { error, suggestions, qualityScore }
    - Call checkDuplicate with top 20 ideas in same category
    - Create idea in prisma with all fields + founderId + qualityScore + aiChecked + isDuplicate flags
    - Update user points: increment by POINTS.IDEA_POSTED
    - revalidatePath("/explore") and revalidatePath("/")
    - redirect(`/idea/${slug}`)
    - Error handling: return { error: string } on any failure
2. **getIdeas({ sort, category, stage, cursor, limit })**
    
    - Default: sort="trending", limit=LIMITS.IDEAS_PER_PAGE
    - Build where clause: { status: "ACTIVE" } + optional category + optional stage
    - Build orderBy based on sort:
        - "trending": [{ totalVotes: "desc" }, { createdAt: "desc" }]
        - "new": { createdAt: "desc" }
        - "top": { validationScore: "desc" }
    - Fetch limit+1 ideas (to check hasMore)
    - If cursor provided: skip 1, set cursor: { id: cursor }
    - Include founder: { select: { id, name, image, username } }
    - Process: hasMore = ideas.length > limit, items = slice(0, limit)
    - nextCursor = hasMore ? last item's id : null
    - Return { ideas: items, nextCursor, hasMore }
3. **getIdeaBySlug(slug: string)**
    
    - findUnique where { slug, status: "ACTIVE" }
    - Include founder (id, name, image, username, bio, college, company, _count:{ideas})
    - Include _count: { comments }
    - If found: fire-and-forget update totalViews (prisma.idea.update increment, catch errors)
    - Return idea or null
4. **updateIdea(ideaId: string, formData: FormData)**
    
    - requireOnboarded()
    - Verify ownership (founderId === user.id)
    - Parse and validate with updateIdeaSchema (partial)
    - Update idea + set editedAt = new Date()
    - revalidatePath
    - Return { success: true } or { error }
5. **deleteIdea(ideaId: string)**
    
    - requireOnboarded()
    - Verify ownership
    - Update status to ARCHIVED
    - revalidatePath
    - Return { success: true }

---

### TASK-031: Ideas API Route (for infinite scroll)

text

```
TYPE: Create File
FILE: src/app/api/ideas/route.ts
DEPENDS ON: TASK-030
```

TypeScript

```
import { NextRequest, NextResponse } from "next/server"
import { getIdeas } from "@/actions/idea-actions"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const data = await getIdeas({
    sort: (searchParams.get("sort") as any) || "trending",
    category: searchParams.get("category") || undefined,
    stage: searchParams.get("stage") || undefined,
    cursor: searchParams.get("cursor") || undefined,
  })
  return NextResponse.json(data)
}
```

---

### TASK-032: Idea Skeleton Component

text

```
TYPE: Create File
FILE: src/components/ideas/idea-skeleton.tsx
```

Props: `{ count?: number }` default 3

Render `count` skeleton blocks. Each block:

- py-5 with border-b
- Row: Skeleton circle (32px) + Skeleton line (120px) + Skeleton line (60px)
- Skeleton line full width (title)
- Skeleton line 80% width (pitch)
- Skeleton line 60% width (problem)
- Row: 3 small Skeleton rectangles (vote buttons)
- Row: 2 small Skeleton lines (stats)

Use shadcn `<Skeleton />` component for all.

---

### TASK-033: Idea List Item Component

text

```
TYPE: Create File
FILE: src/components/ideas/idea-list-item.tsx
DEPENDS ON: TASK-009, TASK-010, TASK-012
```

"use client" component.

Props:

TypeScript

```
{
  idea: IdeaWithFounder
  currentUserId?: string
  currentVote?: string | null
}
```

Layout (article element, py-5 px-4 md:px-0, border-b border-gray-100):

1. **Founder row**: Avatar (h-8 w-8) + name (linked to /profile/[username]) + "·" + timeAgo + optional "edited" tag
    
2. **Title** (h2, text-lg font-semibold): Link to /idea/[slug], group-hover:text-blue-600
    
3. **Pitch** (text-gray-600, mb-2)
    
4. **Problem snippet** (text-sm text-gray-500, mb-3): truncate(idea.problem, 120)
    
5. **Tags row** (flex wrap gap-2, mb-4):
    
    - Category Badge (variant="secondary", emoji + label)
    - Stage Badge (variant="outline", emoji + label)
    - Score Badge (if totalVotes >= 10): colored by tier, shows "[score]/100 · [tier label]"
6. **Vote buttons**: For now, render 3 static buttons as placeholders:
    
    text
    
    ```
    <div className="flex gap-2 mb-3">
      <button className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-green-50">🔥 Use This</button>
      <button className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-amber-50">🤔 Maybe</button>
      <button className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-red-50">👎 Pass</button>
    </div>
    ```
    
    (Will be replaced with real VoteButtons in TASK-039)
    
7. **Stats row** (flex gap-4, text-sm text-gray-500):
    
    - formatNumber(totalVotes) + " votes" (font-medium text-gray-700 for number)
    - MessageCircle icon (h-4 w-4) + totalComments (linked to /idea/[slug]#comments)
    - Share2 icon + "Share" (ml-auto)

---

### TASK-034: Idea Feed Component

text

```
TYPE: Create File
FILE: src/components/ideas/idea-feed.tsx
DEPENDS ON: TASK-033, TASK-032
```

"use client" component.

Props:

TypeScript

```
{
  initialIdeas: IdeaWithFounder[]
  initialCursor: string | null
  initialHasMore: boolean
  currentUserId?: string
  userVotes: Record<string, string>
  sort?: string
  category?: string
  stage?: string
}
```

State: ideas, cursor, hasMore, loading (all initialized from props)

IntersectionObserver on a sentinel div at the bottom.  
When intersecting: loadMore() → fetch `/api/ideas?cursor=X&sort=X&category=X&stage=X`  
Append new ideas to state.

Render:

- div with divide-y divide-gray-100
- Map ideas → IdeaListItem with currentUserId and currentVote from userVotes[idea.id]
- Sentinel div at bottom
- If loading: show IdeaSkeleton (count=3)
- If !hasMore && ideas.length > 0: "You've seen all ideas ✨" (text-center text-gray-400 py-8)
- If ideas.length === 0: EmptyState component

---

### TASK-035: Idea Filters Component

text

```
TYPE: Create File
FILE: src/components/ideas/idea-filters.tsx
DEPENDS ON: TASK-010 (constants)
```

"use client" component.

Props:

TypeScript

```
{
  currentSort: string
  currentCategory?: string
  currentStage?: string
}
```

Uses useRouter() and useSearchParams() to update URL.

Layout:

1. **Sort tabs** (flex gap-1, border-b border-gray-200):
    
    - Three buttons: 🔥 Trending, 🆕 New, 🏆 Top
    - Active: border-b-2 border-blue-600 text-blue-600
    - Inactive: border-transparent text-gray-500
    - onClick: updateParam("sort", value)
2. **Category pills** (flex gap-2, overflow-x-auto, pb-2, mt-4):
    
    - "All" pill + one pill per CATEGORY
    - Active: bg-gray-900 text-white
    - Inactive: bg-gray-100 text-gray-600
    - onClick: updateParam("category", value or null for "All")
    - scrollbar-hide class (add to globals.css: `.scrollbar-hide::-webkit-scrollbar { display: none }`)

Helper: `updateParam(key, value)` — create new URLSearchParams, set/delete key, router.push

---

### TASK-036: Explore Page

text

```
TYPE: Create File
FILE: src/app/(public)/explore/page.tsx
DEPENDS ON: TASK-030, TASK-034, TASK-035
```

Server component.

TypeScript

```
import { getIdeas } from "@/actions/idea-actions"
import { getCurrentUser } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { IdeaFeed } from "@/components/ideas/idea-feed"
import { IdeaFilters } from "@/components/ideas/idea-filters"

export const metadata = { title: "Explore Ideas" }

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string; stage?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()

  const { ideas, nextCursor, hasMore } = await getIdeas({
    sort: params.sort || "trending",
    category: params.category,
    stage: params.stage,
  })

  // Get user's votes for displayed ideas
  let userVotes: Record<string, string> = {}
  if (user) {
    const votes = await prisma.vote.findMany({
      where: { userId: user.id, ideaId: { in: ideas.map((i) => i.id) } },
      select: { ideaId: true, type: true },
    })
    userVotes = Object.fromEntries(votes.map((v) => [v.ideaId, v.type]))
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Explore Ideas</h1>
      <IdeaFilters
        currentSort={params.sort || "trending"}
        currentCategory={params.category}
        currentStage={params.stage}
      />
      <IdeaFeed
        initialIdeas={ideas}
        initialCursor={nextCursor}
        initialHasMore={hasMore}
        currentUserId={user?.id}
        userVotes={userVotes}
        sort={params.sort || "trending"}
        category={params.category}
        stage={params.stage}
      />
    </div>
  )
}
```

---

### TASK-037: Homepage

text

```
TYPE: Modify File (REPLACE)
FILE: src/app/page.tsx
DEPENDS ON: TASK-030, TASK-033
```

Server component. Layout: max-w-5xl mx-auto.

Sections:

1. **Hero** (py-16 md:py-24, text-center):
    
    - h1: "Test your startup idea with real people" (text-4xl md:text-5xl font-bold)
    - p: "Get honest votes, feedback, and a validation score — before you build." (text-xl text-gray-600, mt-4)
    - Buttons (mt-8, flex gap-4 justify-center):
        - "Post Your Idea" → /dashboard/ideas/new (Button default)
        - "Explore Ideas" → /explore (Button variant="outline")
2. **How It Works** (py-16, grid grid-cols-1 md:grid-cols-3 gap-8):
    
    - Step 1: "📝 Post Your Idea" — "Describe your startup idea in a simple structured format"
    - Step 2: "🗳️ Get Validated" — "Real people vote and give honest feedback"
    - Step 3: "📊 See Your Score" — "Get a validation score from 0-100 and a shareable card"
    - Each: text-center, emoji large (text-4xl), h3, p
3. **Trending Ideas** (py-8):
    
    - h2: "🔥 Trending Ideas" (text-2xl font-bold)
    - Fetch top 5 trending ideas: `getIdeas({ sort: "trending", limit: 5 })`
    - Render each with IdeaListItem (no votes data needed for homepage)
    - Link: "See All Ideas →" → /explore
4. **CTA** (py-16, text-center, bg-gray-50 rounded-2xl):
    
    - h2: "Ready to validate your idea?"
    - p: "Join founders across India testing their ideas"
    - Button: "Get Started — It's Free" → /login

---

### TASK-038: Seed Data

text

```
TYPE: Create File
FILE: prisma/seed.ts
DEPENDS ON: TASK-007
```

Create a seed script that:

1. **Seeds all 11 badges** (upsert by slug):
    
    text
    
    ```
    first-vote: "First Vote", 🗳️, "Cast your first vote", VOTING
    validated-10: "Validated 10", ✅, "Voted on 10 ideas", VOTING
    validated-50: "Validated 50", 🏅, "Voted on 50 ideas", VOTING
    validated-100: "Validated 100", 🏆, "Voted on 100 ideas", VOTING
    critic: "Critic", 📝, "Left 25 thoughtful comments", COMMENTING
    early-believer: "Early Believer", 🔮, "Voted 🔥 before it trended", SPECIAL
    streak-7: "On Fire", 🔥, "7-day voting streak", STREAK
    streak-30: "Dedicated", 💎, "30-day voting streak", STREAK
    idea-maker: "Idea Maker", 💡, "Posted your first idea", FOUNDING
    validated-founder: "Validated Founder", 🚀, "Idea scored above 60", FOUNDING
    og: "OG Member", 👑, "Among the first 1000 users", SPECIAL
    ```
    
2. **Seeds 8-10 sample ideas** with realistic Indian startup concepts:
    
    - First create or find a sample founder user
    - Create ideas across different categories with realistic content
    - Set varied vote counts (some with 50+, some with 5)
    - Set validation scores for those with enough votes
    - Examples:
        - "AI Tiffin Service for Hostel Students" (FOOD, JUST_AN_IDEA)
        - "Rent-a-Skill Micro-Freelancing" (SAAS, BUILDING)
        - "Farm-to-Kitchen Fresh Produce" (AGRITECH, PROTOTYPE)
        - "Mental Health Bot for College Students" (HEALTHTECH, JUST_AN_IDEA)
        - "Chai Money Micro-Investments" (FINTECH, BUILDING)
        - "Smart Parking for Tier 2 Cities" (LOGISTICS, JUST_AN_IDEA)
        - "AI Resume Builder for Freshers" (AI_ML, LAUNCHED)
        - "Sustainable Fashion Rental" (SUSTAINABILITY, PROTOTYPE)

Add to package.json:

JSON

```
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

Bash

```
$ npx prisma db seed
```

**VERIFY:**

- [ ]  Badges table has 11 rows
- [ ]  Ideas table has sample data
- [ ]  `npm run dev` → homepage shows trending ideas from seed data

---

## PHASE 3 CHECKPOINT

Bash

```
$ npm run dev
```

**VERIFY:**

- [ ]  Homepage renders hero + how it works + trending ideas
- [ ]  /explore shows feed of seeded ideas
- [ ]  Sort tabs work (URL changes)
- [ ]  Category pills filter ideas
- [ ]  Clicking idea title navigates to /idea/[slug] (404 for now — detail page next)
- [ ]  Infinite scroll works (if enough seeded data)
- [ ]  Mobile layout: single column, bottom nav visible

Bash

```
$ git add .
$ git commit -m "Phase 3: Idea CRUD, feed, homepage, seed data"
```

---

## PHASE 4: VOTING + IDEA DETAIL

---

### TASK-039: Vote Server Actions

text

```
TYPE: Create File
FILE: src/actions/vote-actions.ts
DEPENDS ON: TASK-008, TASK-011, TASK-014, TASK-017, TASK-019
COMPLEXITY: High — critical business logic
```

"use server"

1. **castVote(ideaId: string, data: { type: string; reason?: string })**
    
    Full implementation:
    
    - requireOnboarded()
    - Validate with voteSchema
    - Rate limit with voteLimiter(user.id)
    - Fetch idea (must exist, status ACTIVE)
    - Cannot vote on own idea (founderId !== user.id)
    - Hash IP: createHash("sha256").update(ip from headers).digest("hex").slice(0,16)
    - Check existing vote: prisma.vote.findUnique({ where: { userId_ideaId } })
    
    If existing vote:
    
    - Same type → return { error: "Already voted", currentVote: type }
    - Different type → $transaction:
        - Update vote type + reason
        - Decrement old type field on idea (use `voteTypeToField` helper)
        - Increment new type field on idea
    
    If new vote:
    
    - $transaction:
        
        - Create vote
        - Update idea: totalVotes increment + specific type increment
        - Update user: points increment POINTS.VOTE
    - If reason provided: create Comment with isVoteReason=true + increment totalComments
        
    - Call updateStreak helper
        
    - recalculateScore(ideaId) — catch errors
        
    - revalidatePath for idea + explore
        
    - Return updated idea counts + success + vote type
        
2. **getUserVote(ideaId: string, userId: string): Promise<string | null>**
    
    - findUnique userId_ideaId, select type
    - Return type or null
3. **Helper: voteTypeToField(type: string): string**
    
    - USE_THIS → "useThis"
    - MAYBE → "maybe"
    - NOT_FOR_ME → "notForMe"
4. **Helper: updateStreak(userId: string)**
    
    - Get user's lastVoteDate, currentStreak, longestStreak
    - Today at midnight
    - If no lastVoteDate → streak = 1
    - If lastVoteDate is yesterday → streak++
    - If lastVoteDate is today → no change (return early)
    - Else → streak = 1
    - Update user: lastVoteDate, currentStreak, longestStreak, bonus points if streak % 7 === 0

NOTE for field increment syntax:

TypeScript

```
// The idea update in transaction for changing vote:
prisma.idea.update({
  where: { id: ideaId },
  data: {
    useThisCount: oldType === "USE_THIS" ? { decrement: 1 } : 
                  newType === "USE_THIS" ? { increment: 1 } : undefined,
    maybeCount: oldType === "MAYBE" ? { decrement: 1 } : 
                newType === "MAYBE" ? { increment: 1 } : undefined,
    notForMeCount: oldType === "NOT_FOR_ME" ? { decrement: 1 } : 
                   newType === "NOT_FOR_ME" ? { increment: 1 } : undefined,
  }
})
```

---

### TASK-040: Vote Buttons Component

text

```
TYPE: Create File
FILE: src/components/voting/vote-buttons.tsx
DEPENDS ON: TASK-039
```

"use client" component.

Props:

TypeScript

```
{
  ideaId: string
  currentVote?: string | null
  isOwner: boolean
  isLoggedIn: boolean
  compact?: boolean
  onVoted?: () => void
}
```

Three vote options defined as const array:

text

```
USE_THIS: label "I'd Use This", shortLabel "Use This", icon Flame, 
  activeClass "bg-green-50 border-green-500 text-green-700"
MAYBE: label "Interesting, Maybe", shortLabel "Maybe", icon Meh,
  activeClass "bg-amber-50 border-amber-500 text-amber-700"  
NOT_FOR_ME: label "Not For Me", shortLabel "Pass", icon ThumbsDown,
  activeClass "bg-red-50 border-red-500 text-red-700"
```

Behavior:

- isOwner → render italic text "You can't vote on your own idea"
- !isLoggedIn → onClick redirects to /login?callbackUrl=current
- useState for optimisticVote (initialized from currentVote)
- useState for showReason (boolean), reason text
- useTransition for isPending
- onClick handler:
    - Set optimistic state
    - startTransition → castVote server action
    - If error: revert optimistic, toast error
    - If success: set showReason=true (only in non-compact mode)
- Each button: variant="outline", conditional active class
- compact mode: size="sm", text-xs, shortLabel
- full mode: regular size, full label
- After voting (full mode only): show inline input for reason with Send/Skip

---

### TASK-041: Vote Breakdown Component

text

```
TYPE: Create File
FILE: src/components/voting/vote-breakdown.tsx
DEPENDS ON: None (pure presentational)
```

Props: `{ useThisCount, maybeCount, notForMeCount, totalVotes, minVotes?: number }`

If totalVotes < minVotes (default 10):

- Show "Collecting votes... [X/10]" with a progress bar (bg-blue-400)

Else show 3 horizontal bars:

- 🔥 I'd Use This: green-500 bar, [pct]% ([count])
- 🤔 Maybe: amber-400 bar
- 👎 Not For Me: red-400 bar
- Each: label left, percentage right, bar below
- Bar = div in div, width as percentage, transition-all duration-500

---

### TASK-042: Score Display Component

text

```
TYPE: Create File
FILE: src/components/dashboard/score-display.tsx
DEPENDS ON: TASK-009 (utils - getScoreTier)
```

"use client" component.

Props: `{ score, totalVotes, minVotes?, size?: "sm" | "md" | "lg" }`

If totalVotes < minVotes: show "—" with "[X]/[min] votes to unlock"

Else: SVG circular progress ring

- Background circle: gray stroke
- Foreground arc: colored by getScoreTier(score)
- Animated: useEffect sets animatedScore from 0 to actual
- Score number in center (large, bold, colored)
- Tier label below
- "[X] validations" text

Sizes: sm (60px ring), md (100px), lg (140px)

SVG technique:

text

```
radius = (ringSize - strokeWidth) / 2
circumference = 2 * Math.PI * radius
offset = circumference - (animatedScore / 100) * circumference
```

---

### TASK-043: Idea Detail Page

text

```
TYPE: Create File
FILE: src/app/(public)/idea/[slug]/page.tsx
DEPENDS ON: TASK-030, TASK-039, TASK-040, TASK-041, TASK-042
COMPLEXITY: High — largest page
```

Server component.

Data fetching:

TypeScript

```
const { slug } = await params
const idea = await getIdeaBySlug(slug)
if (!idea) notFound()
const user = await getCurrentUser()
const currentVote = user ? await getUserVote(idea.id, user.id) : null
// Comments will be added in TASK-048
```

Generate metadata: title = idea.title, description = idea.pitch, openGraph

Layout: max-w-[1100px] mx-auto

Desktop: `grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8`  
Mobile: single column (sidebar stacks below)

**Main column:**

1. Back link: "← Back to Explore" → /explore
2. Mobile only (lg:hidden): ScoreDisplay (sm)
3. h1: title (text-2xl md:text-3xl font-bold)
4. p: pitch (text-lg text-gray-600)
5. Tags: category + stage + audience badges
6. Image if exists
7. Section "The Problem": h2 label + idea.problem
8. Section "The Solution": h2 label + idea.solution
9. External link if exists
10. Founder's question if exists (bg-blue-50 border-blue-200 rounded-lg p-4)
11. HR
12. Vote section: h2 "What do you think?" + VoteButtons (full mode)
13. VoteBreakdown
14. HR
15. Comments section placeholder (h2 + "Comments coming soon")

**Sidebar (hidden lg:block, sticky top-20):**

1. Score: ScoreDisplay (lg) in border rounded-lg p-6
2. Founder card: avatar, name (linked), college/company, ideas count, "View Profile" link
3. Share section: Copy Link, WhatsApp, Twitter, LinkedIn buttons + Download Card button
4. Metadata: posted date, views

**Mobile sidebar (lg:hidden, below main):**  
Same content as sidebar, rendered in normal flow.

---

### TASK-044: Wire Vote Buttons into Feed

text

```
TYPE: Modify File
FILE: src/components/ideas/idea-list-item.tsx
ACTION: Replace vote button placeholders with real VoteButtons component
DEPENDS ON: TASK-040
```

Replace the static button div (from TASK-033) with:

React

```
import { VoteButtons } from "@/components/voting/vote-buttons"

// In the component:
<VoteButtons
  ideaId={idea.id}
  currentVote={currentVote}
  isOwner={currentUserId === idea.founderId}
  isLoggedIn={!!currentUserId}
  compact
/>
```

---

## PHASE 4 CHECKPOINT

Bash

```
$ npm run dev
```

**VERIFY:**

- [ ]  /idea/[slug] renders full detail page
- [ ]  Vote buttons work in feed (compact mode)
- [ ]  Vote buttons work on detail page (full mode)
- [ ]  Cannot vote on own idea
- [ ]  Changing vote works
- [ ]  Vote counts update after voting
- [ ]  Vote breakdown shows after 10+ votes
- [ ]  Score display animates
- [ ]  "Why?" prompt appears after voting on detail page
- [ ]  Login redirect works for unauthenticated vote clicks

Bash

```
$ git add .
$ git commit -m "Phase 4: Voting system, idea detail page, score display"
```

---

## PHASE 5: COMMENTS + PROFILES

---

### TASK-045: Comment Server Actions

text

```
TYPE: Create File
FILE: src/actions/comment-actions.ts
DEPENDS ON: TASK-008, TASK-011, TASK-014, TASK-017
```

"use server"

Functions: createComment, getComments, toggleUpvote, pinComment, hideComment

(Full specification in previous PRD section — implement all 5 functions)

Key points:

- createComment: rate limit, validate parentId depth (no reply to reply), create comment, increment idea.totalComments, award points
- getComments: pinned first, then by sort, include user + replies + _count upvotes, take COMMENTS_PER_PAGE
- toggleUpvote: cannot upvote own, toggle create/delete, increment/decrement upvoteCount
- pinComment: verify idea ownership, unpin existing, pin new
- hideComment: verify idea ownership, set isHidden=true

---

### TASK-046: Comment Components

text

```
TYPE: Create Files (3 files)
DEPENDS ON: TASK-045
```

**File 1: src/components/comments/comment-form.tsx**  
"use client". Props: ideaId, parentId?, founderName?, onCancel?, autoFocus?

- Textarea (max 500) with character counter
- Submit button, loading state
- Calls createComment server action
- Toast on error, clear on success

**File 2: src/components/comments/comment-item.tsx**  
"use client". Props: comment (CommentWithUser), ideaId, currentUserId?, founderId

- Avatar + name + level badge + "Founder" badge if applicable
- Vote reason tag if isVoteReason
- Comment text, time ago
- Upvote button (ArrowBigUp icon) + count
- Reply button (toggles reply form)
- "📌 Pinned" indicator
- Nested replies (indented, border-l)

**File 3: src/components/comments/comment-list.tsx**  
"use client". Props: comments[], ideaId, currentUserId?, founderId

- Sort toggle: Newest | Most Upvoted
- Map comments → CommentItem
- Track which comment has reply form open (useState)
- Empty state

---

### TASK-047: Notification System

text

```
TYPE: Create File
FILE: src/actions/notification-actions.ts
DEPENDS ON: TASK-008, TASK-014
```

Functions:

1. createNotification(userId, type, title, body, data?) — create record
2. getNotifications(userId, limit=20) — fetch ordered by createdAt desc
3. getUnreadCount(userId) — count where isRead=false
4. markAsRead(notificationId) — verify ownership, update
5. markAllAsRead(userId) — updateMany

---

### TASK-048: Wire Comments + Notifications into Detail Page

text

```
TYPE: Modify File
FILE: src/app/(public)/idea/[slug]/page.tsx
ACTION: Replace comment placeholder with real components
DEPENDS ON: TASK-045, TASK-046
```

Add to data fetching:

TypeScript

```
import { getComments } from "@/actions/comment-actions"
const comments = await getComments(idea.id)
```

Replace comment placeholder section with:

React

```
<section id="comments">
  <h2>Comments ({idea.totalComments})</h2>
  {user ? (
    <CommentForm ideaId={idea.id} founderName={idea.founder.name} />
  ) : (
    <p>Sign in to comment</p>
  )}
  <CommentList
    comments={comments}
    ideaId={idea.id}
    currentUserId={user?.id}
    founderId={idea.founderId}
  />
</section>
```

---

### TASK-049: Add Notification Triggers

text

```
TYPE: Modify Files
FILES: src/actions/vote-actions.ts, src/actions/comment-actions.ts
ACTION: Add createNotification calls
DEPENDS ON: TASK-047
```

In **vote-actions.ts** castVote (after successful new vote):

TypeScript

```
import { createNotification } from "./notification-actions"

// After new vote created:
createNotification(
  idea.founderId,
  "NEW_VOTE",
  "New vote on your idea",
  `Someone voted ${voteType === "USE_THIS" ? "🔥" : voteType === "MAYBE" ? "🤔" : "👎"} on "${idea.title}"`,
  { ideaId, ideaSlug: idea.slug }
).catch(console.error) // fire and forget
```

In **comment-actions.ts** createComment:

TypeScript

```
// After comment created (if commenter is not the founder):
if (user.id !== idea.founderId) {
  createNotification(
    idea.founderId,
    "NEW_COMMENT",
    "New comment on your idea",
    `${user.name} commented on "${idea.title}"`,
    { ideaId, ideaSlug: idea.slug }
  ).catch(console.error)
}

// If reply, notify parent comment author:
if (parentId && parentComment.userId !== user.id) {
  createNotification(
    parentComment.userId,
    "COMMENT_REPLY",
    "Someone replied to your comment",
    `${user.name} replied to your comment`,
    { ideaId, ideaSlug: idea.slug }
  ).catch(console.error)
}
```

---

### TASK-050: Notification Bell Component

text

```
TYPE: Create File
FILE: src/components/layout/notification-bell.tsx
DEPENDS ON: TASK-047
```

"use client" component.

- On mount + every 30s: fetch GET /api/notifications/unread-count
- Bell icon with red dot showing count (if > 0)
- On click: Popover with latest 5 notifications
- Each notification: icon + title + body + timeAgo
- "View All" link to /dashboard/notifications
- "Mark All Read" button

---

### TASK-051: Notification API Routes

text

```
TYPE: Create Files (2 files)
DEPENDS ON: TASK-047
```

**File 1: src/app/api/notifications/route.ts**  
GET: auth check, return getNotifications(user.id)

**File 2: src/app/api/notifications/unread-count/route.ts**  
GET: if no session return {count:0}, else return getUnreadCount(user.id)

---

### TASK-052: Profile Page

text

```
TYPE: Create File
FILE: src/app/(public)/profile/[username]/page.tsx
DEPENDS ON: TASK-028 (getPublicProfile)
```

Server component. Fetch profile by username from params. notFound() if null.

Render: avatar, name, bio, location, college/company, LinkedIn, role badge, join date, points + level (LevelProgress), streak (StreakIndicator), ideas list, badge collection.

---

### TASK-053: Dashboard Pages

text

```
TYPE: Create Files (5 files)
DEPENDS ON: TASK-028, TASK-030
```

1. **src/app/(dashboard)/layout.tsx** — sidebar + content layout
2. **src/app/(dashboard)/dashboard/page.tsx** — stats overview + idea list
3. **src/app/(dashboard)/dashboard/ideas/page.tsx** — my ideas table
4. **src/app/(dashboard)/dashboard/ideas/new/page.tsx** — idea form
5. **src/app/(dashboard)/dashboard/settings/page.tsx** — profile edit form

---

### TASK-054: Idea Form Component

text

```
TYPE: Create File
FILE: src/components/ideas/idea-form.tsx
DEPENDS ON: TASK-011 (validations), TASK-010 (constants), TASK-030 (createIdea)
```

"use client". Props: initialData?, mode: "create" | "edit"

react-hook-form + zodResolver with createIdeaSchema.  
All form fields with character counters.  
Category select, stage radio, audience checkboxes.  
Submit calls createIdea or updateIdea server action via FormData.

---

## PHASE 5 CHECKPOINT

Bash

```
$ npm run dev
```

**VERIFY:**

- [ ]  Comments appear on idea detail page
- [ ]  Can post new comments
- [ ]  Can reply to comments (1 level)
- [ ]  Can upvote comments
- [ ]  Founder badge shows on founder's comments
- [ ]  Notification bell shows count
- [ ]  Notifications created for votes and comments
- [ ]  Profile page renders with user data
- [ ]  Dashboard shows user's ideas
- [ ]  Can submit new ideas via form
- [ ]  Settings page allows profile editing

Bash

```
$ git add .
$ git commit -m "Phase 5: Comments, notifications, profiles, dashboard, idea form"
```

---

## PHASE 6: GAMIFICATION + LEADERBOARDS

---

### TASK-055: Gamification Actions

text

```
TYPE: Create File
FILE: src/actions/gamification-actions.ts
```

checkAndAwardBadges(userId) — check all badge conditions, award new ones.  
updateUserLevel(userId) — calculate level from points, update if changed.

---

### TASK-056: Wire Gamification into Existing Actions

text

```
TYPE: Modify Files
FILES: vote-actions.ts, comment-actions.ts, idea-actions.ts
ACTION: Add gamification calls after mutations
```

Add to end of castVote, createComment, createIdea:

TypeScript

```
checkAndAwardBadges(user.id).catch(console.error)
updateUserLevel(user.id).catch(console.error)
```

---

### TASK-057: Gamification UI Components

text

```
TYPE: Create Files (3 files)
```

1. **src/components/gamification/badge-display.tsx** — grid of badges
2. **src/components/gamification/level-progress.tsx** — level + progress bar
3. **src/components/gamification/streak-indicator.tsx** — 🔥 streak counter

---

### TASK-058: Leaderboard Actions + Page

text

```
TYPE: Create Files (2 files)
```

1. **src/actions/leaderboard-actions.ts** — getIdeaLeaderboard, getFounderLeaderboard, getValidatorLeaderboard
2. **src/app/(public)/leaderboard/page.tsx** — tabs + period toggle + ranked lists

---

### TASK-059: Idea Analytics Page

text

```
TYPE: Create File
FILE: src/app/(dashboard)/dashboard/ideas/[id]/page.tsx
```

Stats cards, vote breakdown, score display, comments management, validation card preview.

---

## PHASE 6 CHECKPOINT

Bash

```
$ git add .
$ git commit -m "Phase 6: Gamification, leaderboards, idea analytics"
```

---

## PHASE 7: VIRALITY + SEARCH + POLISH

---

### TASK-060: OG Image Generation

text

```
TYPE: Create File
FILE: src/app/(public)/idea/[slug]/opengraph-image.tsx
```

@vercel/og ImageResponse. Gradient background. Title, pitch, score, votes, founder name, branding.

---

### TASK-061: Validation Card API

text

```
TYPE: Create File
FILE: src/app/api/validation-card/[id]/route.ts
```

Same as OG image but downloadable PNG.

---

### TASK-062: Share Modal

text

```
TYPE: Create File
FILE: src/components/shared/share-modal.tsx
```

Copy link, WhatsApp, Twitter, LinkedIn, Download Card, Native Share API.

---

### TASK-063: Search

text

```
TYPE: Create Files (3 files)
```

1. **src/app/api/ideas/search/route.ts** — Prisma contains/insensitive search
2. **src/hooks/use-debounce.ts** — debounce hook
3. **src/app/(public)/search/page.tsx** — search results page

---

### TASK-064: Remaining Pages

text

```
TYPE: Create Files
```

1. **src/app/(dashboard)/dashboard/votes/page.tsx** — voting history
2. **src/app/(dashboard)/dashboard/ideas/[id]/edit/page.tsx** — edit idea
3. **src/app/(dashboard)/dashboard/notifications/page.tsx** — all notifications
4. **src/app/not-found.tsx** — custom 404

---

### TASK-065: Wire Share + Search into Existing Components

text

```
TYPE: Modify Files
```

- Add ShareModal to idea-list-item.tsx and idea detail page
- Add SearchBar to navbar.tsx
- Wire NotificationBell into navbar.tsx

---

## PHASE 7 CHECKPOINT

Bash

```
$ git add .
$ git commit -m "Phase 7: Sharing, OG images, search, remaining pages"
```

---

## PHASE 8: ADMIN + DEPLOY

---

### TASK-066: Admin Panel

text

```
TYPE: Create Files (4 files)
```

1. **src/app/admin/layout.tsx** — requireAdmin + sidebar
2. **src/app/admin/page.tsx** — stats dashboard
3. **src/app/admin/reports/page.tsx** — moderation queue
4. **src/app/admin/ideas/page.tsx** — all ideas table

---

### TASK-067: SEO Files

text

```
TYPE: Create Files (2 files)
```

1. **src/app/sitemap.ts** — static + dynamic idea URLs
2. **src/app/robots.ts** — allow all, disallow /dashboard, /admin, /api

---

### TASK-068: PWA Manifest

text

```
TYPE: Create File
FILE: public/manifest.json
```

Standard PWA manifest with app name, icons, standalone display.

Also update root layout.tsx to add manifest link and meta tags.

---

### TASK-069: Final next.config.ts

text

```
TYPE: Modify File
FILE: next.config.ts
```

TypeScript

```
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
}

export default nextConfig
```

---

### TASK-070: Deploy

text

```
TYPE: Terminal Commands + Manual Steps
```

Bash

```
$ git add .
$ git commit -m "Phase 8: Admin, SEO, PWA, final config"
$ git push origin main
```

Manual steps:

1. Go to vercel.com → Import repository
2. Set ALL environment variables (update AUTH_URL and NEXT_PUBLIC_APP_URL to Vercel URL)
3. Deploy
4. Update Google OAuth redirect URI for production URL
5. Test all flows on production
6. Make yourself admin in Supabase SQL editor

---

## FINAL VERIFICATION CHECKLIST

text

```
CORE FLOWS:
├── [ ] Signup with Google → Onboarding → Feed
├── [ ] Post an idea → appears in feed
├── [ ] Vote on idea → counts update → score recalculates
├── [ ] Comment on idea → notification to founder
├── [ ] Reply to comment → notification to author
├── [ ] Edit idea → shows "edited" badge
├── [ ] Delete/archive idea → removed from feed
├── [ ] Search ideas → results show
├── [ ] Leaderboard → shows ranked data
├── [ ] Profile page → shows user data + badges
├── [ ] Share idea → copy link works
├── [ ] OG image → renders when URL shared on social
├── [ ] Admin panel → accessible only to admins
├── [ ] Mobile → everything works on 360px viewport
└── [ ] Protected routes → redirect to login

EDGE CASES:
├── [ ] Cannot vote on own idea
├── [ ] Cannot vote when logged out (redirect to login)
├── [ ] Cannot post more than 3 ideas
├── [ ] Rate limiting works (fast clicking doesn't break)
├── [ ] Empty states show everywhere
├── [ ] 404 page shows for invalid URLs
└── [ ] Invalid form data shows validation errors
```