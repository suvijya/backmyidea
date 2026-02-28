import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COMMENTS_PAGE_SIZE } from "@/lib/constants";

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

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;

    const comments = await prisma.comment.findMany({
      where: {
        ideaId,
        parentId: null,
        isHidden: false,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
        _count: { select: { upvotes: true } },
        replies: {
          where: { isHidden: false },
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true },
            },
            _count: { select: { upvotes: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: COMMENTS_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = comments.length > COMMENTS_PAGE_SIZE;
    const items = hasMore ? comments.slice(0, COMMENTS_PAGE_SIZE) : comments;

    return NextResponse.json({
      comments: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    });
  } catch (error) {
    console.error("[IDEA_COMMENTS] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
