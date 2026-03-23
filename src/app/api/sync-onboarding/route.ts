import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // JIT creation or fetch
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";

    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        name,
        email,
        image: clerkUser.imageUrl,
        onboarded: false,
      },
    });
  }

  if (user.onboarded) {
    // If they were sent here just to sync the cookie, try to send them back where they came from,
    // otherwise fallback to explore page
    const requestUrl = new URL(req.url);
    const returnTo = requestUrl.searchParams.get("returnTo") || "/explore";
    
    const response = NextResponse.redirect(new URL(returnTo, req.url));
    response.cookies.set("onboarded", "true", {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  return NextResponse.redirect(new URL("/onboarding", req.url));
}
