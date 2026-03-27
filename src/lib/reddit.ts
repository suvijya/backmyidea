// src/lib/reddit.ts
// Reddit data access via PullPush.io (Pushshift successor).
// Free, no API key, no auth — provides full Reddit post content, scores, and comments.
// Fallback: Serper site:reddit.com for discovery when PullPush is down.

import type { RedditPost, RedditThreadContext } from "@/lib/search-providers"

const PULLPUSH_BASE = "https://api.pullpush.io/reddit"
const PULLPUSH_TIMEOUT = 15000

interface PullPushSubmission {
  title: string
  selftext: string
  subreddit: string
  subreddit_name_prefixed: string
  permalink: string
  score: number
  num_comments: number
  created_utc: number
  over_18: boolean
  url: string
}

interface PullPushComment {
  body: string
  score: number
  stickied: boolean
  created_utc: number
  author: string
}

async function pullPushFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PULLPUSH_TIMEOUT)

    const res = await fetch(`${PULLPUSH_BASE}${endpoint}`, {
      headers: {
        "User-Agent": "Piqd Research v1.0",
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(`[PullPush] ${res.status} for ${endpoint}`)
      return null
    }

    return (await res.json()) as T
  } catch (error) {
    console.error(`[PullPush] Fetch error for ${endpoint}:`, error)
    return null
  }
}

/**
 * Check if PullPush.io is reachable (lightweight health check).
 * Cached for 5 minutes to avoid spamming.
 */
let pullPushHealthy: boolean | null = null
let healthCheckAt = 0

async function isPullPushAvailable(): Promise<boolean> {
  if (pullPushHealthy !== null && Date.now() < healthCheckAt + 5 * 60 * 1000) {
    return pullPushHealthy
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${PULLPUSH_BASE}/search/submission/?q=test&size=1`, {
      signal: controller.signal,
      headers: { "User-Agent": "Piqd Research v1.0" },
    })

    clearTimeout(timeout)
    pullPushHealthy = res.ok
    healthCheckAt = Date.now()
    return pullPushHealthy
  } catch {
    pullPushHealthy = false
    healthCheckAt = Date.now()
    return false
  }
}

/**
 * Always returns true — PullPush doesn't need credentials.
 * This function exists to maintain the same interface as the old OAuth module.
 * At runtime, we also check isPullPushAvailable() for actual connectivity.
 */
export function isRedditOAuthConfigured(): boolean {
  // NOTE: This returns true so the search-providers/research.ts flow
  // always tries PullPush first. If PullPush is down, each function
  // gracefully returns empty/null and the fallback chain continues.
  return true
}

/**
 * Search Reddit globally via PullPush.io.
 */
export async function oauthSearchReddit(
  query: string,
  limit: number = 25,
): Promise<RedditPost[]> {
  const available = await isPullPushAvailable()
  if (!available) return []

  const encoded = encodeURIComponent(query)
  const data = await pullPushFetch<{ data: PullPushSubmission[] }>(
    `/search/submission/?q=${encoded}&size=${Math.min(limit, 100)}&sort=score&sort_type=desc`,
  )

  if (!data?.data) return []

  return data.data
    .filter((post) => !post.over_18)
    .map((post) => ({
      title: post.title || "",
      subreddit: post.subreddit_name_prefixed || `r/${post.subreddit}`,
      url: `https://reddit.com${post.permalink}`,
      selftext: (post.selftext || "").slice(0, 3000),
      score: post.score || 0,
      numComments: post.num_comments || 0,
      created: new Date((post.created_utc || 0) * 1000).toISOString(),
    }))
}

/**
 * Search within specific subreddits via PullPush.io.
 */
export async function oauthSearchRedditTargeted(
  query: string,
  subreddits: string[],
  limitPerSub: number = 10,
): Promise<RedditPost[]> {
  const available = await isPullPushAvailable()
  if (!available) return []

  const allPosts: RedditPost[] = []
  const encoded = encodeURIComponent(query)

  // PullPush supports comma-separated subreddits
  const subsParam = subreddits.join(",")
  const data = await pullPushFetch<{ data: PullPushSubmission[] }>(
    `/search/submission/?q=${encoded}&subreddit=${subsParam}&size=${Math.min(limitPerSub * subreddits.length, 100)}&sort=score&sort_type=desc`,
  )

  if (!data?.data) return []

  const posts = data.data
    .filter((post) => !post.over_18)
    .map((post) => ({
      title: post.title || "",
      subreddit: post.subreddit_name_prefixed || `r/${post.subreddit}`,
      url: `https://reddit.com${post.permalink}`,
      selftext: (post.selftext || "").slice(0, 3000),
      score: post.score || 0,
      numComments: post.num_comments || 0,
      created: new Date((post.created_utc || 0) * 1000).toISOString(),
    }))

  allPosts.push(...posts)

  // Deduplicate by URL and sort by score
  return Array.from(new Map(allPosts.map((p) => [p.url, p])).values())
    .sort((a, b) => b.score - a.score)
}

/**
 * Get thread context (selftext + top comments) via PullPush.io.
 */
export async function oauthGetThreadContext(
  permalink: string,
): Promise<RedditThreadContext | null> {
  const available = await isPullPushAvailable()
  if (!available) return null

  // Extract post ID from URL/permalink
  // Format: /r/subreddit/comments/POST_ID/title/
  let path = permalink
  if (path.startsWith("https://")) {
    try {
      path = new URL(path).pathname
    } catch {
      return null
    }
  }

  const postIdMatch = path.match(/\/comments\/([a-z0-9]+)/i)
  if (!postIdMatch) return null

  const postId = postIdMatch[1]

  // Fetch post content
  const postData = await pullPushFetch<{ data: PullPushSubmission[] }>(
    `/search/submission/?ids=${postId}`,
  )

  const body = postData?.data?.[0]?.selftext?.slice(0, 5000) || ""

  // Fetch top comments
  const commentData = await pullPushFetch<{ data: PullPushComment[] }>(
    `/search/comment/?link_id=${postId}&size=20&sort=score&sort_type=desc`,
  )

  const topComments = (commentData?.data || [])
    .filter((c) => !c.stickied && typeof c.body === "string")
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((c) => (c.body || "").replace(/\s+/g, " ").trim())
    .filter((text) => text.length > 20 && text !== "[deleted]" && text !== "[removed]")
    .slice(0, 12)

  // If we got nothing useful, return null to trigger fallback
  if (!body && topComments.length === 0) return null

  return {
    url: permalink.startsWith("https://") ? permalink : `https://reddit.com${permalink}`,
    body,
    topComments,
  }
}
