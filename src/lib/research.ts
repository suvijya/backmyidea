// src/lib/research.ts

import { GoogleGenerativeAI } from "@google/generative-ai"
import { searchWeb, searchXPosts, searchForumSources, searchRedditTargeted, searchReddit, getRedditThreadContext, SearchResult, RedditPost, getRealGoogleTrends, GoogleTrendsResult } from "@/lib/search-providers"
import { scrapeUrl } from "@/lib/scraper"
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
  researchDepth?: "fast" | "deep"
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
  sourceStats?: {
    discovered: number
    scraped: number
    scrapeAttempted: number
    scrapeSucceeded: number
    scrapeFailed: number
    scrapeSkipped: number
    reddit: number
    news: number
    xPosts: number
    forums: number
    failureHosts: Array<{ host: string; count: number }>
  }
  sourceCitations?: {
    market: string[]
    search: string[]
    reddit: string[]
    competitors: string[]
    news: string[]
  }
}

interface IdeaIntent {
  problemDomain: string
  customerProfile: string
  includeKeywords: string[]
  excludeKeywords: string[]
  coreSearchPhrases: string[]
}

export type ResearchProgressEvent =
  | { type: "progress"; message: string }
  | {
      type: "source"
      url: string
      status: "queued" | "scraping" | "done" | "failed"
      chars?: number
      channel?: "reddit" | "news" | "web" | "x" | "forum"
      relevance?: number
      error?: string
    }

export interface CompetitorData {
  name: string
  description: string
  url?: string
  status: "active" | "failed" | "acquired" | "unknown"
  fundingStage?: string
  similarity: "high" | "medium" | "low"
  differentiator: string
}

export interface MarketData {
  estimatedTAM: string
  estimatedSAM: string
  growthRate: string
  marketMaturity: "nascent" | "growing" | "mature" | "declining"
  keyTrends: string[]
  targetDemographic: string
  geographicFocus: string
  sourceSignals?: {
    newsCount: number
    scrapedCount: number
    scrapeAttempted?: number
    scrapeFailed?: number
    xCount: number
    forumCount?: number
    confidence: "high" | "medium" | "low"
  }
}

export interface RedditData {
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

export interface SearchDemandData {
  primaryKeyword: string
  relatedKeywords: Array<{
    keyword: string
    volume: "high" | "medium" | "low"
    trend: "rising" | "stable" | "declining"
  }>
  trendDirection: "rising" | "stable" | "declining"
  trendSummary: string
  searchIntent: string
  trendSeries?: Array<{ label: string; value: number }>
}

export interface NewsData {
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

export interface VerdictData {
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

/**
 * Generate complete research for an idea.
 * This is the main orchestrator function.
 */
export async function generateResearch(
  input: ResearchInput,
  onProgress?: (event: ResearchProgressEvent) => void
): Promise<ResearchOutput> {
  const startTime = Date.now()
  const dataSourcesUsed: string[] = ["gemini", "piqd_crowd"]
  
  const emitProgress = (message: string) => onProgress?.({ type: "progress", message })
  const emitSource = (
    url: string,
    status: "queued" | "scraping" | "done" | "failed",
    chars?: number,
    channel?: "reddit" | "news" | "web" | "x" | "forum",
    relevance?: number,
    error?: string
  ) => onProgress?.({ type: "source", url, status, chars, channel, relevance, error })
  const depth = input.researchDepth || "deep"
  const config = depth === "fast"
    ? {
        redditSearchLimit: 40,
        redditThreadLimit: 14,
        redditFinalLimit: 24,
        queryResultCount: 6,
        scrapeLimit: 30,
        redditScrapeTarget: 10,
        otherScrapeTarget: 20,
        xSearchLimit: 8,
        forumSearchLimit: 16,
      }
    : {
        redditSearchLimit: 80,
        redditThreadLimit: 35,
        redditFinalLimit: 55,
        queryResultCount: 14,
        scrapeLimit: 150,
        redditScrapeTarget: 50,
        otherScrapeTarget: 100,
        xSearchLimit: 40,
        forumSearchLimit: 40,
      }

  emitProgress(`Research mode: ${depth.toUpperCase()}`)

  emitProgress("Analyzing idea intent and semantic scope...")
  const intent = await deriveIdeaIntent(input)
  emitProgress(`Intent identified: ${intent.problemDomain}`)

  emitProgress("Formulating search queries...")
  const searchQueries = buildSearchQueries(input, intent)

  emitProgress("Searching Reddit posts...")
  emitProgress(`Query: ${searchQueries.reddit}`)
  let reddit = await searchRedditTargeted(searchQueries.reddit, undefined, config.redditSearchLimit)
  if (reddit.length === 0) {
    emitProgress("No targeted Reddit matches. Expanding to global Reddit search...")
    reddit = await searchReddit(searchQueries.reddit, config.redditSearchLimit)
  }
  emitProgress(`Found ${reddit.length} Reddit posts`)
  if (reddit.length === 0) {
    emitProgress("Reddit direct API appears blocked in this environment. Using search-indexed Reddit fallback.")
  }

  emitProgress("Crawling top Reddit threads for comment-level context...")
  const redditContexts: Array<{ url: string; body: string; topComments: string[] }> = []
  for (const post of reddit.slice(0, config.redditThreadLimit)) {
    emitProgress(`Crawling Reddit thread: ${post.url}`)
    emitSource(post.url, "scraping", undefined, "reddit")
    const thread = await getRedditThreadContext(post.url)
    if (thread) {
      redditContexts.push(thread)
      emitProgress(`Extracted ${thread.topComments.length} comments from: ${post.url}`)
      emitSource(post.url, "done", undefined, "reddit")
    } else {
      emitProgress(`Could not crawl Reddit thread: ${post.url}`)
      emitSource(post.url, "failed", undefined, "reddit")
    }
  }

  const enrichedReddit = reddit.map((post) => {
    const match = redditContexts.find((ctx) => ctx.url === post.url)
    if (!match) return post

    const commentsSummary = match.topComments.length > 0
      ? `Top comments: ${match.topComments.map((c) => `- ${c}`).join(" ")}`
      : ""

    const enrichedText = [
      post.selftext || "",
      match.body ? `Thread body: ${match.body}` : "",
      commentsSummary,
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 6000)

    return {
      ...post,
      selftext: enrichedText,
    }
  })

  const allowSubreddits = [
    "r/startups",
    "r/entrepreneur",
    "r/productivity",
    "r/saas",
    "r/jira",
    "r/asana",
    "r/remotework",
    "r/projectmanagement",
    "r/smallbusiness",
    "r/technology",
    "r/artificial",
    "r/chatgpt",
    "r/askmanagers",
  ]
  const filteredReddit = enrichedReddit.filter((post) => {
    const sub = post.subreddit.toLowerCase()
    const topicText = `${post.title} ${post.selftext || ""}`.toLowerCase()
    const topicRelevant = intent.includeKeywords.some((kw) => topicText.includes(kw.toLowerCase()))
    const subAllowed = allowSubreddits.some((s) => sub.includes(s.replace("r/", "")))
    const clearIrrelevant = intent.excludeKeywords.some((kw) => topicText.includes(kw.toLowerCase()))
    return (topicRelevant || subAllowed) && !clearIrrelevant
  })
  const minFilteredThreshold = Math.max(6, Math.floor(config.redditFinalLimit * 0.4))
  const finalReddit = filteredReddit.length >= minFilteredThreshold
    ? filteredReddit.slice(0, config.redditFinalLimit)
    : enrichedReddit.slice(0, config.redditFinalLimit)
  emitProgress(`Reddit posts after relevance filtering: ${finalReddit.length}`)

  emitProgress("Building broad source universe (target: 40-100 sources)...")
  emitProgress("Searching the web for competitors, news, and Reddit discussions...")
  const competitorQueries = [
    searchQueries.competitors,
    searchQueries.competitorDirect,
    `${intent.problemDomain} startups India landscape`,
    `${intent.problemDomain} alternatives app platform India`,
    ...intent.coreSearchPhrases.slice(0, 2).map((phrase) => `${phrase} tools competitors`),
  ]
  const newsQueries = [
    searchQueries.news,
    `${intent.problemDomain} India funding news`,
    `${intent.problemDomain} India market trend report`,
    `${intent.problemDomain} India enterprise adoption`,
    ...intent.coreSearchPhrases.slice(0, 2).map((phrase) => `${phrase} market India`),
  ]

  emitProgress("Searching X/Twitter discussions...")
  const xPosts = await searchXPosts(`${intent.problemDomain} ${intent.coreSearchPhrases.join(" ")}`, config.xSearchLimit)
  emitProgress(`Found ${xPosts.length} X/Twitter references`)

  emitProgress("Searching public forums and communities...")
  const forumSources = await searchForumSources(`${intent.problemDomain} ${intent.coreSearchPhrases.join(" ")}`, config.forumSearchLimit)
  emitProgress(`Found ${forumSources.length} public forum sources`)

  const competitorPool: SearchResult[] = []
  for (const q of competitorQueries) {
    emitProgress(`Searching competitors: ${q}`)
    const results = await searchWeb(q, config.queryResultCount)
    competitorPool.push(...results)
    emitProgress(`Found ${results.length} results for query`)
  }

  const newsPool: SearchResult[] = []
  for (const q of newsQueries) {
    emitProgress(`Searching category news: ${q}`)
    const results = await searchWeb(q, config.queryResultCount)
    newsPool.push(...results)
    emitProgress(`Found ${results.length} category news results`)
  }

  const dedupeByUrl = (items: SearchResult[]) => {
    const seen = new Set<string>()
    const out: SearchResult[] = []
    for (const item of items) {
      if (!item.url || seen.has(item.url)) continue
      seen.add(item.url)
      out.push(item)
    }
    return out
  }

  const rankedCompetitorPool = dedupeByUrl(competitorPool)
    .map((item) => ({ item, score: scoreSearchRelevance(item, intent) }))
    .sort((a, b) => b.score - a.score)
  const webRes = rankedCompetitorPool.slice(0, 40).map((x) => x.item)
  const compRes = rankedCompetitorPool
    .filter(({ item }) => /competitor|alternative|vs|compare|startup/i.test(`${item.title} ${item.snippet}`))
    .slice(0, 25)
    .map((x) => x.item)

  emitProgress(`Fetching Google Trends for keyword: ${searchQueries.trends}`)
  const trends = await getRealGoogleTrends(searchQueries.trends)
  emitProgress(`Google Trends direction: ${trends.trendDirection}`)

  const newsRes = dedupeByUrl(newsPool)
    .map((item) => ({ item, score: scoreSearchRelevance(item, intent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 35)
    .map((x) => x.item)
  emitProgress(`Compiled ${newsRes.length} category-news sources`)
  emitProgress(`Total source universe size: ${reddit.length + webRes.length + newsRes.length + xPosts.length + forumSources.length}`)

  
  if (finalReddit.length > 0) dataSourcesUsed.push("reddit")
  if (webRes.length > 0 || compRes.length > 0 || newsRes.length > 0) dataSourcesUsed.push("web_search")
  dataSourcesUsed.push("google_trends")

  // --- Deep Scraping Step ---
  emitProgress("Selecting highest-quality sources for deep crawling...")

  const candidates: Array<{ url: string; channel: "reddit" | "news" | "web" | "x" | "forum"; relevance: number }> = [
    ...finalReddit.map((p) => ({
      url: p.url,
      channel: "reddit" as const,
      relevance: scoreTextRelevance(`${p.title} ${p.selftext || ""}`, intent),
    })),
    ...newsRes.map((r) => ({
      url: r.url,
      channel: "news" as const,
      relevance: scoreSearchRelevance(r, intent),
    })),
    ...webRes.map((r) => ({
      url: r.url,
      channel: "web" as const,
      relevance: scoreSearchRelevance(r, intent),
    })),
    ...xPosts.map((r) => ({
      url: r.url,
      channel: "x" as const,
      relevance: scoreSearchRelevance(r, intent),
    })),
    ...forumSources.map((r) => ({
      url: r.url,
      channel: "forum" as const,
      relevance: scoreSearchRelevance(r, intent),
    })),
  ].map((candidate) => {
    const resolvedChannel = resolveSourceChannel(candidate.url, candidate.channel)
    return {
      ...candidate,
      channel: resolvedChannel,
      url: normalizeSourceUrlForScrape(candidate.url, resolvedChannel),
    }
  })

  const dedupedCandidates: Array<{ url: string; channel: "reddit" | "news" | "web" | "x" | "forum"; relevance: number }> = []
  const seenCandidateUrls = new Set<string>()
  for (const candidate of candidates.sort((a, b) => b.relevance - a.relevance)) {
    if (!candidate.url || seenCandidateUrls.has(candidate.url)) continue
    seenCandidateUrls.add(candidate.url)
    dedupedCandidates.push(candidate)
  }

  const scrapeEligible = dedupedCandidates.filter((candidate) => isScrapeEligible(candidate.url, candidate.channel))
  const skippedCount = dedupedCandidates.length - scrapeEligible.length
  if (skippedCount > 0) {
    emitProgress(`Skipped ${skippedCount} low-yield or blocked sources before crawl`)
  }

  const redditEligible = scrapeEligible.filter((candidate) => candidate.channel === "reddit")
  const otherEligible = scrapeEligible.filter((candidate) => candidate.channel !== "reddit")

  // NOTE: We enforce a channel mix target so deep mode remains Reddit-heavy while still covering broad non-Reddit sources.
  const selectedReddit = redditEligible.slice(0, Math.min(config.redditScrapeTarget, redditEligible.length))
  const selectedOthers = otherEligible.slice(0, Math.min(config.otherScrapeTarget, otherEligible.length))
  const selectedSet = new Set<string>([...selectedReddit, ...selectedOthers].map((s) => s.url))
  const remaining = scrapeEligible.filter((candidate) => !selectedSet.has(candidate.url))
  const scrapeTarget = Math.min(config.scrapeLimit, scrapeEligible.length)
  const scrapeCandidates = [...selectedReddit, ...selectedOthers, ...remaining].slice(0, scrapeTarget)

  emitProgress(`Source mix target -> reddit: ${selectedReddit.length}, non-reddit: ${selectedOthers.length}`)
  scrapeCandidates.forEach((s) => emitSource(s.url, "queued", undefined, s.channel, s.relevance))
  emitProgress(`Queued ${scrapeCandidates.length} sources for crawling in ${depth.toUpperCase()} mode`)

  // Scrape concurrently with bounded workers
  const uniqueUrls = scrapeCandidates.map((s) => s.url)
  let scrapedContext = ""
  let scrapeAttempted = 0
  let scrapeSucceeded = 0
  let scrapeFailed = 0
  let failureHosts: Array<{ host: string; count: number }> = []
  if (uniqueUrls.length > 0) {
    const scraped: Array<{ success: boolean; url: string; markdown?: string; error?: string }> = []

    const channelByUrl = new Map(scrapeCandidates.map((s) => [s.url, s.channel]))
    const relevanceByUrl = new Map(scrapeCandidates.map((s) => [s.url, s.relevance]))

    const workerCount = depth === "deep" ? 6 : 4
    let cursor = 0
    const workers = Array.from({ length: workerCount }, async () => {
      while (cursor < uniqueUrls.length) {
        const idx = cursor
        cursor += 1
        const url = uniqueUrls[idx]
        const channel = channelByUrl.get(url) || "web"
        const relevance = relevanceByUrl.get(url)

        emitProgress(`Scraping source (${idx + 1}/${uniqueUrls.length}): ${url}`)
        emitSource(url, "scraping", undefined, channel, relevance)

        const result = await scrapeSource(url, channel)
        scraped.push(result)
        if (result.success) {
          emitProgress(`Scraped successfully: ${url}`)
          emitProgress(`Captured ${(result.markdown || "").length} characters from ${url}`)
          emitSource(url, "done", (result.markdown || "").length, channel, relevance)
        } else {
          emitProgress(`Scrape failed: ${url} (${result.error || "unknown"})`)
          emitSource(url, "failed", undefined, channel, relevance, result.error)
        }
      }
    })
    await Promise.all(workers)

    const successfulScrapes = scraped.filter(s => s.success && s.markdown)
    const failedScrapes = scraped.filter((s) => !s.success)
    const failureHostsMap = new Map<string, number>()
    for (const fail of failedScrapes) {
      const host = getHostFromUrl(fail.url)
      failureHostsMap.set(host, (failureHostsMap.get(host) || 0) + 1)
    }
    failureHosts = Array.from(failureHostsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([host, count]) => ({ host, count }))

    scrapeAttempted = uniqueUrls.length
    scrapeSucceeded = successfulScrapes.length
    scrapeFailed = failedScrapes.length

    if (successfulScrapes.length > 0) {
      dataSourcesUsed.push("crawl4ai_deep_scrape")
      scrapedContext = successfulScrapes.map(s => `\n--- SOURCE: ${s.url} ---\n${s.markdown?.slice(0, 6000)}`).join("\n\n")
    }
  }

  // Call 1: Competitor + Market Analysis
  emitProgress("Analyzing market and top competitors...")
  const competitorMarketAnalysis = await analyzeCompetitorsAndMarket(input, compRes, webRes, newsRes, scrapedContext, intent)
  competitorMarketAnalysis.market.sourceSignals = {
    newsCount: newsRes.length,
    scrapedCount: scrapeSucceeded,
    scrapeAttempted,
    scrapeFailed,
    xCount: xPosts.length,
    forumCount: forumSources.length,
    confidence: newsRes.length > 15 && scrapeSucceeded > 8 ? "high" : newsRes.length > 7 ? "medium" : "low",
  }
  
  // Call 2: Reddit Sentiment Analysis  
  emitProgress("Analyzing Reddit sentiment and user pain points...")
  const redditAnalysis = await analyzeRedditSentiment(input, finalReddit, scrapedContext)
  
  // Call 3: Search Demand + News + Final Verdict
  emitProgress("Synthesizing search demand, news, and generating final verdict...")
  const verdictAnalysis = await generateVerdict(
    input,
    competitorMarketAnalysis,
    redditAnalysis,
    newsRes,
    trends,
    scrapedContext,
    searchQueries.trends,
    searchQueries.news,
    intent
  )
  
  emitProgress("Research complete!")
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
    sourceStats: {
      discovered: reddit.length + webRes.length + newsRes.length + xPosts.length + forumSources.length,
      scraped: scrapeSucceeded,
      scrapeAttempted,
      scrapeSucceeded,
      scrapeFailed,
      scrapeSkipped: skippedCount,
      reddit: finalReddit.length,
      news: newsRes.length,
      xPosts: xPosts.length,
      forums: forumSources.length,
      failureHosts,
    },
    sourceCitations: {
      market: newsRes.slice(0, 8).map((x) => x.url),
      search: newsRes.slice(0, 5).map((x) => x.url),
      reddit: finalReddit.slice(0, 8).map((x) => x.url),
      competitors: compRes.slice(0, 8).map((x) => x.url),
      news: newsRes.slice(0, 10).map((x) => x.url),
    },
  }
}

function scoreTextRelevance(text: string, intent: IdeaIntent): number {
  const normalized = text.toLowerCase()
  const includeHits = intent.includeKeywords.reduce((sum, kw) => (normalized.includes(kw.toLowerCase()) ? sum + 1 : sum), 0)
  const excludeHits = intent.excludeKeywords.reduce((sum, kw) => (normalized.includes(kw.toLowerCase()) ? sum + 1 : sum), 0)
  const base = 0.35 + includeHits * 0.08 - excludeHits * 0.22
  return Math.max(0, Math.min(1, Number(base.toFixed(2))))
}

function scoreSearchRelevance(item: SearchResult, intent: IdeaIntent): number {
  return scoreTextRelevance(`${item.title} ${item.snippet} ${item.url}`, intent)
}

function getHostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "unknown"
  }
}

function isRedditUrl(url: string): boolean {
  const host = getHostFromUrl(url)
  return host === "reddit.com" || host.endsWith(".reddit.com")
}

function toOldRedditUrl(url: string): string {
  return url
    .replace("https://www.reddit.com", "https://old.reddit.com")
    .replace("https://reddit.com", "https://old.reddit.com")
}

function toCanonicalRedditUrl(url: string): string {
  return url
    .replace("https://old.reddit.com", "https://www.reddit.com")
    .replace("https://reddit.com", "https://www.reddit.com")
}

function resolveSourceChannel(
  url: string,
  channel: "reddit" | "news" | "web" | "x" | "forum"
): "reddit" | "news" | "web" | "x" | "forum" {
  if (isRedditUrl(url)) {
    return "reddit"
  }
  return channel
}

function normalizeSourceUrlForScrape(
  url: string,
  channel: "reddit" | "news" | "web" | "x" | "forum"
): string {
  if (channel === "reddit" || isRedditUrl(url)) {
    return toOldRedditUrl(url)
  }
  return url
}

async function scrapeSource(
  url: string,
  channel: "reddit" | "news" | "web" | "x" | "forum"
): Promise<{ success: boolean; url: string; markdown?: string; error?: string }> {
  if (channel === "reddit" || isRedditUrl(url)) {
    const canonicalUrl = toCanonicalRedditUrl(url)
    const thread = await getRedditThreadContext(canonicalUrl)
    if (thread) {
      const combined = [
        thread.body ? `Thread body: ${thread.body}` : "",
        thread.topComments.length > 0 ? `Top comments:\n${thread.topComments.map((c) => `- ${c}`).join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim()

      if (combined.length >= 120) {
        return {
          success: true,
          url,
          markdown: combined.slice(0, 16000),
        }
      }
    }

    return await scrapeUrl(toOldRedditUrl(url))
  }

  return await scrapeUrl(url)
}

function isScrapeEligible(url: string, channel: "reddit" | "news" | "web" | "x" | "forum"): boolean {
  const host = getHostFromUrl(url)

  if (channel === "x") {
    return false
  }

  const blockedHosts = [
    "linkedin.com",
    "facebook.com",
    "instagram.com",
    "threads.net",
    "x.com",
    "twitter.com",
    "t.co",
    "youtube.com",
    "youtu.be",
    "webcache.googleusercontent.com",
    "accounts.google.com",
    "docs.google.com",
  ]

  if (blockedHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
    return false
  }

  const blockedExtensions = [
    ".pdf",
    ".zip",
    ".rar",
    ".7z",
    ".mp4",
    ".mov",
    ".mp3",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
  ]

  const lowerUrl = url.toLowerCase()
  if (blockedExtensions.some((ext) => lowerUrl.includes(ext))) {
    return false
  }

  return true
}

function buildSearchQueries(input: ResearchInput, intent: IdeaIntent) {
  const { title, category, tags, problem, solution } = input
  const tagString = tags.slice(0, 3).join(" ")
  
  const fullText = `${title} ${problem} ${solution}`
  const topicTokens = fullText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !["india", "startup", "using", "with", "that", "from", "this", "into"].includes(w))
  const dominantTopic = topicTokens[0] || "meeting assistant"
  const phraseCandidates = [
    /meeting assistant/i,
    /meeting transcription/i,
    /action items?/i,
    /jira/i,
    /asana/i,
    /transcrib/i,
  ]
  const phraseMatch = phraseCandidates
    .map((rx) => fullText.match(rx)?.[0])
    .find(Boolean)
  const semanticTopic = (intent.problemDomain || phraseMatch || dominantTopic).toLowerCase()

  // Use domain-specific keywords rather than broad category keyword only
  const categoryKeywords = category.toLowerCase().replace('_', ' ')
  const redditQuery = `${semanticTopic} meeting transcription action items jira asana b2b saas`.slice(0, 90).trim()
  const trendsKeyword = [semanticTopic, "meeting assistant", "meeting transcription", "ai note taker"]
    .map((k) => k.trim())
    .find((k) => k.split(" ").length <= 3 && k.length > 2 && !/\bzenith\b/i.test(k)) || "meeting assistant"
  
  return {
    reddit: redditQuery,
    competitors: `${semanticTopic} competitors alternatives ${intent.coreSearchPhrases.slice(0, 2).join(" ")}`,
    competitorDirect: `"${semanticTopic}" "${intent.customerProfile}" ${tagString}`,
    news: `${categoryKeywords} ${semanticTopic} b2b productivity india market trend funding`,
    trends: trendsKeyword,
  }
}

async function deriveIdeaIntent(input: ResearchInput): Promise<IdeaIntent> {
  const text = `${input.title} ${input.pitch} ${input.problem} ${input.solution}`.toLowerCase()

  const base: IdeaIntent = {
    problemDomain: input.category.toLowerCase().replace("_", " "),
    customerProfile: "business teams",
    includeKeywords: ["startup", "saas", "workflow", "automation"],
    excludeKeywords: ["nft", "crypto", "airdrop", "gaming", "politics", "riot", "hospital", "share price", "serial", "tv show"],
    coreSearchPhrases: [input.category.toLowerCase().replace("_", " "), "b2b saas"],
  }

  if (/(meeting|transcrib|action item|jira|asana|notes|notetaker|call summary)/.test(text)) {
    return {
      problemDomain: "ai meeting productivity automation",
      customerProfile: "product and engineering teams using project management tools",
      includeKeywords: [
        "meeting",
        "transcript",
        "transcription",
        "action items",
        "jira",
        "asana",
        "meeting notes",
        "meeting assistant",
        "productivity",
        "workflow",
        "project management",
      ],
      excludeKeywords: base.excludeKeywords,
      coreSearchPhrases: [
        "ai meeting assistant",
        "meeting transcription",
        "action item automation",
        "jira asana integration",
      ],
    }
  }

  return base
}

async function analyzeCompetitorsAndMarket(
  input: ResearchInput,
  competitorSearchResults: SearchResult[],
  webResults: SearchResult[],
  newsResults: SearchResult[],
  scrapedContext: string,
  intent: IdeaIntent
): Promise<{ competitors: CompetitorData[], market: MarketData }> {
  if (webResults.length === 0 && competitorSearchResults.length === 0) {
    return {
      competitors: getCompetitorFallback(input),
      market: getMarketFallback(input),
    }
  }

  const { success } = await aiLimiter.limit("research-competitor")
  if (!success) {
    return {
      competitors: getCompetitorFallback(input),
      market: getMarketFallback(input),
    }
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
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

NEWS SIGNALS (real-time fetched):
${newsResults.slice(0, 12).map(r => `- ${r.title}: ${r.snippet} (${r.source || "unknown"})`).join("\n")}

SEMANTIC INTENT:
- Domain: ${intent.problemDomain}
- ICP: ${intent.customerProfile}
- Keywords: ${intent.includeKeywords.join(", ")}

SCRAPED MARKET CONTEXT (news/article excerpts):
${scrapedContext || "No scraped context available"}

MANDATORY GROUNDING:
- Your TAM/SAM/growth must be grounded in the provided web/news/scraped signals.
- If confidence is low, still provide bounded estimates with a confidence note and reason.
- Never leave market fields empty.

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
- CRITICAL GIBBERISH CHECK: First, read the Title, Pitch, Problem, and Solution. If they appear to be random keyboard smashes (e.g., "twqeawsrefhghdsfxcgfcg", "asdfgh"), gibberish, test data, or completely lack any coherent business meaning, you MUST return an empty array [] for competitors, and set all market string fields to "N/A - Invalid Idea". Do NOT hallucinate competitors based solely on the Category.
- Find 3-8 competitors (real companies, not imaginary ones)
- If you're not sure a competitor exists, mark status as "unknown"
- Include both Indian and global competitors
- Include failed startups (valuable information)
- Market size should be specific to India where possible
- Be honest about market maturity — not everything is "growing"
- If this is a very niche idea, say the market is "nascent" with smaller numbers`

  try {
    const result = await model.generateContent(prompt)
    let text = result.response.text()
    
    if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`(json)?/, "").replace(/\`\`\`$/, "").trim()
    }
    
    try {
      return JSON.parse(text)
    } catch (parseError) {
      console.error("Failed to parse JSON. Raw output:", text);
      throw parseError;
    }
  } catch (error) {
    console.error("Competitor analysis failed:", error)
    return {
      competitors: getCompetitorFallback(input),
      market: getMarketFallback(input),
    }
  }
}

function getCompetitorFallback(input: ResearchInput): CompetitorData[] {
  const titleText = `${input.title} ${input.problem} ${input.solution}`.toLowerCase()
  const isMeetingTool = /(meeting|transcrib|action item|jira|asana|note taker)/.test(titleText)

  if (isMeetingTool) {
    return [
      {
        name: "Otter.ai",
        description: "AI meeting transcription and summaries for teams.",
        status: "active",
        fundingStage: "Series B",
        similarity: "high",
        differentiator: "Stronger Jira/Asana action assignment automation can be your edge.",
        url: "https://otter.ai",
      },
      {
        name: "Fireflies.ai",
        description: "AI notetaker for meetings with integrations and recap workflows.",
        status: "active",
        fundingStage: "Series A",
        similarity: "high",
        differentiator: "Position around workflow-native PM integrations and reliability.",
        url: "https://fireflies.ai",
      },
      {
        name: "Fathom",
        description: "AI meeting assistant with summaries and highlights.",
        status: "active",
        similarity: "medium",
        differentiator: "Differentiate by project task sync depth and team handoff automation.",
        url: "https://fathom.video",
      },
    ]
  }

  return []
}

function getMarketFallback(input: ResearchInput): MarketData {
  const text = `${input.title} ${input.problem} ${input.solution}`.toLowerCase()
  const isB2BSaaS = /(saas|team|workflow|automation|assistant|platform)/.test(text)
  if (isB2BSaaS) {
    return {
      estimatedTAM: "$15B - $25B (India + global accessible SaaS productivity market)",
      estimatedSAM: "$1B - $4B (SMB-mid market teams using PM tools)",
      growthRate: "20-35% CAGR",
      marketMaturity: "growing",
      keyTrends: [
        "AI copilot adoption in daily team workflows",
        "Meeting-to-task automation demand",
        "Tool consolidation in project collaboration stacks",
      ],
      targetDemographic: "PMs, founders, engineering and product teams",
      geographicFocus: "India-first with global remote-team expansion",
      sourceSignals: {
        newsCount: 0,
        scrapedCount: 0,
        xCount: 0,
        confidence: "medium",
      },
    }
  }

  return getDefaultMarketData()
}

async function analyzeRedditSentiment(
  input: ResearchInput,
  posts: RedditPost[],
  scrapedContext: string
): Promise<RedditData> {
  if (posts.length === 0 && !scrapedContext.includes("reddit.com")) {
    return getDefaultRedditData()
  }
  
  const { success } = await aiLimiter.limit("research-reddit")
  if (!success) {
    return deriveRedditDataFallback(posts)
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  })
  
  const postsContext = posts.slice(0, 10).map(p => 
    `[${p.subreddit}] "${p.title}" (${p.score} upvotes, ${p.numComments} comments)
     ${p.selftext ? `Content: ${p.selftext}` : ""}`
  ).join("\n\n")
  
  const prompt = `You are analyzing Reddit discussions related to a startup idea.

IDEA: ${input.title} — ${input.pitch}
PROBLEM IT SOLVES: ${input.problem}

REDDIT POSTS FOUND:
${postsContext}

DEEP SCRAPED WEB CONTEXT (Raw Markdown from top competitor/reddit/news sites):
${scrapedContext || "No deep scraped data available."}

Analyze the sentiment and extract insights heavily relying on the actual discussions above. Return this JSON:
{
  "totalPostsFound": ${posts.length},
  "sentiment": "positive|negative|mixed|neutral",
  "sentimentScore": <number between -100 to 100>,
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
    let text = result.response.text()
    
    if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`(json)?/, "").replace(/\`\`\`$/, "").trim()
    }
    
    const parsed = JSON.parse(text)
    
    // Ensure real URLs from our data if possible
    if (parsed.topPosts && Array.isArray(parsed.topPosts)) {
      parsed.topPosts = parsed.topPosts.map((p: any, i: number) => ({
        ...p,
        url: posts[i]?.url || p.url || `https://reddit.com/r/${p.subreddit}`,
        upvotes: posts[i]?.score || p.upvotes || 0,
        commentCount: posts[i]?.numComments || p.commentCount || 0,
      }))
    }
    
    return parsed
  } catch (error) {
    console.error("Reddit analysis failed:", error)
    return deriveRedditDataFallback(posts)
  }
}

async function generateVerdict(
  input: ResearchInput,
  competitorMarket: { competitors: CompetitorData[], market: MarketData },
  redditData: RedditData,
  newsResults: SearchResult[],
  realTrends: GoogleTrendsResult,
  scrapedContext: string,
  trendKeyword: string,
  newsQuery: string,
  intent: IdeaIntent
): Promise<{ searchData: SearchDemandData, newsData: NewsData, verdict: VerdictData }> {
  const { success } = await aiLimiter.limit("research-verdict")
  if (!success) return getVerdictFallbackOutput(input, newsResults, realTrends, trendKeyword)
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
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
${newsResults.slice(0, 5).map(r => `- ${r.title} (${r.source})`).join("\n")}

NEWS SEARCH QUERY USED (category/market-focused):
${newsQuery}

SEMANTIC INTENT CONTEXT:
- Domain: ${intent.problemDomain}
- Customer: ${intent.customerProfile}
- Keywords: ${intent.includeKeywords.join(", ")}

REAL GOOGLE TRENDS DATA:
- Trend Direction (last 12mo): ${realTrends.trendDirection}
- Top Related Queries: ${realTrends.relatedQueries.join(", ") || "None found. Generate realistic alternatives."}

DEEP SCRAPED WEB CONTEXT (Raw Markdown from top sites):
${scrapedContext || "No deep scraped data available."}

Generate search demand analysis, news summary, and final verdict. Return this JSON:
{
  "searchData": {
    "primaryKeyword": "main search keyword for this idea (must be exactly 1-3 words max to ensure Google Trends iframe loads properly)",
    "relatedKeywords": [
      { "keyword": "...", "volume": "high|medium|low", "trend": "rising|stable|declining" }
    ],
    "trendDirection": "${realTrends.trendDirection}",
    "trendSummary": "1 sentence about search interest based on the real google trends data provided",
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
- CRITICAL GIBBERISH CHECK: If the IDEA, PITCH, PROBLEM, or SOLUTION are random keyboard smashes (e.g., "twqeawsrefhghdsfxcgfcg"), gibberish, or completely incoherent: you MUST set overallSignal to "risky", overallScore to 0, summary to "The provided idea details appear to be invalid or incomplete. Please provide a clear, coherent description of your startup idea to generate meaningful research.", shouldBuild to "reconsider", and keyInsight to "Cannot analyze an undefined or gibberish idea."
- If crowd says YES (>70% use this) AND Reddit/market confirm demand → "strong"
- If crowd says YES but no market evidence → "moderate" (might be friend votes)
- If crowd says NO but market shows demand → "moderate" (bad pitch, good idea)
- If both crowd and market say NO → "weak" or "risky"
- The "crowdVsMarket" field should reflect this alignment
- Be HONEST. Do not sugarcoat. Founders need truth.
- "keyInsight" should be the ONE thing that changes the founder's perspective`

  try {
    const result = await model.generateContent(prompt)
    let text = result.response.text()
    
    // Fallback: sometimes Gemini wraps JSON in markdown block even with responseMimeType
    if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`(json)?/, "").replace(/\`\`\`$/, "").trim()
    }
    
    try {
      const parsed = JSON.parse(text)

      const fallbackPrimaryKeyword = trendKeyword.trim().split(" ").slice(0, 3).join(" ") || input.category.toLowerCase().replace("_", " ")
  const fallbackRelatedKeywords = realTrends.relatedQueries.slice(0, 6).map((q) => ({
        keyword: q,
        volume: "medium" as const,
        trend: realTrends.trendDirection,
      }))
      const sanitizedFallbackRelated = fallbackRelatedKeywords.filter((k) => !/(saas bahu|kyunki saas|serial|tv show|hospital|share price)/i.test(k.keyword))
      const fallbackArticles = newsResults.slice(0, 5).map((n) => ({
        title: n.title,
        source: n.source || "Unknown",
        url: n.url,
        date: n.date || "",
        relevance: "Recent coverage in this problem space",
      }))

      const defaultOutput = getDefaultVerdictOutput()

      return {
        searchData: {
          primaryKeyword: (parsed?.searchData?.primaryKeyword || fallbackPrimaryKeyword).toString().split(" ").slice(0, 3).join(" "),
          relatedKeywords: Array.isArray(parsed?.searchData?.relatedKeywords) && parsed.searchData.relatedKeywords.length > 0
            ? parsed.searchData.relatedKeywords.filter((k: { keyword: string }) => !/(saas bahu|kyunki saas|serial|tv show|hospital|share price)/i.test(k.keyword))
            : sanitizedFallbackRelated,
          trendDirection: parsed?.searchData?.trendDirection || realTrends.trendDirection,
          trendSummary: parsed?.searchData?.trendSummary || `Search interest appears ${realTrends.trendDirection} over the past 12 months in India.`,
          searchIntent: parsed?.searchData?.searchIntent || "Users are evaluating solutions for this problem and comparing available options.",
          trendSeries: realTrends.interestSeries,
        },
        newsData: {
          articles: Array.isArray(parsed?.newsData?.articles) && parsed.newsData.articles.length > 0
            ? parsed.newsData.articles
            : fallbackArticles,
          existingSolutions: Array.isArray(parsed?.newsData?.existingSolutions) ? parsed.newsData.existingSolutions : [],
          industryNews: parsed?.newsData?.industryNews || `Recent category coverage for ${input.category.toLowerCase().replace("_", " ")} indicates active movement in this segment.`,
        },
        verdict: parsed?.verdict || defaultOutput.verdict,
      }
    } catch (parseError) {
      console.error("Verdict parsing failed. Raw output:", text)
      throw parseError
    }
  } catch (error) {
    console.error("Verdict generation failed:", error)
    return getVerdictFallbackOutput(input, newsResults, realTrends, trendKeyword)
  }
}

function deriveRedditDataFallback(posts: RedditPost[]): RedditData {
  if (posts.length === 0) return getDefaultRedditData()

  const topPosts = posts
    .slice(0, 6)
    .map((post) => ({
      title: post.title,
      subreddit: post.subreddit,
      url: post.url,
      upvotes: post.score,
      commentCount: post.numComments,
      sentiment: "neutral",
      keyInsight: post.selftext?.slice(0, 180) || "Active user discussion indicates demand validation opportunities.",
    }))

  const weightedEngagement = posts.reduce((sum, post) => sum + (post.score * 2) + post.numComments, 0)
  const sentimentScore = Math.max(-100, Math.min(100, Math.round((weightedEngagement / Math.max(posts.length, 1)) / 10)))

  return {
    totalPostsFound: posts.length,
    sentiment: "mixed",
    sentimentScore,
    topSubreddits: Array.from(new Set(posts.map((p) => p.subreddit))).slice(0, 8),
    topPosts,
    commonPainPoints: [
      "Users mention friction in current alternatives",
      "Community expects better reliability and trust",
      "Pricing-value mismatch is a recurring concern",
    ],
    commonPraises: [
      "People actively discuss solutions in this space",
      "Users engage deeply with problem-specific threads",
    ],
    summary: `Fallback Reddit analysis from ${posts.length} discussions shows active demand with mixed user sentiment and strong engagement signals.`,
  }
}

function getVerdictFallbackOutput(
  input: ResearchInput,
  newsResults: SearchResult[],
  realTrends: GoogleTrendsResult,
  trendKeyword: string
) {
  const base = getDefaultVerdictOutput()
  const primaryKeyword = trendKeyword.trim().split(" ").slice(0, 3).join(" ") || input.category.toLowerCase().replace("_", " ")

  const relatedKeywords = realTrends.relatedQueries.slice(0, 8).map((query) => ({
    keyword: query,
    volume: "medium" as const,
    trend: realTrends.trendDirection,
  }))

  const articles = newsResults.slice(0, 8).map((item) => ({
    title: item.title,
    source: item.source || "Google News",
    url: item.url,
    date: item.date,
    relevance: item.snippet || "Recent category news tied to this startup problem space.",
  }))

  return {
    searchData: {
      primaryKeyword,
      relatedKeywords,
      trendDirection: realTrends.trendDirection,
      trendSummary: `Search demand in India appears ${realTrends.trendDirection} for ${primaryKeyword} over the last 12 months.`,
      searchIntent: "Users are actively evaluating options, comparing alternatives, and validating practical ROI.",
      trendSeries: realTrends.interestSeries,
    },
    newsData: {
      articles,
      existingSolutions: [],
      industryNews: `Category-level coverage for ${input.category.toLowerCase().replace("_", " ")} remains active with sustained startup and funding interest.`,
    },
    verdict: base.verdict,
  }
}

function getDefaultMarketData(): MarketData {
  return {
    estimatedTAM: "Unable to estimate",
    estimatedSAM: "Unable to estimate",
    growthRate: "Unknown",
    marketMaturity: "nascent",
    keyTrends: [],
    targetDemographic: "Not analyzed",
    geographicFocus: "India",
    sourceSignals: {
      newsCount: 0,
      scrapedCount: 0,
      xCount: 0,
      confidence: "low",
    },
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
      trendSeries: [],
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
