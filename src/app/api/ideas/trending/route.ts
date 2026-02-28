import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FEED_PAGE_SIZE } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const period = searchParams.get("period") ?? "week"; // week | month | all

  // Build date filter for trending
  const now = new Date();
  let dateFilter: Date | undefined;

  if (period === "week") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const ideas = await prisma.idea.findMany({
    where: {
      status: "ACTIVE",
      ...(dateFilter && { createdAt: { gte: dateFilter } }),
    },
    include: {
      founder: {
        select: { id: true, name: true, username: true, image: true },
      },
      votes: {
        select: { type: true, userId: true },
      },
    },
    // Trending: sort by total votes (weighted by recency)
    orderBy: [
      { totalVotes: "desc" },
      { createdAt: "desc" },
    ],
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = ideas.length > FEED_PAGE_SIZE;
  const items = hasMore ? ideas.slice(0, FEED_PAGE_SIZE) : ideas;

  return NextResponse.json({
    ideas: items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}
