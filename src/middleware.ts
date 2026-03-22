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

  // Prevent direct browser navigation to API routes (hide API from users in production)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // The validation-card endpoint generates an image meant to be opened in browsers
    const isAllowedDirectRoute = req.nextUrl.pathname.startsWith('/api/validation-card/');
    
    if (!isAllowedDirectRoute && req.method === 'GET') {
      const acceptHeader = req.headers.get('accept') || '';
      const secFetchDest = req.headers.get('sec-fetch-dest') || '';
      
      // If the request is looking for an HTML document (i.e. a user typed the URL into the browser)
      const isBrowserRequest = secFetchDest === 'document' || (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json'));
      
      if (isBrowserRequest) {
        // Redirect to home page instead of showing raw JSON
        return NextResponse.redirect(new URL('/', req.url));
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
