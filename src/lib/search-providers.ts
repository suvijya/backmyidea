// src/lib/search-providers.ts

import googleTrends from 'google-trends-api'

const REDDIT_USER_AGENTS = [
  "PIQD Research Bot 1.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
]

async function fetchJsonWithRetry(url: string, maxAttempts: number = 3): Promise<any | null> {
  let lastStatus: number | null = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const ua = REDDIT_USER_AGENTS[(attempt - 1) % REDDIT_USER_AGENTS.length]
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          "Accept": "application/json,text/plain,*/*",
          "Accept-Language": "en-IN,en;q=0.9",
        },
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeout)

      if (res.ok) {
        return await res.json()
      }

      lastStatus = res.status

      if (attempt === maxAttempts) return null
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
    } catch {
      if (attempt === maxAttempts) return null
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
    }
  }
  if (lastStatus !== null) {
    console.warn(`Reddit JSON fetch failed with status ${lastStatus}: ${url}`)
  }
  return null
}

function mapSearchResultsToRedditPosts(results: SearchResult[]): RedditPost[] {
  return results
    .filter((r) => /reddit\.com/i.test(r.url))
    .map((r) => {
      const subMatch = r.url.match(/reddit\.com\/r\/([^/]+)/i)
      return {
        title: r.title,
        subreddit: subMatch ? `r/${subMatch[1]}` : "r/unknown",
        url: r.url,
        selftext: r.snippet,
        score: 0,
        numComments: 0,
        created: new Date().toISOString(),
      }
    })
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source?: string
  date?: string
}

export interface RedditPost {
  title: string
  subreddit: string
  url: string
  selftext?: string
  score: number
  numComments: number
  created: string
}

export interface RedditThreadContext {
  url: string
  body: string
  topComments: string[]
}

export interface GoogleTrendsResult {
  trendDirection: "rising" | "stable" | "declining"
  relatedQueries: string[]
  interestSeries: Array<{ label: string; value: number }>
}

/**
 * Get real Google Trends data using google-trends-api
 */
export async function getRealGoogleTrends(keyword: string, geo: string = "IN"): Promise<GoogleTrendsResult> {
  try {
    // Get interest over time for the last 12 months
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    const [interestRes, relatedRes] = await Promise.all([
      googleTrends.interestOverTime({ keyword, geo, startTime: startDate }),
      googleTrends.relatedQueries({ keyword, geo })
    ]).catch(() => [null, null])

    let trendDirection: "rising" | "stable" | "declining" = "stable"
    let relatedQueries: string[] = []
    let interestSeries: Array<{ label: string; value: number }> = []

    if (interestRes) {
      const data = JSON.parse(interestRes)
      const timeline = data?.default?.timelineData || []
      interestSeries = timeline
        .map((item: { formattedTime?: string; value?: number[] }) => ({
          label: item.formattedTime || "",
          value: item.value?.[0] || 0,
        }))
        .slice(-24)
      if (timeline.length > 4) {
        // Compare first half vs second half average to determine trend
        const firstHalf = timeline.slice(0, Math.floor(timeline.length / 2))
        const secondHalf = timeline.slice(Math.floor(timeline.length / 2))
        
        const avgFirst = firstHalf.reduce((sum: number, item: any) => sum + (item.value[0] || 0), 0) / firstHalf.length
        const avgSecond = secondHalf.reduce((sum: number, item: any) => sum + (item.value[0] || 0), 0) / secondHalf.length
        
        if (avgSecond > avgFirst * 1.2) trendDirection = "rising"
        else if (avgSecond < avgFirst * 0.8) trendDirection = "declining"
        else trendDirection = "stable"
      }
    }

    if (relatedRes) {
      const data = JSON.parse(relatedRes)
      // Extract both "top" and "rising" related queries
      const topQueries = data?.default?.rankedList?.[0]?.rankedKeyword || []
      const risingQueries = data?.default?.rankedList?.[1]?.rankedKeyword || []
      
      const allQueries = [...topQueries, ...risingQueries].map((q: any) => q.query)
      // Deduplicate and take top 10
      relatedQueries = Array.from(new Set(allQueries)).slice(0, 10)
    }

    return { trendDirection, relatedQueries, interestSeries }
  } catch (error) {
    console.error("Google Trends API failed:", error)
    return { trendDirection: "stable", relatedQueries: [], interestSeries: [] }
  }
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

    // OPTION 3: Fallback — Google News RSS (no API key)
    return await searchWithGoogleNewsRSS(query, numResults)
  } catch (error) {
    console.error("Web search failed:", error)
    return []
  }
}

export async function searchXPosts(query: string, numResults: number = 20): Promise<SearchResult[]> {
  const queries = [
    `site:x.com ${query}`,
    `site:twitter.com ${query}`,
  ]

  const all: SearchResult[] = []
  for (const q of queries) {
    const found = await searchWeb(q, Math.ceil(numResults / 2))
    all.push(...found)
  }

  const seen = new Set<string>()
  return all.filter((item) => {
    const isX = /x\.com|twitter\.com/i.test(item.url)
    if (!isX || seen.has(item.url)) return false
    seen.add(item.url)
    return true
  }).slice(0, numResults)
}

export async function searchForumSources(query: string, numResults: number = 30): Promise<SearchResult[]> {
  const forumQueries = [
    `site:reddit.com ${query}`,
    `site:news.ycombinator.com ${query}`,
    `site:stackoverflow.com ${query}`,
    `site:producthunt.com ${query}`,
    `site:indiehackers.com ${query}`,
    `site:quora.com ${query}`,
    `site:dev.to ${query}`,
    `site:medium.com ${query}`,
    `site:lobste.rs ${query}`,
    `site:hackernews.io ${query}`,
  ]

  const all: SearchResult[] = []
  for (const q of forumQueries) {
    const found = await searchWeb(q, Math.max(3, Math.floor(numResults / forumQueries.length) + 2))
    all.push(...found)
  }

  const seen = new Set<string>()
  return all.filter((item) => {
    if (!item.url || seen.has(item.url)) return false
    seen.add(item.url)
    return true
  }).slice(0, numResults)
}

async function searchWithGoogleNewsRSS(query: string, num: number): Promise<SearchResult[]> {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`
    const res = await fetch(rssUrl, {
      headers: {
        "User-Agent": "PIQD Research Bot 1.0",
      },
      cache: "no-store",
    })
    if (!res.ok) return []

    const xml = await res.text()
    const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, Math.max(1, Math.min(num, 10)))

    return itemMatches.map((match) => {
      const itemXml = match[1]
      const title = decodeXml((itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Untitled").trim())
      const link = decodeXml((itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "").trim())
      const snippet = decodeXml((itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      const source = decodeXml((itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "Google News").trim())
      const date = decodeXml((itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "").trim())

      return {
        title,
        url: link,
        snippet,
        source,
        date,
      }
    }).filter((item) => Boolean(item.url))
  } catch (error) {
    console.error("Google News RSS fallback failed:", error)
    return []
  }
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

async function fetchTextWithRetry(url: string, maxAttempts: number = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const ua = REDDIT_USER_AGENTS[(attempt - 1) % REDDIT_USER_AGENTS.length]
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-IN,en;q=0.9",
        },
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeout)
      if (res.ok) {
        return await res.text()
      }
      if (attempt === maxAttempts) return null
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
    } catch {
      if (attempt === maxAttempts) return null
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
    }
  }
  return null
}

function parseRedditRss(xml: string, max: number): RedditPost[] {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, max)
  return items.map((match) => {
    const itemXml = match[1]
    const title = decodeXml((itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Untitled").trim())
    const link = decodeXml((itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "").trim())
    const description = decodeXml((itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    const sub = link.match(/reddit\.com\/r\/([^/]+)/i)?.[1]
    const date = decodeXml((itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "").trim())

    return {
      title,
      subreddit: sub ? `r/${sub}` : "r/unknown",
      url: link,
      selftext: description,
      score: 0,
      numComments: 0,
      created: date ? new Date(date).toISOString() : new Date().toISOString(),
    }
  }).filter((p) => Boolean(p.url))
}

async function searchRedditViaRss(query: string, limit: number, subreddits?: string[]): Promise<RedditPost[]> {
  const encoded = encodeURIComponent(query)
  const urls = subreddits && subreddits.length > 0
    ? subreddits.map((sub) => `https://www.reddit.com/r/${sub}/search.rss?q=${encoded}&restrict_sr=on&sort=relevance&t=year`)
    : [`https://www.reddit.com/search.rss?q=${encoded}&sort=relevance&t=year`]

  const all: RedditPost[] = []
  for (const url of urls) {
    const xml = await fetchTextWithRetry(url, 3)
    if (!xml) continue
    all.push(...parseRedditRss(xml, Math.max(3, Math.ceil(limit / Math.max(1, urls.length)))))
  }

  const deduped = Array.from(new Map(all.map((p) => [p.url, p])).values())
  return deduped.slice(0, limit)
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
    const data = await fetchJsonWithRetry(url, 3)
    if (!data) {
      console.warn("Reddit API blocked or unavailable. Falling back to Reddit RSS + web-indexed links.")
      const rssFallback = await searchRedditViaRss(query, limit)
      if (rssFallback.length > 0) return rssFallback
      const fallback = await searchWeb(`site:reddit.com ${query}`, limit)
      return mapSearchResultsToRedditPosts(fallback)
    }
    
    return (data.data?.children || [])
      .map((child: any) => child.data)
      .filter((post: any) => !post.over_18) // filter NSFW
      .map((post: any) => ({
        title: post.title,
        subreddit: post.subreddit_name_prefixed || `r/${post.subreddit}`,
        url: `https://reddit.com${post.permalink}`,
        selftext: post.selftext?.slice(0, 3000) || "",
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
    "startups",
    "SaaS",
    "Entrepreneur",
    "productivity",
    "projectmanagement",
    "jira",
    "asana",
    "remotework",
    "business",
    "smallbusiness",
  ],
  limit: number = 8
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = []
  
  // Search broader list for better coverage in deep research
  const targetSubs = subreddits.slice(0, 10)
  
  for (const sub of targetSubs) {
    try {
      const encoded = encodeURIComponent(query)
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encoded}&restrict_sr=1&sort=relevance&limit=${limit}`
      const data = await fetchJsonWithRetry(url, 3)
      if (!data) continue
      
      const posts = (data.data?.children || [])
        .map((child: any) => child.data)
        .filter((post: any) => !post.over_18)
        .map((post: any) => ({
          title: post.title,
          subreddit: `r/${post.subreddit}`,
          url: `https://reddit.com${post.permalink}`,
          selftext: post.selftext?.slice(0, 3000) || "",
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
  const deduped = Array.from(new Map(allPosts.map((p) => [p.url, p])).values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  if (deduped.length === 0) {
    console.warn("Targeted Reddit search returned 0. Falling back to Reddit RSS + web-indexed links.")
    const rssFallback = await searchRedditViaRss(query, limit * 3, targetSubs)
    if (rssFallback.length > 0) return rssFallback
    const fallback = await searchWeb(`site:reddit.com ${query}`, limit * 3)
    return mapSearchResultsToRedditPosts(fallback)
  }

  return deduped
}

export async function getRedditThreadContext(url: string): Promise<RedditThreadContext | null> {
  try {
    const normalized = url.endsWith("/") ? url.slice(0, -1) : url
    const jsonUrl = `${normalized}.json?limit=8&sort=top`
    const payload: unknown = await fetchJsonWithRetry(jsonUrl, 3)
    if (!payload) {
      const oldRedditUrl = url.replace("https://reddit.com", "https://old.reddit.com").replace("https://www.reddit.com", "https://old.reddit.com")
      const html = await fetchTextWithRetry(oldRedditUrl, 2)
      if (!html) return null

      const body = (html.match(/<div class="md">([\s\S]*?)<\/div>/i)?.[1] || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000)

      const comments = Array.from(html.matchAll(/<div class="md">([\s\S]*?)<\/div>/gi))
        .slice(1, 10)
        .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 20)

      return {
        url,
        body,
        topComments: comments,
      }
    }
    if (!Array.isArray(payload) || payload.length < 2) return null

    const postListing = payload[0] as { data?: { children?: Array<{ data?: { selftext?: string } }> } }
    const commentsListing = payload[1] as { data?: { children?: Array<{ data?: { body?: string; score?: number; stickied?: boolean } }> } }

    const body = postListing?.data?.children?.[0]?.data?.selftext?.slice(0, 5000) || ""

    const topComments = (commentsListing?.data?.children || [])
      .map((child) => child?.data)
      .filter((comment): comment is { body?: string; score?: number; stickied?: boolean } => Boolean(comment) && !comment?.stickied)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((comment) => (comment.body || "").replace(/\s+/g, " ").trim())
      .filter((bodyText) => bodyText.length > 20)
      .slice(0, 8)

    return {
      url,
      body,
      topComments,
    }
  } catch (error) {
    console.error("Failed to fetch reddit thread context:", error)
    return null
  }
}

/**
 * Get Google Trends embed URL for a keyword.
 * This is free and doesn't need an API key.
 */
export function getGoogleTrendsEmbedUrl(keyword: string, geo: string = "IN"): string {
  const cleanKeyword = keyword.trim().split(/\s+/).slice(0, 3).join(" ") || "startup"
  const req = encodeURIComponent(JSON.stringify({
    comparisonItem: [{ keyword: cleanKeyword, geo, time: "today 12-m" }],
    category: 0,
    property: "",
  }))
  const eq = encodeURIComponent(`q=${cleanKeyword}&geo=${geo}&date=today 12-m`)

  return `https://trends.google.com/trends/embed/explore/TIMESERIES?req=${req}&tz=-330&eq=${eq}`
}
