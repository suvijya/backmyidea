import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUserPermissions } from "@/lib/clerk";

export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(null);
  }

  const user = await getCachedUserPermissions(clerkId);

  if (!user) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    username: user.username,
    isAdmin: user.isAdmin,
    isEmployee: user.isEmployee,
  });
}
