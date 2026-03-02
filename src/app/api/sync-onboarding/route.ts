import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/clerk";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  
  if (user?.onboarded) {
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
