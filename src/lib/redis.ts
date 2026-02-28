import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { RATE_LIMITS } from "./constants";

// NOTE: Redis client will throw at runtime if env vars are missing.
// This is intentional — we fail fast rather than silently.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ═══════════════════════════════
// RATE LIMITERS (sliding window)
// ═══════════════════════════════

export const voteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.vote.limit,
    RATE_LIMITS.vote.window
  ),
  prefix: "rl:vote",
  analytics: true,
});

export const commentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.comment.limit,
    RATE_LIMITS.comment.window
  ),
  prefix: "rl:comment",
  analytics: true,
});

export const ideaLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.idea.limit,
    RATE_LIMITS.idea.window
  ),
  prefix: "rl:idea",
  analytics: true,
});

export const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.ai.limit,
    RATE_LIMITS.ai.window
  ),
  prefix: "rl:ai",
  analytics: true,
});

export const donateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.donate.limit,
    RATE_LIMITS.donate.window
  ),
  prefix: "rl:donate",
  analytics: true,
});
