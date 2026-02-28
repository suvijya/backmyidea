import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import type { IdeaStatus, Prisma } from "@prisma/client";

function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof (error as Record<string, unknown>).digest === "string" &&
    ((error as Record<string, unknown>).digest as string).includes("NEXT_REDIRECT")
  );
}

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const statusFilter = searchParams.get("status") ?? "all";
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = 50;

    const where: Prisma.IdeaWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (statusFilter !== "all") {
      where.status = statusFilter as IdeaStatus;
    }

    const ideas = await prisma.idea.findMany({
      where,
      include: {
        founder: {
          select: { id: true, name: true, username: true, isBanned: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = ideas.length > take;
    const items = hasMore ? ideas.slice(0, take) : ideas;

    return NextResponse.json({
      ideas: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_IDEAS_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const VALID_STATUSES: IdeaStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED", "REMOVED"];

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = (await req.json()) as {
      ideaId: string;
      status: IdeaStatus;
    };

    if (!body.ideaId || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const idea = await prisma.idea.findUnique({ where: { id: body.ideaId } });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    await prisma.idea.update({
      where: { id: body.ideaId },
      data: { status: body.status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_IDEAS_PATCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
