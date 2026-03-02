import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  search: z.string().default(""),
  filter: z.enum(["all", "banned", "admin", "onboarded"]).default("all"),
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
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({
      search: searchParams.get("search") || undefined,
      filter: searchParams.get("filter") || undefined,
      cursor: searchParams.get("cursor") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { search, filter, cursor } = parseResult.data;
    const take = 50;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "banned") where.isBanned = true;
    if (filter === "admin") where.isAdmin = true;
    if (filter === "onboarded") where.onboarded = true;

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: { ideas: true, votes: true, comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = users.length > take;
    const items = hasMore ? users.slice(0, take) : users;

    return NextResponse.json({
      users: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
      total: await prisma.user.count({ where }),
    });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_USERS_GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = (await req.json()) as {
      userId: string;
      action: "ban" | "unban";
    };

    if (!body.userId || !["ban", "unban"].includes(body.action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.isAdmin) {
      return NextResponse.json(
        { error: "Cannot ban an admin user" },
        { status: 400 }
      );
    }

    const ban = body.action === "ban";

    if (ban) {
      // Atomic: ban user + remove all their active ideas in one transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { id: body.userId },
          data: { isBanned: true },
        }),
        prisma.idea.updateMany({
          where: { founderId: body.userId, status: "ACTIVE" },
          data: { status: "REMOVED" },
        }),
      ]);
    } else {
      await prisma.user.update({
        where: { id: body.userId },
        data: { isBanned: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_USERS_PATCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
