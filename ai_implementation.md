```
# PIQD — AI Idea Research Feature
# Implementation Plan (Feature Upgrade)

---

## CONTEXT
```

WHAT EXISTS (Your Working MVP):  
├── Idea posting with structured form  
├── Voting system (3 options, scores, anti-gaming)  
├── Comments with replies and upvotes  
├── Validation score algorithm (0-100)  
├── Gamification (points, badges, streaks, levels)  
├── Leaderboards  
├── User profiles  
├── Search  
├── OG images / validation cards  
├── Sharing  
├── Admin panel  
├── Auth (Clerk OAuth)  
├── AI quality check on submission (Gemini)  
└── Deployed on Vercel, DB on Supabase, Cache on Upstash

WHAT WE'RE ADDING:  
A "Research" tab/section on each idea detail page that  
provides AI-powered market intelligence:  
├── Competitor discovery  
├── Reddit sentiment analysis  
├── Google Trends demand signal  
├── Market context & sizing  
├── News & existing solutions  
├── Cross-validation verdict (crowd + research)  
└── Downloadable research summary

WHAT WE'RE NOT BUILDING (yet):  
├── Real-time monitoring / alerts  
├── Custom scraper infrastructure  
├── Paid API integrations (Crunchbase, SimilarWeb)  
├── Automated weekly research updates  
├── Research API for third parties  
└── PDF report generation (V2)

COST OF THIS FEATURE: ₹0  
├── Gemini 2.0 Flash: free (1,500 req/day)  
├── Google Trends: free (embeddable)  
├── Reddit: public search (no API key needed for V1)  
├── Web search: SerpAPI free tier (100 searches/month)  
│ OR: Serper.dev free tier (2,500 searches/month)  
│ OR: Google Custom Search API (100 free/day)  
│ OR: Gemini grounding with Google Search (free)  
├── Supabase: existing DB, new table  
└── Upstash: existing Redis, new cache keys

ESTIMATED BUILD TIME: 5-7 days

text

```

---

## ARCHITECTURE OVERVIEW
```

CURRENT FLOW:  
User posts idea → People vote → Score calculated  
↓  
Idea Detail Page shows:  
├── Idea content  
├── Vote buttons + breakdown  
├── Validation score  
├── Comments  
├── Founder info  
└── Share buttons

NEW FLOW:  
User posts idea → People vote → Score calculated  
↓  
Idea Detail Page shows:  
├── Idea content  
├── Vote buttons + breakdown  
├── Validation score  
├── Comments  
├── Founder info  
├── Share buttons  
└── [NEW] Research Tab ← 🆕  
├── Competitor analysis  
├── Reddit pulse  
├── Search demand  
├── Market context  
└── Cross-validation verdict

RESEARCH GENERATION FLOW:  
┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐  
│ User │───→│ Check │───→│ Generate │───→│ Cache & │  
│ clicks │ │ cache │ │ research │ │ store │  
│"Research"│ │ (Redis) │ │ (Gemini) │ │ (DB) │  
└─────────┘ └──────────┘ └─────────┘ └──────────┘  
│ │  
│ Cache hit │  
└──────────→ Return immediately │  
↓  
┌──────────────┐  
│ Render on │  
│ idea detail │  
│ page │  
└──────────────┘

DATA FLOW:  
Idea text ──→ Gemini API ──→ Structured JSON ──→ DB storage  
│ │ │  
│ ├──→ Competitor analysis │  
│ ├──→ Market sizing │  
│ ├──→ Risk assessment │  
│ └──→ Verdict │  
│ │  
├──→ Reddit Search API ──→ Top posts + sentiment │  
├──→ Google Trends ──→ Embeddable widget │  
└──→ Web Search ──→ News + existing solutions │  
↓  
Research Report  
(stored in DB,  
cached in Redis)

text

```

---

## DATABASE CHANGES

### New Table: IdeaResearch
```

TASK: Add to existing prisma/schema.prisma  
ACTION: Add new model, do NOT modify existing models

text

````

```prisma
// ═══════════════════════════════
// ADD TO EXISTING SCHEMA
// (do not remove or modify anything above)
// ═══════════════════════════════

model IdeaResearch {
  id              String         @id @default(cuid())
  
  // ── Status ──
  status          ResearchStatus @default(PENDING)
  error           String?        // error message if failed
  
  // ── Competitor Analysis ──
  competitors     Json?          // Array of competitor objects
  // Structure: [{
  //   name: string,
  //   description: string,
  //   url?: string,
  //   status: "active" | "failed" | "acquired" | "unknown",
  //   fundingStage?: string,
  //   similarity: "high" | "medium" | "low",
  //   differentiator: string
  // }]
  competitorCount Int            @default(0)
  
  // ── Market Analysis ──
  marketData      Json?          // Market sizing and context
  // Structure: {
  //   estimatedTAM: string,
  //   estimatedSAM: string,
  //   growthRate: string,
  //   marketMaturity: "nascent" | "growing" | "mature" | "declining",
  //   keyTrends: string[],
  //   targetDemographic: string,
  //   geographicFocus: string
  // }
  
  // ── Reddit Analysis ──
  redditData      Json?          // Reddit sentiment and posts
  // Structure: {
  //   totalPostsFound: number,
  //   sentiment: "positive" | "negative" | "mixed" | "neutral",
  //   sentimentScore: number, // -100 to 100
  //   topSubreddits: string[],
  //   topPosts: [{
  //     title: string,
  //     subreddit: string,
  //     url: string,
  //     upvotes: number,
  //     commentCount: number,
  //     sentiment: string,
  //     keyInsight: string
  //   }],
  //   commonPainPoints: string[],
  //   commonPraises: string[],
  //   summary: string
  // }
  
  // ── Search Demand ──
  searchData      Json?          // Google search/trends data
  // Structure: {
  //   primaryKeyword: string,
  //   relatedKeywords: [{
  //     keyword: string,
  //     volume: string, // "high" | "medium" | "low"
  //     trend: "rising" | "stable" | "declining"
  //   }],
  //   trendDirection: "rising" | "stable" | "declining",
  //   trendSummary: string,
  //   searchIntent: string
  // }
  
  // ── News & Existing Solutions ──
  newsData        Json?          // Recent news and articles
  // Structure: {
  //   articles: [{
  //     title: string,
  //     source: string,
  //     url: string,
  //     date?: string,
  //     relevance: string
  //   }],
  //   existingSolutions: [{
  //     name: string,
  //     type: "app" | "website" | "service" | "product",
  //     description: string,
  //     url?: string,
  //     limitation: string // why user's idea is still needed
  //   }],
  //   industryNews: string // summary paragraph
  // }
  
  // ── AI Verdict ──
  verdict         Json?          // Cross-validation analysis
  // Structure: {
  //   overallSignal: "strong" | "promising" | "moderate" | "weak" | "risky",
  //   overallScore: number, // 0-100
  //   crowdVsMarket: "aligned" | "crowd_higher" | "market_higher" | "divergent",
  //   summary: string, // 2-3 sentence verdict
  //   strengths: string[],
  //   risks: string[],
  //   recommendations: string[],
  //   shouldBuild: "definitely" | "probably" | "maybe" | "reconsider",
  //   keyInsight: string // one powerful sentence
  // }
  
  // ── Metadata ──
  generatedAt     DateTime       @default(now())
  expiresAt       DateTime       // when to regenerate (7 days)
  generationTime  Int?           // milliseconds taken to generate
  geminiModel     String         @default("gemini-2.0-flash")
  dataSourcesUsed String[]       @default([])
  
  // ── Crowd Data Snapshot (at time of research) ──
  crowdDataSnapshot Json?        // snapshot of validation data
  // Structure: {
  //   validationScore: number,
  //   totalVotes: number,
  //   useThisPercent: number,
  //   maybePercent: number,
  //   notForMePercent: number,
  //   totalComments: number
  // }
  
  // ── Relations ──
  ideaId          String
  idea            Idea           @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  requestedById   String
  
  // ── Tracking ──
  viewCount       Int            @default(0)
  
  @@unique([ideaId]) // one research per idea (regenerate overwrites)
  @@index([ideaId])
  @@index([status])
}

enum ResearchStatus {
  PENDING
  GENERATING
  COMPLETED
  FAILED
  EXPIRED
}
````

### Modify Existing Idea Model

text

```
ACTION: Add relation to Idea model
ADD this line to the Idea model's relations section:
```

prisma

```
// In the Idea model, add:
research     IdeaResearch?
```

### Run Migration

Bash

```
$ npx prisma generate
$ npx prisma db push
```

---

## FILE CHANGES MAP

text

```
FILES TO CREATE (new):
├── src/lib/research.ts                              # Research generation engine
├── src/lib/search-providers.ts                      # Web search abstraction
├── src/actions/research-actions.ts                   # Server actions
├── src/app/api/ideas/[id]/research/route.ts         # API endpoint
├── src/components/research/research-panel.tsx        # Main research container
├── src/components/research/research-trigger.tsx      # "Generate Research" button
├── src/components/research/competitor-section.tsx    # Competitor cards
├── src/components/research/reddit-section.tsx        # Reddit analysis
├── src/components/research/search-demand.tsx         # Trends + keywords
├── src/components/research/market-section.tsx        # Market analysis
├── src/components/research/news-section.tsx          # News & solutions
├── src/components/research/verdict-section.tsx       # AI verdict
├── src/components/research/research-skeleton.tsx     # Loading state
├── src/components/research/research-score.tsx        # Research score display
├── src/components/research/source-badge.tsx          # Data source indicator
└── src/hooks/use-research.ts                        # Client-side research hook

FILES TO MODIFY (existing):
├── prisma/schema.prisma                             # Add IdeaResearch model
├── src/app/(public)/idea/[slug]/page.tsx            # Add research tab
├── src/lib/gemini.ts                                # Add research prompts
├── src/lib/redis.ts                                 # Add research cache limiter
├── src/lib/constants.ts                             # Add research constants
├── src/lib/scoring.ts                               # Optionally factor research into score
├── src/components/dashboard/score-display.tsx        # Show research score alongside
└── src/app/(dashboard)/dashboard/ideas/[id]/page.tsx # Show research in analytics

TOTAL: 17 new files + 8 modified files = 25 file operations
```

---

## IMPLEMENTATION TASKS

---

### TASK-R001: Add Research Constants

text

```
TYPE: Modify File
FILE: src/lib/constants.ts
ACTION: Append new constants (do NOT remove existing)
```

Add these to the end of the file:

TypeScript

```
// ═══════════════════════════════
// RESEARCH CONSTANTS
// ═══════════════════════════════

export const RESEARCH_CONFIG = {
  CACHE_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 days
  MAX_COMPETITORS: 8,
  MAX_REDDIT_POSTS: 10,
  MAX_NEWS_ARTICLES: 8,
  MAX_RELATED_KEYWORDS: 8,
  MAX_EXISTING_SOLUTIONS: 6,
  MIN_VOTES_FOR_RESEARCH: 0,  // allow research immediately
  FREE_RESEARCH_PER_DAY: 3,   // per user
  GENERATION_TIMEOUT_MS: 60000, // 60 seconds max
} as const

export const RESEARCH_SIGNALS = {
  STRONG: { label: "Strong Signal", color: "text-green-600", bg: "bg-green-50", emoji: "🟢" },
  PROMISING: { label: "Promising", color: "text-blue-600", bg: "bg-blue-50", emoji: "🔵" },
  MODERATE: { label: "Moderate", color: "text-amber-600", bg: "bg-amber-50", emoji: "🟡" },
  WEAK: { label: "Weak Signal", color: "text-orange-600", bg: "bg-orange-50", emoji: "🟠" },
  RISKY: { label: "High Risk", color: "text-red-600", bg: "bg-red-50", emoji: "🔴" },
} as const

export const RESEARCH_SOURCES = [
  { id: "gemini", label: "AI Analysis", icon: "🤖" },
  { id: "reddit", label: "Reddit", icon: "💬" },
  { id: "google_trends", label: "Google Trends", icon: "📈" },
  { id: "web_search", label: "Web Search", icon: "🔍" },
  { id: "piqd_crowd", label: "PIQD Crowd", icon: "👥" },
] as const
```

**VERIFY:**

- [ ]  Constants file still compiles
- [ ]  No conflicts with existing constants

---

### TASK-R002: Add Research Rate Limiter

text

```
TYPE: Modify File
FILE: src/lib/redis.ts
ACTION: Append new rate limiter (do NOT remove existing)
```

Add to the end of the file:

TypeScript

```
export const researchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "24 h"), // 3 per day free
  analytics: true,
  prefix: "rl:research",
})

export const researchGenerationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // max 5 concurrent generations
  analytics: true,
  prefix: "rl:research-gen",
})
```

---

### TASK-R003: Web Search Provider

text

```
TYPE: Create File
FILE: src/lib/search-providers.ts
DEPENDS ON: TASK-R002
```

This file abstracts web search so we can swap providers without changing research logic.

TypeScript

```
// src/lib/search-providers.ts

interface SearchResult {
  title: string
  url: string
  snippet: string
  source?: string
  date?: string
}

interface RedditPost {
  title: string
  subreddit: string
  url: string
  selftext?: string
  score: number
  numComments: number
  created: string
}

/**
 * Search the web using available free providers.
 * Priority: Serper.dev > Google Custom Search > Gemini grounding
 * For V1: We use Gemini's built-in knowledge + basic fetch
 */
export async function searchWeb(query: string, numResults: number = 10): Promise<SearchResult[]> {
  try {
    // OPTION 1: If you have SERPER_API_KEY (2,500 free searches/month)
    if (process.env.SERPER_API_KEY) {
      return await searchWithSerper(query, numResults)
    }

    // OPTION 2: If you have GOOGLE_SEARCH_API_KEY (100 free/day)
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
      return await searchWithGoogleCSE(query, numResults)
    }

    // OPTION 3: Fallback — no web search, Gemini uses training data only
    return []
  } catch (error) {
    console.error("Web search failed:", error)
    return []
  }
}

async function searchWithSerper(query: string, num: number): Promise<SearchResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num, gl: "in", hl: "en" }),
  })
  
  if (!res.ok) return []
  const data = await res.json()
  
  return (data.organic || []).map((r: any) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet || "",
    source: new URL(r.link).hostname,
    date: r.date,
  }))
}

async function searchWithGoogleCSE(query: string, num: number): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_SEARCH_API_KEY!,
    cx: process.env.GOOGLE_SEARCH_CX!,
    q: query,
    num: Math.min(num, 10).toString(),
    gl: "in",
  })
  
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  
  return (data.items || []).map((r: any) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet || "",
    source: r.displayLink,
  }))
}

/**
 * Search Reddit for relevant discussions.
 * Uses Reddit's public JSON API (no API key needed).
 */
export async function searchReddit(
  query: string,
  limit: number = 15
): Promise<RedditPost[]> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://www.reddit.com/search.json?q=${encoded}&sort=relevance&limit=${limit}&type=link`
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PIQD Research Bot 1.0",
      },
    })
    
    if (!res.ok) return []
    const data = await res.json()
    
    return (data.data?.children || [])
      .map((child: any) => child.data)
      .filter((post: any) => !post.over_18) // filter NSFW
      .map((post: any) => ({
        title: post.title,
        subreddit: post.subreddit_name_prefixed || `r/${post.subreddit}`,
        url: `https://reddit.com${post.permalink}`,
        selftext: post.selftext?.slice(0, 300) || "",
        score: post.score || 0,
        numComments: post.num_comments || 0,
        created: new Date(post.created_utc * 1000).toISOString(),
      }))
  } catch (error) {
    console.error("Reddit search failed:", error)
    return []
  }
}

/**
 * Search Reddit in specific subreddits relevant to Indian startups.
 */
export async function searchRedditTargeted(
  query: string,
  subreddits: string[] = [
    "india",
    "IndianStartups", 
    "developersIndia",
    "startups",
    "SaaS",
    "Entrepreneur",
    "smallbusiness",
  ],
  limit: number = 5
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = []
  
  // Search top 3 most relevant subreddits to avoid too many requests
  const targetSubs = subreddits.slice(0, 3)
  
  for (const sub of targetSubs) {
    try {
      const encoded = encodeURIComponent(query)
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encoded}&restrict_sr=1&sort=relevance&limit=${limit}`
      
      const res = await fetch(url, {
        headers: { "User-Agent": "PIQD Research Bot 1.0" },
      })
      
      if (!res.ok) continue
      const data = await res.json()
      
      const posts = (data.data?.children || [])
        .map((child: any) => child.data)
        .filter((post: any) => !post.over_18)
        .map((post: any) => ({
          title: post.title,
          subreddit: `r/${post.subreddit}`,
          url: `https://reddit.com${post.permalink}`,
          selftext: post.selftext?.slice(0, 300) || "",
          score: post.score || 0,
          numComments: post.num_comments || 0,
          created: new Date(post.created_utc * 1000).toISOString(),
        }))
      
      allPosts.push(...posts)
    } catch {
      continue
    }
  }
  
  // Sort by relevance (score) and deduplicate
  return allPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

/**
 * Get Google Trends embed URL for a keyword.
 * This is free and doesn't need an API key.
 */
export function getGoogleTrendsEmbedUrl(keyword: string, geo: string = "IN"): string {
  const encoded = encodeURIComponent(keyword)
  return `https://trends.google.com/trends/embed/explore/TIMESERIES?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22${encoded}%22%2C%22geo%22%3A%22${geo}%22%2C%22time%22%3A%22today%2012-m%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-330&eq=q%3D${encoded}%26geo%3D${geo}%26date%3Dtoday%2012-m`
}
```

**VERIFY:**

- [ ]  File compiles
- [ ]  searchReddit works (test with a simple query)
- [ ]  searchWeb returns empty array if no API keys configured (graceful fallback)

---

### TASK-R004: Research Generation Engine

text

```
TYPE: Create File
FILE: src/lib/research.ts
DEPENDS ON: TASK-R001, TASK-R003, existing src/lib/gemini.ts
COMPLEXITY: Highest — this is the core brain
```

This is the main research generation file. It orchestrates all data gathering and AI synthesis.

Create the file with these exports:

TypeScript

```
// src/lib/research.ts

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai"
import { searchWeb, searchReddit, searchRedditTargeted } from "@/lib/search-providers"
import { RESEARCH_CONFIG } from "@/lib/constants"
import { aiLimiter } from "@/lib/redis"

// ── Types ──

export interface ResearchInput {
  ideaId: string
  title: string
  pitch: string
  problem: string
  solution: string
  category: string
  stage: string
  tags: string[]
  feedbackQuestion?: string | null
  // Crowd data
  validationScore: number
  totalVotes: number
  useThisCount: number
  maybeCount: number
  notForMeCount: number
  totalComments: number
}

export interface ResearchOutput {
  competitors: CompetitorData[]
  marketData: MarketData
  redditData: RedditData
  searchData: SearchDemandData
  newsData: NewsData
  verdict: VerdictData
  dataSourcesUsed: string[]
  generationTime: number
}

// ... (define all sub-types matching the Prisma JSON structures)

interface CompetitorData {
  name: string
  description: string
  url?: string
  status: "active" | "failed" | "acquired" | "unknown"
  fundingStage?: string
  similarity: "high" | "medium" | "low"
  differentiator: string
}

interface MarketData {
  estimatedTAM: string
  estimatedSAM: string
  growthRate: string
  marketMaturity: "nascent" | "growing" | "mature" | "declining"
  keyTrends: string[]
  targetDemographic: string
  geographicFocus: string
}

interface RedditData {
  totalPostsFound: number
  sentiment: "positive" | "negative" | "mixed" | "neutral"
  sentimentScore: number
  topSubreddits: string[]
  topPosts: Array<{
    title: string
    subreddit: string
    url: string
    upvotes: number
    commentCount: number
    sentiment: string
    keyInsight: string
  }>
  commonPainPoints: string[]
  commonPraises: string[]
  summary: string
}

interface SearchDemandData {
  primaryKeyword: string
  relatedKeywords: Array<{
    keyword: string
    volume: "high" | "medium" | "low"
    trend: "rising" | "stable" | "declining"
  }>
  trendDirection: "rising" | "stable" | "declining"
  trendSummary: string
  searchIntent: string
}

interface NewsData {
  articles: Array<{
    title: string
    source: string
    url: string
    date?: string
    relevance: string
  }>
  existingSolutions: Array<{
    name: string
    type: "app" | "website" | "service" | "product"
    description: string
    url?: string
    limitation: string
  }>
  industryNews: string
}

interface VerdictData {
  overallSignal: "strong" | "promising" | "moderate" | "weak" | "risky"
  overallScore: number
  crowdVsMarket: "aligned" | "crowd_higher" | "market_higher" | "divergent"
  summary: string
  strengths: string[]
  risks: string[]
  recommendations: string[]
  shouldBuild: "definitely" | "probably" | "maybe" | "reconsider"
  keyInsight: string
}
```

Then implement the main function:

TypeScript

```
/**
 * Generate complete research for an idea.
 * This is the main orchestrator function.
 * 
 * Flow:
 * 1. Gather raw data (parallel: Reddit, Web Search)
 * 2. Send everything to Gemini for analysis (2-3 API calls)
 * 3. Structure and return results
 */
export async function generateResearch(input: ResearchInput): Promise<ResearchOutput> {
  const startTime = Date.now()
  const dataSourcesUsed: string[] = ["gemini", "piqd_crowd"]
  
  // ── Step 1: Gather raw data in parallel ──
  
  const searchQueries = buildSearchQueries(input)
  
  const [redditPosts, webResults, competitorSearch] = await Promise.allSettled([
    // Reddit search
    searchRedditTargeted(searchQueries.reddit),
    // Web search for competitors and news
    searchWeb(searchQueries.competitors, 10),
    // Web search specifically for competitor companies
    searchWeb(searchQueries.competitorDirect, 8),
  ])

  const reddit = redditPosts.status === "fulfilled" ? redditPosts.value : []
  const webRes = webResults.status === "fulfilled" ? webResults.value : []
  const compRes = competitorSearch.status === "fulfilled" ? competitorSearch.value : []
  
  if (reddit.length > 0) dataSourcesUsed.push("reddit")
  if (webRes.length > 0 || compRes.length > 0) dataSourcesUsed.push("web_search")
  dataSourcesUsed.push("google_trends")

  // ── Step 2: AI Analysis with Gemini ──
  
  // Call 1: Competitor + Market Analysis
  const competitorMarketAnalysis = await analyzeCompetitorsAndMarket(input, compRes, webRes)
  
  // Call 2: Reddit Sentiment Analysis  
  const redditAnalysis = await analyzeRedditSentiment(input, reddit)
  
  // Call 3: Search Demand + News + Final Verdict
  const verdictAnalysis = await generateVerdict(
    input,
    competitorMarketAnalysis,
    redditAnalysis,
    webRes
  )
  
  const generationTime = Date.now() - startTime
  
  return {
    competitors: competitorMarketAnalysis.competitors,
    marketData: competitorMarketAnalysis.market,
    redditData: redditAnalysis,
    searchData: verdictAnalysis.searchData,
    newsData: verdictAnalysis.newsData,
    verdict: verdictAnalysis.verdict,
    dataSourcesUsed,
    generationTime,
  }
}
```

Implement helper functions:

TypeScript

```
function buildSearchQueries(input: ResearchInput) {
  const { title, pitch, category, tags } = input
  const tagString = tags.slice(0, 3).join(" ")
  
  return {
    reddit: `${title} ${pitch}`.slice(0, 100),
    competitors: `${title} competitors alternatives India startup`,
    competitorDirect: `"${category.toLowerCase().replace('_', ' ')}" startup India ${tagString}`,
    news: `${title} ${category.toLowerCase().replace('_', ' ')} India 2024 2025`,
  }
}
```

For each analysis function, create a separate Gemini call with specific prompts:

**analyzeCompetitorsAndMarket:**

TypeScript

```
async function analyzeCompetitorsAndMarket(
  input: ResearchInput,
  competitorSearchResults: SearchResult[],
  webResults: SearchResult[]
): Promise<{ competitors: CompetitorData[], market: MarketData }> {
  const { success } = await aiLimiter.limit("research-competitor")
  if (!success) {
    // Return empty defaults if rate limited
    return { competitors: [], market: getDefaultMarketData() }
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
    safetySettings: [/* BLOCK_NONE for all categories */],
  })

  const searchContext = [...competitorSearchResults, ...webResults]
    .slice(0, 15)
    .map(r => `- ${r.title}: ${r.snippet} (${r.url})`)
    .join("\n")

  const prompt = `You are a startup market analyst specializing in the Indian startup ecosystem.

Analyze this startup idea and identify competitors and market context.

IDEA:
- Title: ${input.title}
- Pitch: ${input.pitch}
- Problem: ${input.problem}
- Solution: ${input.solution}
- Category: ${input.category}
- Stage: ${input.stage}

WEB SEARCH RESULTS (use these as reference, plus your own knowledge):
${searchContext || "No web search results available. Use your training data."}

Return this EXACT JSON structure:
{
  "competitors": [
    {
      "name": "Company Name",
      "description": "What they do in 1 sentence",
      "url": "https://... or null",
      "status": "active|failed|acquired|unknown",
      "fundingStage": "bootstrapped|pre-seed|seed|series-a|etc or null",
      "similarity": "high|medium|low",
      "differentiator": "How the user's idea differs from this competitor"
    }
  ],
  "market": {
    "estimatedTAM": "Total addressable market in India (e.g., '₹50,000 Cr' or '$6B')",
    "estimatedSAM": "Serviceable addressable market",
    "growthRate": "Annual growth rate (e.g., '15-20% CAGR')",
    "marketMaturity": "nascent|growing|mature|declining",
    "keyTrends": ["trend 1", "trend 2", "trend 3"],
    "targetDemographic": "Primary target users description",
    "geographicFocus": "Where this works best in India"
  }
}

RULES:
- Find 3-8 competitors (real companies, not imaginary ones)
- If you're not sure a competitor exists, mark status as "unknown"
- Include both Indian and global competitors
- Include failed startups (valuable information)
- Market size should be specific to India where possible
- Be honest about market maturity — not everything is "growing"
- If this is a very niche idea, say the market is "nascent" with smaller numbers`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return JSON.parse(text)
  } catch (error) {
    console.error("Competitor analysis failed:", error)
    return { competitors: [], market: getDefaultMarketData() }
  }
}
```

**analyzeRedditSentiment:**

TypeScript

```
async function analyzeRedditSentiment(
  input: ResearchInput,
  posts: RedditPost[]
): Promise<RedditData> {
  if (posts.length === 0) {
    return getDefaultRedditData()
  }
  
  const { success } = await aiLimiter.limit("research-reddit")
  if (!success) return getDefaultRedditData()
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1536,
      responseMimeType: "application/json",
    },
  })
  
  const postsContext = posts.slice(0, 10).map(p => 
    `[${p.subreddit}] "${p.title}" (${p.score} upvotes, ${p.numComments} comments)
     ${p.selftext ? `Preview: ${p.selftext.slice(0, 150)}` : ""}`
  ).join("\n\n")
  
  const prompt = `You are analyzing Reddit discussions related to a startup idea.

IDEA: ${input.title} — ${input.pitch}
PROBLEM IT SOLVES: ${input.problem}

REDDIT POSTS FOUND:
${postsContext}

Analyze the sentiment and extract insights. Return this JSON:
{
  "totalPostsFound": ${posts.length},
  "sentiment": "positive|negative|mixed|neutral",
  "sentimentScore": <-100 to 100>,
  "topSubreddits": ["subreddit1", "subreddit2"],
  "topPosts": [
    {
      "title": "post title",
      "subreddit": "r/...",
      "url": "full reddit url",
      "upvotes": <number>,
      "commentCount": <number>,
      "sentiment": "positive|negative|neutral",
      "keyInsight": "What this post tells us about demand for the idea"
    }
  ],
  "commonPainPoints": ["pain point 1", "pain point 2"],
  "commonPraises": ["praise 1 (if any)"],
  "summary": "2-3 sentence summary of what Reddit thinks about this problem space"
}

Focus on whether people are actually experiencing the PROBLEM the idea solves.
High upvotes on complaint posts = strong demand signal.`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text)
    
    // Ensure real URLs from our data
    parsed.topPosts = parsed.topPosts?.map((p: any, i: number) => ({
      ...p,
      url: posts[i]?.url || p.url,
      upvotes: posts[i]?.score || p.upvotes,
      commentCount: posts[i]?.numComments || p.commentCount,
    }))
    
    return parsed
  } catch (error) {
    console.error("Reddit analysis failed:", error)
    return getDefaultRedditData()
  }
}
```

**generateVerdict:**

TypeScript

```
async function generateVerdict(
  input: ResearchInput,
  competitorMarket: { competitors: CompetitorData[], market: MarketData },
  redditData: RedditData,
  webResults: SearchResult[]
): Promise<{ searchData: SearchDemandData, newsData: NewsData, verdict: VerdictData }> {
  const { success } = await aiLimiter.limit("research-verdict")
  if (!success) return getDefaultVerdictOutput()
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  })
  
  const useThisPct = input.totalVotes > 0 
    ? Math.round((input.useThisCount / input.totalVotes) * 100) 
    : 0
  
  const prompt = `You are an expert startup advisor providing a final research verdict.

IDEA: ${input.title}
PITCH: ${input.pitch}
PROBLEM: ${input.problem}  
SOLUTION: ${input.solution}
CATEGORY: ${input.category}
STAGE: ${input.stage}

CROWD VALIDATION DATA (from PIQD platform):
- Validation Score: ${input.validationScore}/100
- Total Votes: ${input.totalVotes}
- "I'd Use This": ${useThisPct}%
- "Maybe": ${input.totalVotes > 0 ? Math.round((input.maybeCount / input.totalVotes) * 100) : 0}%
- "Not For Me": ${input.totalVotes > 0 ? Math.round((input.notForMeCount / input.totalVotes) * 100) : 0}%
- Total Comments: ${input.totalComments}

COMPETITOR ANALYSIS:
${JSON.stringify(competitorMarket.competitors.slice(0, 5), null, 2)}

MARKET DATA:
${JSON.stringify(competitorMarket.market, null, 2)}

REDDIT SENTIMENT:
- Sentiment: ${redditData.sentiment} (Score: ${redditData.sentimentScore}/100)
- Posts Found: ${redditData.totalPostsFound}
- Pain Points: ${redditData.commonPainPoints.join(", ")}
- Summary: ${redditData.summary}

WEB ARTICLES FOUND:
${webResults.slice(0, 5).map(r => `- ${r.title} (${r.source})`).join("\n")}

Generate search demand analysis, news summary, and final verdict. Return this JSON:
{
  "searchData": {
    "primaryKeyword": "main search keyword for this idea",
    "relatedKeywords": [
      { "keyword": "...", "volume": "high|medium|low", "trend": "rising|stable|declining" }
    ],
    "trendDirection": "rising|stable|declining",
    "trendSummary": "1 sentence about search interest",
    "searchIntent": "What people searching for this actually want"
  },
  "newsData": {
    "articles": [
      {
        "title": "article title",
        "source": "publication name",
        "url": "url if known, or empty string",
        "date": "approximate date",
        "relevance": "why this matters for the idea"
      }
    ],
    "existingSolutions": [
      {
        "name": "solution name",
        "type": "app|website|service|product",
        "description": "what it does",
        "url": "url if known",
        "limitation": "why user's idea is still needed despite this"
      }
    ],
    "industryNews": "Summary of recent industry developments"
  },
  "verdict": {
    "overallSignal": "strong|promising|moderate|weak|risky",
    "overallScore": <0-100>,
    "crowdVsMarket": "aligned|crowd_higher|market_higher|divergent",
    "summary": "2-3 sentence final verdict combining ALL data",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "risks": ["risk 1", "risk 2", "risk 3"],
    "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "shouldBuild": "definitely|probably|maybe|reconsider",
    "keyInsight": "One powerful insight that the founder MUST know"
  }
}

CROSS-VALIDATION RULES:
- If crowd says YES (>70% use this) AND Reddit/market confirm demand → "strong"
- If crowd says YES but no market evidence → "moderate" (might be friend votes)
- If crowd says NO but market shows demand → "moderate" (bad pitch, good idea)
- If both crowd and market say NO → "weak" or "risky"
- The "crowdVsMarket" field should reflect this alignment
- Be HONEST. Do not sugarcoat. Founders need truth.
- "keyInsight" should be the ONE thing that changes the founder's perspective`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return JSON.parse(text)
  } catch (error) {
    console.error("Verdict generation failed:", error)
    return getDefaultVerdictOutput()
  }
}
```

Add default/fallback data functions:

TypeScript

```
function getDefaultMarketData(): MarketData {
  return {
    estimatedTAM: "Unable to estimate",
    estimatedSAM: "Unable to estimate",
    growthRate: "Unknown",
    marketMaturity: "unknown" as any,
    keyTrends: [],
    targetDemographic: "Not analyzed",
    geographicFocus: "India",
  }
}

function getDefaultRedditData(): RedditData {
  return {
    totalPostsFound: 0,
    sentiment: "neutral",
    sentimentScore: 0,
    topSubreddits: [],
    topPosts: [],
    commonPainPoints: [],
    commonPraises: [],
    summary: "No Reddit discussions found for this topic.",
  }
}

function getDefaultVerdictOutput() {
  return {
    searchData: {
      primaryKeyword: "",
      relatedKeywords: [],
      trendDirection: "stable" as const,
      trendSummary: "Unable to analyze search demand.",
      searchIntent: "",
    },
    newsData: {
      articles: [],
      existingSolutions: [],
      industryNews: "No recent news found.",
    },
    verdict: {
      overallSignal: "moderate" as const,
      overallScore: 50,
      crowdVsMarket: "aligned" as const,
      summary: "Research data was limited. Consider manual research to supplement.",
      strengths: [],
      risks: ["Limited data available for analysis"],
      recommendations: ["Conduct manual competitor research", "Validate with target users directly"],
      shouldBuild: "maybe" as const,
      keyInsight: "More data needed for a confident assessment.",
    },
  }
}
```

**VERIFY:**

- [ ]  File compiles without errors
- [ ]  All types are properly defined
- [ ]  All functions handle errors gracefully (never throw)
- [ ]  Gemini rate limiting is checked before each call
- [ ]  Default fallbacks exist for every section

---

### TASK-R005: Research Server Actions

text

```
TYPE: Create File
FILE: src/actions/research-actions.ts
DEPENDS ON: TASK-R004, existing auth-utils, prisma
```

"use server"

TypeScript

```
import { prisma } from "@/lib/prisma"
import { requireOnboarded, getCurrentUser } from "@/lib/auth-utils"
import { generateResearch, type ResearchInput } from "@/lib/research"
import { researchLimiter } from "@/lib/redis"
import { revalidatePath } from "next/cache"

export async function requestResearch(ideaId: string) {
  const user = await requireOnboarded()

  // Rate limit: 3 per day per user
  const { success: rateLimitOk } = await researchLimiter.limit(user.id)
  if (!rateLimitOk) {
    return { error: "You've used your 3 free research reports today. Try again tomorrow." }
  }

  // Check if research already exists and is fresh
  const existing = await prisma.ideaResearch.findUnique({
    where: { ideaId },
  })

  if (existing && existing.status === "COMPLETED" && existing.expiresAt > new Date()) {
    return { success: true, research: existing, cached: true }
  }

  if (existing && existing.status === "GENERATING") {
    return { error: "Research is already being generated. Please wait." }
  }

  // Fetch idea with all needed data
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, status: "ACTIVE" },
    select: {
      id: true, title: true, pitch: true, problem: true,
      solution: true, category: true, stage: true, tags: true,
      feedbackQuestion: true, validationScore: true,
      totalVotes: true, useThisCount: true, maybeCount: true,
      notForMeCount: true, totalComments: true, slug: true,
    },
  })

  if (!idea) return { error: "Idea not found" }

  // Create or update research record as GENERATING
  const researchRecord = await prisma.ideaResearch.upsert({
    where: { ideaId },
    create: {
      ideaId,
      requestedById: user.id,
      status: "GENERATING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      crowdDataSnapshot: {
        validationScore: idea.validationScore,
        totalVotes: idea.totalVotes,
        useThisPercent: idea.totalVotes > 0
          ? Math.round((idea.useThisCount / idea.totalVotes) * 100)
          : 0,
        maybePercent: idea.totalVotes > 0
          ? Math.round((idea.maybeCount / idea.totalVotes) * 100)
          : 0,
        notForMePercent: idea.totalVotes > 0
          ? Math.round((idea.notForMeCount / idea.totalVotes) * 100)
          : 0,
        totalComments: idea.totalComments,
      },
    },
    update: {
      status: "GENERATING",
      requestedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Generate research (this takes 15-45 seconds)
  try {
    const input: ResearchInput = {
      ideaId: idea.id,
      title: idea.title,
      pitch: idea.pitch,
      problem: idea.problem,
      solution: idea.solution,
      category: idea.category,
      stage: idea.stage,
      tags: idea.tags,
      feedbackQuestion: idea.feedbackQuestion,
      validationScore: idea.validationScore,
      totalVotes: idea.totalVotes,
      useThisCount: idea.useThisCount,
      maybeCount: idea.maybeCount,
      notForMeCount: idea.notForMeCount,
      totalComments: idea.totalComments,
    }

    const result = await generateResearch(input)

    // Save results
    const updated = await prisma.ideaResearch.update({
      where: { id: researchRecord.id },
      data: {
        status: "COMPLETED",
        competitors: result.competitors as any,
        competitorCount: result.competitors.length,
        marketData: result.marketData as any,
        redditData: result.redditData as any,
        searchData: result.searchData as any,
        newsData: result.newsData as any,
        verdict: result.verdict as any,
        generationTime: result.generationTime,
        dataSourcesUsed: result.dataSourcesUsed,
        generatedAt: new Date(),
      },
    })

    revalidatePath(`/idea/${idea.slug}`)
    return { success: true, research: updated, cached: false }
  } catch (error) {
    console.error("Research generation failed:", error)

    await prisma.ideaResearch.update({
      where: { id: researchRecord.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })

    return { error: "Research generation failed. Please try again." }
  }
}

export async function getResearch(ideaId: string) {
  const research = await prisma.ideaResearch.findUnique({
    where: { ideaId },
  })

  if (!research) return null
  if (research.status !== "COMPLETED") return { status: research.status }

  // Increment view count (fire and forget)
  prisma.ideaResearch.update({
    where: { id: research.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  return research
}

export async function regenerateResearch(ideaId: string) {
  const user = await requireOnboarded()

  // Verify the idea belongs to the user OR user is admin
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { founderId: true },
  })

  if (!idea) return { error: "Idea not found" }
  if (idea.founderId !== user.id && !user.isAdmin) {
    return { error: "Only the idea founder can regenerate research" }
  }

  // Delete existing and regenerate
  await prisma.ideaResearch.deleteMany({ where: { ideaId } })
  return requestResearch(ideaId)
}
```

---

### TASK-R006: Research API Route

text

```
TYPE: Create File
FILE: src/app/api/ideas/[id]/research/route.ts
DEPENDS ON: TASK-R005
```

TypeScript

```
import { NextRequest, NextResponse } from "next/server"
import { getResearch, requestResearch } from "@/actions/research-actions"
import { getCurrentUser } from "@/lib/auth-utils"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const research = await getResearch(id)
  return NextResponse.json({ research })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 })
  }

  const { id } = await params
  const result = await requestResearch(id)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
```

---

### TASK-R007: Research Hook (Client-Side)

text

```
TYPE: Create File
FILE: src/hooks/use-research.ts
```

TypeScript

```
"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface UseResearchOptions {
  ideaId: string
  onComplete?: () => void
}

export function useResearch({ ideaId, onComplete }: UseResearchOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState("")
  const [research, setResearch] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setProgress("Starting research...")

    try {
      // Start generation
      setProgress("Searching for competitors...")

      const res = await fetch(`/api/ideas/${ideaId}/research`, {
        method: "POST",
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        toast.error(data.error)
        return
      }

      if (data.cached) {
        setProgress("Found cached research!")
      } else {
        setProgress("Research complete!")
      }

      setResearch(data.research)
      toast.success("Research report ready!")
      onComplete?.()
    } catch (err) {
      const message = "Failed to generate research. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
      setProgress("")
    }
  }, [ideaId, onComplete])

  const fetchExisting = useCallback(async () => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/research`)
      const data = await res.json()
      if (data.research && data.research.status === "COMPLETED") {
        setResearch(data.research)
      }
      return data.research
    } catch {
      return null
    }
  }, [ideaId])

  return {
    generate,
    fetchExisting,
    isGenerating,
    progress,
    research,
    error,
    setResearch,
  }
}
```

---

### TASK-R008: Research UI Components

text

```
TYPE: Create Files (9 files)
DEPENDS ON: TASK-R007
```

Create all these components. Each is a "use client" component unless specified.

**File 1: src/components/research/research-trigger.tsx**

The button that starts research generation.

Props: `{ ideaId: string, existingResearch: any | null, isOwner: boolean }`

Behavior:

- If no existing research: show large CTA button "🔍 Research This Idea — Free"
    - Subtitle: "AI analyzes competitors, Reddit sentiment, market demand, and more"
    - On click: calls generate() from useResearch hook
- If research exists and is fresh: show "View Research" button
- If research exists but expired (>7 days): show "Refresh Research" button
- If generating: show progress spinner with progress text
- If user not logged in: button links to /login
- Show "3 free reports per day" note
- Loading animation: pulsing dots or spinning circle with stage text

**File 2: src/components/research/research-panel.tsx**

Main container for all research sections.

Props: `{ research: IdeaResearch, idea: IdeaWithDetails }`

Layout:

- Tabs or vertical sections (recommend vertical for mobile):
    1. 🎯 Verdict (always shown first — the summary)
    2. 🏢 Competitors
    3. 💬 Reddit Pulse
    4. 📈 Search Demand
    5. 🏪 Market Context
    6. 📰 News & Solutions
- Each section is a collapsible card (open by default)
- Data sources badges at top: "Based on: 🤖 AI Analysis, 💬 Reddit, 📈 Google Trends, 🔍 Web Search, 👥 PIQD Crowd"
- "Generated X days ago" timestamp
- "Regenerate" button (if owner)
- Disclaimer: "AI-generated research. Verify independently before making decisions."

**File 3: src/components/research/verdict-section.tsx**

The cross-validation verdict — most important section.

Props: `{ verdict: VerdictData, crowdData: CrowdDataSnapshot }`

Layout:

- Overall signal badge (large, colored): "🟢 Strong Signal"
- Research score: number 0-100 (use ScoreDisplay component, different color scheme)
- Crowd vs Market alignment indicator:
    - "✅ Crowd and market data are aligned" (green)
    - "⚠️ Crowd interest is higher than market evidence" (amber)
    - "💡 Market demand exists but crowd score is low" (blue)
    - "🔴 Both crowd and market signals are weak" (red)
- Summary paragraph (bold, prominent)
- Key Insight box (highlighted, border-left-4)
- Should Build indicator: "🚀 Definitely" / "👍 Probably" / "🤔 Maybe" / "⏸️ Reconsider"
- Three columns (stack on mobile):
    - Strengths (green bullets)
    - Risks (red bullets)
    - Recommendations (blue bullets)

**File 4: src/components/research/competitor-section.tsx**

Props: `{ competitors: CompetitorData[], competitorCount: number }`

Layout:

- Header: "🏢 Competitors ({count} found)"
- If 0 competitors: "No direct competitors found — this could be a blue ocean opportunity! 🌊"
- Grid of competitor cards (1 col mobile, 2 col desktop):  
    Each card:
    - Company name (bold) + status badge (Active 🟢 / Failed 🔴 / Acquired 🟡)
    - Description (1-2 lines)
    - Similarity badge: High (red outline) / Medium (amber) / Low (green)
    - Funding stage if known
    - "How you're different:" differentiator text (italic)
    - Link to URL if available (external link icon)

**File 5: src/components/research/reddit-section.tsx**

Props: `{ redditData: RedditData }`

Layout:

- Header: "💬 Reddit Pulse"
- If no posts: "No Reddit discussions found about this topic."
- Sentiment indicator: large emoji + label + score bar (-100 to 100)
- Top subreddits as pills/badges
- Pain points list (🔴 bullets)
- Praises list (🟢 bullets)
- Summary paragraph
- Top posts list:  
    Each post:
    - Title (linked to Reddit, external)
    - Subreddit badge
    - Upvotes + comments count
    - Key insight (italic)
    - Sentiment indicator (small colored dot)

**File 6: src/components/research/search-demand.tsx**

Props: `{ searchData: SearchDemandData, ideaTitle: string }`

Layout:

- Header: "📈 Search Demand"
- Trend direction indicator: "📈 Rising" / "➡️ Stable" / "📉 Declining"
- Primary keyword display
- Trend summary text
- Google Trends embed (iframe):
    
    text
    
    ```
    <iframe 
      src={getGoogleTrendsEmbedUrl(searchData.primaryKeyword)} 
      width="100%" 
      height="300"
      frameBorder="0"
    />
    ```
    
    (Note: Google Trends embeds can be flaky — show fallback if iframe fails)
- Related keywords table:
    - Keyword | Volume (🟢High/🟡Med/🔴Low) | Trend (↑/→/↓)
- Search intent explanation

**File 7: src/components/research/market-section.tsx**

Props: `{ marketData: MarketData }`

Layout:

- Header: "🏪 Market Context"
- Market size cards (horizontal scroll on mobile):
    - TAM: [value] (Total Addressable Market)
    - SAM: [value] (Serviceable Market)
- Growth rate display
- Market maturity badge: Nascent 🌱 / Growing 📈 / Mature 🏛️ / Declining 📉
- Key trends (numbered list)
- Target demographic description
- Geographic focus

**File 8: src/components/research/news-section.tsx**

Props: `{ newsData: NewsData }`

Layout:

- Header: "📰 News & Existing Solutions"
- Industry news summary paragraph
- Articles list (if any):  
    Each: title (linked), source, date, relevance note
- Existing solutions list:  
    Each: name + type badge + description + limitation  
    "Why your idea is still needed:" in green text

**File 9: src/components/research/research-skeleton.tsx**

Loading skeleton shown while research generates.

- Animated skeleton blocks matching each section layout
- Pulsing dots with rotating stage messages:  
    "Searching for competitors..."  
    "Analyzing Reddit discussions..."  
    "Checking search demand..."  
    "Evaluating market context..."  
    "Generating AI verdict..."
- Progress bar (indeterminate)
- "This usually takes 30-60 seconds"

---

### TASK-R009: Integrate Research into Idea Detail Page

text

```
TYPE: Modify File
FILE: src/app/(public)/idea/[slug]/page.tsx
ACTION: Add research section/tab
DEPENDS ON: TASK-R005, TASK-R008
```

Changes to make:

1. **Import new components:**

TypeScript

```
import { getResearch } from "@/actions/research-actions"
import { ResearchPanel } from "@/components/research/research-panel"
import { ResearchTrigger } from "@/components/research/research-trigger"
```

2. **Fetch research data in the server component:**

TypeScript

```
const research = await getResearch(idea.id)
```

3. **Add research section below comments (or as a tab):**

Option A — Vertical section (recommended for V1):

React

```
{/* After comments section */}
<hr className="my-8" />

<section id="research">
  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
    🔬 AI Research
    <Badge variant="secondary" className="text-xs">Beta</Badge>
  </h2>
  
  {research && research.status === "COMPLETED" ? (
    <ResearchPanel research={research} idea={idea} />
  ) : (
    <ResearchTrigger
      ideaId={idea.id}
      existingResearch={research}
      isOwner={user?.id === idea.founderId}
    />
  )}
</section>
```

Option B — Tabs (better UX, more work):

React

```
{/* Replace the single content flow with tabs */}
<Tabs defaultValue="validation">
  <TabsList>
    <TabsTrigger value="validation">🗳️ Validation</TabsTrigger>
    <TabsTrigger value="research">🔬 Research</TabsTrigger>
    <TabsTrigger value="comments">💬 Comments ({idea.totalComments})</TabsTrigger>
  </TabsList>
  
  <TabsContent value="validation">
    {/* Existing vote buttons + breakdown */}
  </TabsContent>
  
  <TabsContent value="research">
    {/* Research panel or trigger */}
  </TabsContent>
  
  <TabsContent value="comments">
    {/* Existing comments section */}
  </TabsContent>
</Tabs>
```

**Recommendation: Start with Option A (vertical), upgrade to Option B later.**

4. **Add research to sidebar (desktop):**

React

```
{/* In the sidebar, after score display */}
{research?.status === "COMPLETED" && research.verdict && (
  <div className="border rounded-lg p-4">
    <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
      AI Research
    </h3>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-2xl">{RESEARCH_SIGNALS[research.verdict.overallSignal]?.emoji}</span>
      <span className={`font-medium ${RESEARCH_SIGNALS[research.verdict.overallSignal]?.color}`}>
        {RESEARCH_SIGNALS[research.verdict.overallSignal]?.label}
      </span>
    </div>
    <p className="text-sm text-gray-600">{research.verdict.keyInsight}</p>
    <a href="#research" className="text-sm text-blue-600 hover:underline mt-2 block">
      View full research →
    </a>
  </div>
)}
```

---

### TASK-R010: Integrate Research into Founder Dashboard

text

```
TYPE: Modify File
FILE: src/app/(dashboard)/dashboard/ideas/[id]/page.tsx
ACTION: Add research section to analytics page
```

Add a new section to the idea analytics page:

React

```
{/* After existing analytics sections */}
<section className="mt-8">
  <h2 className="text-lg font-semibold mb-4">🔬 AI Research</h2>
  
  {research?.status === "COMPLETED" ? (
    <div className="space-y-4">
      {/* Compact verdict summary */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Research Signal</span>
          <Badge>{research.verdict.overallSignal}</Badge>
        </div>
        <p className="text-sm text-gray-600">{research.verdict.summary}</p>
        <p className="text-sm font-medium mt-2">
          💡 {research.verdict.keyInsight}
        </p>
      </div>
      
      {/* Competitor count */}
      <div className="flex gap-4">
        <div className="border rounded-lg p-4 flex-1">
          <div className="text-2xl font-bold">{research.competitorCount}</div>
          <div className="text-sm text-gray-500">Competitors Found</div>
        </div>
        <div className="border rounded-lg p-4 flex-1">
          <div className="text-2xl font-bold">{research.redditData?.totalPostsFound || 0}</div>
          <div className="text-sm text-gray-500">Reddit Discussions</div>
        </div>
      </div>
      
      {/* Link to full research on public page */}
      <a href={`/idea/${idea.slug}#research`} className="text-blue-600 hover:underline text-sm">
        View full research report →
      </a>
      
      {/* Regenerate button */}
      <Button variant="outline" size="sm" onClick={regenerate}>
        🔄 Regenerate Research
      </Button>
    </div>
  ) : (
    <ResearchTrigger ideaId={idea.id} existingResearch={research} isOwner={true} />
  )}
</section>
```

---

### TASK-R011: Add Optional Env Variables

text

```
TYPE: Modify File
FILE: .env.example
ACTION: Append new optional variables
```

env

```
# ── Web Search (OPTIONAL — research works without these, just less data) ──
# Option 1: Serper.dev (2,500 free searches/month)
SERPER_API_KEY=""

# Option 2: Google Custom Search (100 free/day)
GOOGLE_SEARCH_API_KEY=""
GOOGLE_SEARCH_CX=""
```

---

### TASK-R012: Update Prisma and Deploy

text

```
TYPE: Terminal Commands
```

Bash

```
# Generate new Prisma client with IdeaResearch model
$ npx prisma generate

# Push schema changes to Supabase
$ npx prisma db push

# Test locally
$ npm run dev

# Commit and deploy
$ git add .
$ git commit -m "feat: AI-powered idea research"
$ git push origin main
```

---

## TASK EXECUTION ORDER

text

```
TASK-R001 (constants)          →  5 minutes
TASK-R002 (redis limiters)     →  5 minutes
TASK-R003 (search providers)   →  1-2 hours
TASK-R004 (research engine)    →  3-4 hours ← HARDEST TASK
TASK-R005 (server actions)     →  1-2 hours
TASK-R006 (API route)          →  15 minutes
TASK-R007 (client hook)        →  30 minutes
TASK-R008 (9 UI components)    →  4-6 hours
TASK-R009 (integrate detail)   →  1 hour
TASK-R010 (integrate dashboard)→  30 minutes
TASK-R011 (env variables)      →  5 minutes
TASK-R012 (deploy)             →  30 minutes

TOTAL: ~12-17 hours of work
CALENDAR: 2-3 focused days
```

---

## VERIFICATION CHECKLIST

text

```
FUNCTIONALITY:
├── [ ] "Research This Idea" button appears on idea detail page
├── [ ] Clicking button starts generation (shows loading state)
├── [ ] Research completes in <60 seconds
├── [ ] All 6 sections render with data
├── [ ] Competitor cards show real companies
├── [ ] Reddit posts link to actual Reddit URLs
├── [ ] Google Trends embed loads (or graceful fallback)
├── [ ] Verdict shows cross-validation analysis
├── [ ] Research is cached (second view is instant)
├── [ ] Research appears in founder dashboard
├── [ ] Rate limiting works (4th report in a day is blocked)
├── [ ] Works without SERPER_API_KEY (graceful degradation)
├── [ ] Works when Gemini is rate limited (fallback data)
├── [ ] Mobile layout works for all sections

EDGE CASES:
├── [ ] Very new idea (0 votes) → research still works
├── [ ] Very niche idea → "limited data" shown gracefully
├── [ ] Gemini returns malformed JSON → fallback data shown
├── [ ] Reddit returns 0 results → "No discussions found"
├── [ ] User not logged in → redirected to login on click
├── [ ] Non-owner viewing → can see research but not regenerate
└── [ ] Research already generating → shows "please wait"

PERFORMANCE:
├── [ ] Page doesn't slow down when research exists
├── [ ] Research generation doesn't block page rendering
├── [ ] Cached research loads in <500ms
├── [ ] Images/embeds lazy load
└── [ ] Total page weight doesn't increase significantly
```

---


```
V2 
├── PDF export of research report
├── Automated weekly research refresh
├── Research score factored into validation score
├── Research comparison between similar ideas
└── "Research this for me" request from investors

V3
├── Real-time competitor monitoring
├── App store analysis
├── Patent landscape search
├── Funding round tracking
├── Custom research queries
├── Research API for third parties
└── White-label research reports
```