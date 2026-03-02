import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  UPLOADTHING_TOKEN: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
});

// Since we're doing this manually, we need to pass process.env
const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
};

const _serverEnv = serverSchema.safeParse(processEnv);
const _clientEnv = clientSchema.safeParse(processEnv);

if (!_serverEnv.success || !_clientEnv.success) {
  console.error("❌ Invalid environment variables:");
  if (!_serverEnv.success) {
    console.error("Server Env Errors:", _serverEnv.error.format());
  }
  if (!_clientEnv.success) {
    console.error("Client Env Errors:", _clientEnv.error.format());
  }
  
  // We don't throw during build to avoid failing Vercel build before env vars are populated
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Invalid environment variables");
  }
}

export const env = {
  ...(_serverEnv.success ? _serverEnv.data : (processEnv as any)),
  ...(_clientEnv.success ? _clientEnv.data : (processEnv as any)),
};
