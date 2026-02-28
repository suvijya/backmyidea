import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

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
}
