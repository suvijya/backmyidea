import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";

function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof (error as Record<string, unknown>).digest === "string" &&
    ((error as Record<string, unknown>).digest as string).includes("NEXT_REDIRECT")
  );
}

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalIdeas,
      totalVotes,
      totalComments,
      newUsersToday,
      newIdeasToday,
      newVotesToday,
      activeUsersWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.idea.count({ where: { status: { not: "REMOVED" } } }),
      prisma.vote.count(),
      prisma.comment.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.idea.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.vote.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { lastActiveAt: { gte: startOfWeek } } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalIdeas,
      totalVotes,
      totalComments,
      newUsersToday,
      newIdeasToday,
      newVotesToday,
      activeUsersWeek,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_ANALYTICS] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
