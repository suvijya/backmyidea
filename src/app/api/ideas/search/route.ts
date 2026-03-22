import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchSchema } from "@/lib/validations";
import { FEED_PAGE_SIZE } from "@/lib/constants";
import type { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    const { searchParams } = new URL(req.url);

    const raw = {
      query: searchParams.get("query") ?? "",
      category: searchParams.get("category") ?? undefined,
      stage: searchParams.get("stage") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const parsed = searchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid search params" },
        { status: 400 }
      );
    }

    const { query, category, stage, sort, cursor, limit } = parsed.data;
    const pageSize = limit ?? FEED_PAGE_SIZE;

    const where: Prisma.IdeaWhereInput = {
      status: "ACTIVE",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { pitch: { contains: query, mode: "insensitive" } },
        { problem: { contains: query, mode: "insensitive" } },
        { tags: { has: query.toLowerCase() } },
      ],
      ...(category && { category }),
      ...(stage && { stage }),
    };

    let orderBy: Prisma.IdeaOrderByWithRelationInput;
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "top":
        orderBy = { validationScore: "desc" };
        break;
      case "hot":
        orderBy = { totalVotes: "desc" };
        break;
      case "trending":
      default:
        orderBy = { totalVotes: "desc" };
        break;
    }

    const ideas = await prisma.idea.findMany({
      where,
      include: {
        founder: {
          select: { id: true, name: true, username: true, image: true },
        },
        votes: clerkId ? {
          where: { user: { clerkId } },
          select: { type: true, userId: true },
        } : false,
      },
      orderBy,
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const formattedIdeas = ideas.map((idea: any) => ({
      ...idea,
      votes: idea.votes || []
    }));

    const hasMore = formattedIdeas.length > pageSize;
    const items = hasMore ? formattedIdeas.slice(0, pageSize) : formattedIdeas;

    return NextResponse.json({
      ideas: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      total: await prisma.idea.count({ where }),
    });
  } catch (error) {
    console.error("[IDEAS_SEARCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
