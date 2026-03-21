import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json(null);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { username: true, isAdmin: true, isEmployee: true },
  });

  if (!user) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    username: user.username,
    isAdmin: user.isAdmin,
    isEmployee: user.isEmployee,
  });
}
