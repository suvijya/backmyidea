import { execFile } from "child_process"
import path from "path"

export interface ScrapeResult {
  success: boolean
  url: string
  markdown?: string
  error?: string
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
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
    error: direct.error || python.error || "Scrape failed",
  }
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
