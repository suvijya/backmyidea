// src/lib/search-providers.ts

import googleTrends from 'google-trends-api'

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

    if (interestRes) {
      const data = JSON.parse(interestRes)
      const timeline = data?.default?.timelineData || []
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

    return { trendDirection, relatedQueries }
  } catch (error) {
    console.error("Google Trends API failed:", error)
    return { trendDirection: "stable", relatedQueries: [] }
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
  
  // Search top 5 most relevant subreddits to get a better net
  const targetSubs = subreddits.slice(0, 5)
  
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
  return allPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

export async function getRedditThreadContext(url: string): Promise<RedditThreadContext | null> {
  try {
    const normalized = url.endsWith("/") ? url.slice(0, -1) : url
    const jsonUrl = `${normalized}.json?limit=8&sort=top`
    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "PIQD Research Bot 1.0",
      },
    })

    if (!res.ok) return null

    const payload: unknown = await res.json()
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
