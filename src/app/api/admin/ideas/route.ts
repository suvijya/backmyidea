import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/clerk";
import type { Prisma, IdeaStatus } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().default(""),
  status: z.enum(["all", "ACTIVE", "PENDING", "REJECTED", "DRAFT", "ARCHIVED", "REMOVED"]).default("all"),
  cursor: z.string().optional(),
});

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
    const user = await requireUser();
    if (!user.isAdmin && !user.isEmployee) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { search, status: statusFilter, cursor } = parseResult.data;
    const take = 50;

    const where: Prisma.IdeaWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (statusFilter !== "all") {
      where.status = statusFilter;
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

const patchSchema = z.object({
  ideaId: z.string().min(1),
  status: z.enum(["ACTIVE", "PENDING", "REJECTED", "DRAFT", "ARCHIVED", "REMOVED"]),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    if (!user.isAdmin && !user.isEmployee) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const json = await req.json();
    const parseResult = patchSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const body = parseResult.data;

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
