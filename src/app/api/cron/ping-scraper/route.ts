import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getHealthcheckUrl(): string | null {
  if (process.env.RENDER_SCRAPER_HEALTHCHECK_URL) {
    return process.env.RENDER_SCRAPER_HEALTHCHECK_URL
  }

  const scrapeUrl = process.env.RENDER_SCRAPER_URL
  if (!scrapeUrl) {
    return null
  }

  try {
    const parsed = new URL(scrapeUrl)
    parsed.pathname = "/healthz"
    parsed.search = ""
    return parsed.toString()
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const healthzUrl = getHealthcheckUrl()
  if (!healthzUrl) {
    return NextResponse.json({ ok: false, skipped: true, reason: "No scraper URL configured" })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(healthzUrl, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "piqd-cron-pinger/1.0",
      },
    })

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      target: healthzUrl,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        target: healthzUrl,
        error: error instanceof Error ? error.message : "Ping failed",
      },
      { status: 500 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
