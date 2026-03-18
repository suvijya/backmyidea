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
    const response = NextResponse.redirect(new URL("/explore", req.url));
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
