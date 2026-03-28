# Render Selenium Scraper Worker

Dedicated scraping worker for production where Vercel serverless cannot reliably run Chrome/Selenium.

## Endpoints

- `GET /healthz` -> health check
- `POST /scrape`

Request body:

```json
{ "url": "https://www.reddit.com/r/startups/..." }
```

Response:

```json
{ "success": true, "markdown": "..." }
```

or

```json
{ "success": false, "error": "..." }
```

## Deploy on Render

1. Create a new Web Service from this folder (`scripts/render-scraper`).
2. Use `render.yaml` (Docker-based) for reliable Chromium + chromedriver runtime.
3. Set `SCRAPER_TOKEN` in Render env.

## App Integration

Set these env vars in your Next.js app:

- `RENDER_SCRAPER_URL=https://<your-worker>.onrender.com/scrape`
- `RENDER_SCRAPER_TOKEN=<same-token>`

When configured, `src/lib/scraper.ts` will call this worker first before local fetch/python fallbacks.

## Quick Validation

```bash
curl -s https://<your-worker>.onrender.com/healthz
curl -s -X POST https://<your-worker>.onrender.com/scrape \
  -H "Authorization: Bearer <SCRAPER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.reddit.com/r/startups/comments/18a9c78/thoughts_what_other_business_models_can_tech/"}'
```
