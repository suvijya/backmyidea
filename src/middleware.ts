import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that do not require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/manifest.json",
  "/icon.png",
  "/apple-icon.png",
  "/favicon.ico",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/me(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/uploadthing(.*)"
]);

const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
    
    // Check onboarding status via cookie if not on the onboarding page
    if (!isOnboardingRoute(req)) {
      const onboardedCookie = req.cookies.get("onboarded");
      if (!onboardedCookie) {
        // Only redirect if it's not an API route
        if (!req.nextUrl.pathname.startsWith("/api/")) {
          const url = new URL("/onboarding", req.url);
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // Forward the current URL so server components can read it via headers()
  const response = NextResponse.next();
  response.headers.set("x-url", req.nextUrl.pathname);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
