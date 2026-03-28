import { execFile } from "child_process"
import path from "path"

export interface ScrapeResult {
  success: boolean
  url: string
  markdown?: string
  error?: string
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const redditOnlyRemote = isRedditUrl(url)
  const remote = redditOnlyRemote ? await scrapeWithRemoteWorker(url) : { success: false, url, error: "Remote scraper skipped for non-Reddit" }
  if (remote.success) {
    return remote
  }

  const direct = await scrapeWithFetch(url)
  if (direct.success) {
    return direct
  }

  const python = await scrapeWithPython(url)
  if (python.success) {
    return python
  }

  return {
    success: false,
    url,
    error: remote.error || direct.error || python.error || "Scrape failed",
  }
}

async function scrapeWithRemoteWorker(url: string): Promise<ScrapeResult> {
  const endpoint = process.env.RENDER_SCRAPER_URL
  if (!endpoint) {
    return { success: false, url, error: "Remote scraper not configured" }
  }

  const reddit = isRedditUrl(url)
  const candidateUrls = reddit ? Array.from(new Set([url, toOldRedditUrl(url), toCanonicalRedditUrl(url)])) : [url]
  const maxAttempts = reddit ? 2 : 1
  const timeoutMs = reddit ? 30000 : 20000
  let lastError = "Remote scraper failed"

  for (const candidateUrl of candidateUrls) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const result = await doRemoteScrape(endpoint, candidateUrl, timeoutMs)
      if (result.success) {
        return { ...result, url }
      }

      lastError = result.error || lastError
      const shouldRetry = shouldRetryRemote(lastError)
      if (!shouldRetry || attempt === maxAttempts) {
        break
      }

      await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
    }
  }

  return { success: false, url, error: lastError }
}

async function doRemoteScrape(endpoint: string, url: string, timeoutMs: number): Promise<ScrapeResult> {
  const token = process.env.RENDER_SCRAPER_TOKEN

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
      cache: "no-store",
    })

    if (!res.ok) {
      return { success: false, url, error: `Remote scraper HTTP ${res.status}` }
    }

    const payload: unknown = await res.json()
    if (!payload || typeof payload !== "object") {
      return { success: false, url, error: "Remote scraper invalid response" }
    }

    const parsed = payload as { success?: unknown; markdown?: unknown; error?: unknown }
    if (parsed.success === true && typeof parsed.markdown === "string" && parsed.markdown.length >= 120) {
      const blockedReason = detectBotBlock(parsed.markdown)
      if (blockedReason) {
        return {
          success: false,
          url,
          error: blockedReason,
        }
      }

      return {
        success: true,
        url,
        markdown: parsed.markdown.slice(0, 16000),
      }
    }

    return {
      success: false,
      url,
      error: typeof parsed.error === "string" ? parsed.error : "Remote scraper failed",
    }
  } catch (error) {
    return {
      success: false,
      url,
      error: error instanceof Error ? `Remote scraper error: ${error.message}` : "Remote scraper failed",
    }
  } finally {
    clearTimeout(timeout)
  }
}

function shouldRetryRemote(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase()
  return (
    normalized.includes("aborted") ||
    normalized.includes("timeout") ||
    normalized.includes("http 429") ||
    normalized.includes("http 500") ||
    normalized.includes("http 502") ||
    normalized.includes("http 503") ||
    normalized.includes("http 504")
  )
}

async function scrapeWithFetch(url: string): Promise<ScrapeResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    })
    if (!res.ok) {
      return { success: false, url, error: `HTTP ${res.status} ${res.statusText || ""}`.trim() }
    }

    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/pdf")) {
      return { success: false, url, error: "Unsupported content-type: pdf" }
    }
    if (contentType && !/html|xml|text\//i.test(contentType)) {
      return { success: false, url, error: `Unsupported content-type: ${contentType}` }
    }

    const html = await res.text()
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim()

    const blockedReason = detectBotBlock(cleaned)
    if (blockedReason) {
      return { success: false, url, error: blockedReason }
    }

    if (cleaned.length < 120) {
      return { success: false, url, error: "Insufficient extracted text" }
    }

    return {
      success: true,
      url,
      markdown: cleaned.slice(0, 16000),
    }
  } catch (error) {
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : "Fetch scraper failed",
    }
  } finally {
    clearTimeout(timeout)
  }
}

function isRedditUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === "reddit.com" || host.endsWith(".reddit.com")
  } catch {
    return /reddit\.com/i.test(url)
  }
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

function detectBotBlock(text: string): string | null {
  const normalized = text.toLowerCase()
  if (normalized.includes("prove your humanity")) {
    return "Blocked by bot challenge"
  }
  if (normalized.includes("blocked by network security")) {
    return "Blocked by network security"
  }
  if (normalized.includes("cloudflare") && normalized.includes("attention required")) {
    return "Blocked by anti-bot protection"
  }
  return null
}

async function scrapeWithPython(url: string): Promise<ScrapeResult> {
  const pythonExecCandidates = [
    process.env.PYTHON_PATH,
    "python3",
    "python",
    "C:\\Program Files\\Python39\\python.exe",
  ].filter((x): x is string => Boolean(x))

  const scriptPath = path.join(process.cwd(), "src", "lib", "crawl.py")

  let lastError = "Python scraper unavailable"
  for (const pythonExec of pythonExecCandidates) {
    const result = await new Promise<ScrapeResult>((resolve) => {
      execFile(
        pythonExec,
        [scriptPath, url],
        { maxBuffer: 50 * 1024 * 1024 },
        (error, stdout) => {
          try {
            if (stdout) {
              const startMarker = "---CRAWL_RESULT_START---"
              const endMarker = "---CRAWL_RESULT_END---"

              const startIndex = stdout.indexOf(startMarker)
              const endIndex = stdout.indexOf(endMarker)

              if (startIndex !== -1 && endIndex !== -1) {
                const jsonStr = stdout.substring(startIndex + startMarker.length, endIndex).trim()
                const parsed = JSON.parse(jsonStr)
                resolve(parsed)
                return
              }
            }
            resolve({ success: false, url, error: error?.message || `No valid output from python scraper (${pythonExec})` })
          } catch {
            resolve({
              success: false,
              url,
              error: error?.message || `Python JSON parse error (${pythonExec})`,
            })
          }
        }
      )
    })

    if (result.success) {
      return result
    }
    lastError = result.error || lastError
  }

  return {
    success: false,
    url,
    error: lastError,
  }
}
