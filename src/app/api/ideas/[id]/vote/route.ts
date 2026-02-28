import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { FEED_PAGE_SIZE } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true, status: true },
    });

    if (!idea || idea.status === "REMOVED") {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Get current user's vote if authenticated
    const { userId: clerkId } = await auth();
    let userVote = null;

    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) {
        userVote = await prisma.vote.findUnique({
          where: { userId_ideaId: { userId: user.id, ideaId } },
          select: { type: true },
        });
      }
    }

    // Get vote breakdown
    const voteBreakdown = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: {
        totalVotes: true,
        useThisCount: true,
        maybeCount: true,
        notForMeCount: true,
      },
    });

    // Get recent votes
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;

    const recentVotes = await prisma.vote.findMany({
      where: { ideaId },
      include: {
        user: {
          select: { name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: FEED_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = recentVotes.length > FEED_PAGE_SIZE;
    const votes = hasMore ? recentVotes.slice(0, FEED_PAGE_SIZE) : recentVotes;

    return NextResponse.json({
      userVote: userVote?.type ?? null,
      breakdown: voteBreakdown,
      recentVotes: votes,
      hasMore,
      nextCursor: hasMore ? votes[votes.length - 1]?.id : null,
    });
  } catch (error) {
    console.error("[IDEA_VOTE] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
