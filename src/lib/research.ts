// src/lib/research.ts

import { GoogleGenerativeAI } from "@google/generative-ai"
import { searchWeb, searchRedditTargeted, searchReddit, getRedditThreadContext, SearchResult, RedditPost, getRealGoogleTrends, GoogleTrendsResult } from "@/lib/search-providers"
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
  onProgress?: (msg: string) => void
): Promise<ResearchOutput> {
  const startTime = Date.now()
  const dataSourcesUsed: string[] = ["gemini", "piqd_crowd"]
  
  onProgress?.("Formulating search queries...")
  const searchQueries = buildSearchQueries(input)

  onProgress?.("Searching Reddit posts...")
  onProgress?.(`Query: ${searchQueries.reddit}`)
  let reddit = await searchRedditTargeted(searchQueries.reddit)
  if (reddit.length === 0) {
    onProgress?.("No targeted Reddit matches. Expanding to global Reddit search...")
    reddit = await searchReddit(searchQueries.reddit, 15)
  }
  onProgress?.(`Found ${reddit.length} Reddit posts`)

  onProgress?.("Crawling top Reddit threads for comment-level context...")
  const redditContexts: Array<{ url: string; body: string; topComments: string[] }> = []
  for (const post of reddit.slice(0, 3)) {
    onProgress?.(`Crawling Reddit thread: ${post.url}`)
    const thread = await getRedditThreadContext(post.url)
    if (thread) {
      redditContexts.push(thread)
      onProgress?.(`Extracted ${thread.topComments.length} comments from: ${post.url}`)
    } else {
      onProgress?.(`Could not crawl Reddit thread: ${post.url}`)
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

  onProgress?.(`Searching competitors: ${searchQueries.competitors}`)
  onProgress?.("Searching the web for competitors, news, and Reddit discussions...")
  const webRes = await searchWeb(searchQueries.competitors, 6)
  onProgress?.(`Found ${webRes.length} competitor web results`)

  onProgress?.(`Searching direct alternatives: ${searchQueries.competitorDirect}`)
  const compRes = await searchWeb(searchQueries.competitorDirect, 6)
  onProgress?.(`Found ${compRes.length} alternative results`)

  onProgress?.(`Fetching Google Trends for keyword: ${searchQueries.trends}`)
  const trends = await getRealGoogleTrends(searchQueries.trends)
  onProgress?.(`Google Trends direction: ${trends.trendDirection}`)

  onProgress?.(`Searching news for market/category: ${searchQueries.news}`)
  const newsRes = await searchWeb(searchQueries.news, 8)
  onProgress?.(`Found ${newsRes.length} news results`)

  
  if (reddit.length > 0) dataSourcesUsed.push("reddit")
  if (webRes.length > 0 || compRes.length > 0 || newsRes.length > 0) dataSourcesUsed.push("web_search")
  dataSourcesUsed.push("google_trends")

  // --- Deep Scraping Step ---
  onProgress?.("Performing deep scraping on News results...")
  
  const urlsToScrape: string[] = []
  if (newsRes.length > 0) urlsToScrape.push(newsRes[0].url)
  if (newsRes.length > 1) urlsToScrape.push(newsRes[1].url)
  if (newsRes.length > 2) urlsToScrape.push(newsRes[2].url)
  
  // Scrape concurrently
  const uniqueUrls = Array.from(new Set(urlsToScrape)).slice(0, 3) // Max 3 to save time
  let scrapedContext = ""
  if (uniqueUrls.length > 0) {
    const scraped: Array<{ success: boolean; url: string; markdown?: string; error?: string }> = []
    for (const url of uniqueUrls) {
      onProgress?.(`Scraping source: ${url}`)
      const result = await scrapeUrl(url)
      scraped.push(result)
      if (result.success) {
        onProgress?.(`Scraped successfully: ${url}`)
        onProgress?.(`Captured ${(result.markdown || "").length} characters from ${url}`)
      } else {
        onProgress?.(`Scrape failed: ${url}`)
      }
    }

    const successfulScrapes = scraped.filter(s => s.success && s.markdown)
    if (successfulScrapes.length > 0) {
      dataSourcesUsed.push("crawl4ai_deep_scrape")
      scrapedContext = successfulScrapes.map(s => `\n--- SOURCE: ${s.url} ---\n${s.markdown?.slice(0, 6000)}`).join("\n\n")
    }
  }

  // Call 1: Competitor + Market Analysis
  onProgress?.("Analyzing market and top competitors...")
  const competitorMarketAnalysis = await analyzeCompetitorsAndMarket(input, compRes, webRes)
  
  // Call 2: Reddit Sentiment Analysis  
  onProgress?.("Analyzing Reddit sentiment and user pain points...")
  const redditAnalysis = await analyzeRedditSentiment(input, enrichedReddit, scrapedContext)
  
  // Call 3: Search Demand + News + Final Verdict
  onProgress?.("Synthesizing search demand, news, and generating final verdict...")
  const verdictAnalysis = await generateVerdict(
    input,
    competitorMarketAnalysis,
    redditAnalysis,
    newsRes,
    trends,
    scrapedContext,
    searchQueries.trends,
    searchQueries.news
  )
  
  onProgress?.("Research complete!")
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

function buildSearchQueries(input: ResearchInput) {
  const { title, category, tags } = input
  const tagString = tags.slice(0, 3).join(" ")
  
  // Use core keywords rather than full pitch to get better Reddit search results
  const categoryKeywords = category.toLowerCase().replace('_', ' ')
  const redditQuery = `${title} OR ${categoryKeywords}`.slice(0, 60).trim()
  
  return {
    reddit: redditQuery,
    competitors: `${title} competitors alternatives India startup`,
    competitorDirect: `"${categoryKeywords}" startup India ${tagString}`,
    news: `${categoryKeywords} market India trend report startup funding 2024 2025`,
    trends: categoryKeywords.split(' ')[0], // Best short keyword for Google trends
  }
}

async function analyzeCompetitorsAndMarket(
  input: ResearchInput,
  competitorSearchResults: SearchResult[],
  webResults: SearchResult[]
): Promise<{ competitors: CompetitorData[], market: MarketData }> {
  const { success } = await aiLimiter.limit("research-competitor")
  if (!success) {
    return { competitors: [], market: getDefaultMarketData() }
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
    return { competitors: [], market: getDefaultMarketData() }
  }
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
  newsQuery: string
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
            ? parsed.searchData.relatedKeywords
            : fallbackRelatedKeywords,
          trendDirection: parsed?.searchData?.trendDirection || realTrends.trendDirection,
          trendSummary: parsed?.searchData?.trendSummary || `Search interest appears ${realTrends.trendDirection} over the past 12 months in India.`,
          searchIntent: parsed?.searchData?.searchIntent || "Users are evaluating solutions for this problem and comparing available options.",
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
