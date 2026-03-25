import { execFile } from "child_process"
import path from "path"

export interface ScrapeResult {
  success: boolean
  url: string
  markdown?: string
  error?: string
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  return new Promise((resolve) => {
    // We discovered Python 3.9 has the installed package
    const pythonExec = "C:\\Program Files\\Python39\\python.exe"
    const scriptPath = path.join(process.cwd(), "src", "lib", "crawl.py")

    execFile(
      pythonExec,
      [scriptPath, url],
      { maxBuffer: 50 * 1024 * 1024 }, // 50MB buffer for large pages
      (error, stdout, stderr) => {
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
          resolve({ success: false, url, error: error?.message || "No valid output from python scraper" })
        } catch (e) {
          console.error("Failed to parse crawl result:", stdout.substring(0, 200))
          resolve({
            success: false,
            url,
            error: error?.message || "JSON Parse error",
          })
        }
      }
    )
  })
}
