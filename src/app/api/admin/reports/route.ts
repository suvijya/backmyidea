import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import type { ReportStatus } from "@prisma/client";

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
    const status = (searchParams.get("status") ?? "PENDING") as ReportStatus;
    const cursor = searchParams.get("cursor") ?? undefined;

    const reports = await prisma.report.findMany({
      where: { status },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = reports.length > 20;
    const items = hasMore ? reports.slice(0, 20) : reports;

    return NextResponse.json({
      reports: items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_REPORTS_GET] Error:", error);
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
      reportId: string;
      status?: ReportStatus;
      action?: "dismiss" | "remove_content" | "ban_user" | "remove_and_ban";
    };

    if (!body.reportId) {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: body.reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // If using the new action-based resolution
    if (body.action) {
      const newStatus: ReportStatus =
        body.action === "dismiss" ? "DISMISSED" : "ACTION_TAKEN";

      // Execute moderation action
      switch (body.action) {
        case "remove_content":
          await removeReportedContent(report.entityType, report.entityId);
          break;
        case "ban_user":
          await banReportedUser(report.entityType, report.entityId);
          break;
        case "remove_and_ban":
          await removeReportedContent(report.entityType, report.entityId);
          await banReportedUser(report.entityType, report.entityId);
          break;
      }

      // Update this report
      await prisma.report.update({
        where: { id: body.reportId },
        data: { status: newStatus, resolvedAt: new Date() },
      });

      // Also resolve other pending reports on the same entity
      if (body.action !== "dismiss") {
        await prisma.report.updateMany({
          where: {
            entityType: report.entityType,
            entityId: report.entityId,
            status: "PENDING",
            id: { not: body.reportId },
          },
          data: { status: newStatus, resolvedAt: new Date() },
        });
      }

      return NextResponse.json({ success: true });
    }

    // Legacy: simple status update
    if (body.status) {
      await prisma.report.update({
        where: { id: body.reportId },
        data: {
          status: body.status,
          resolvedAt: body.status !== "PENDING" ? new Date() : null,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing status or action" }, { status: 400 });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_REPORTS_PATCH] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════
// HELPERS
// ═══════════════════════════════

async function removeReportedContent(
  entityType: string,
  entityId: string
): Promise<void> {
  switch (entityType) {
    case "idea": {
      await prisma.idea.updateMany({
        where: { id: entityId, status: { not: "REMOVED" } },
        data: { status: "REMOVED" },
      });
      break;
    }
    case "comment": {
      await prisma.comment.updateMany({
        where: { id: entityId, isHidden: false },
        data: { isHidden: true },
      });
      break;
    }
    case "user": {
      // For user reports, "remove content" means ban + remove ideas
      const user = await prisma.user.findUnique({ where: { id: entityId } });
      if (user && !user.isBanned && !user.isAdmin) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: entityId },
            data: { isBanned: true },
          }),
          prisma.idea.updateMany({
            where: { founderId: entityId, status: "ACTIVE" },
            data: { status: "REMOVED" },
          }),
        ]);
      }
      break;
    }
  }
}

async function banReportedUser(
  entityType: string,
  entityId: string
): Promise<void> {
  let userId: string | null = null;

  switch (entityType) {
    case "idea": {
      const idea = await prisma.idea.findUnique({
        where: { id: entityId },
        select: { founderId: true },
      });
      userId = idea?.founderId ?? null;
      break;
    }
    case "comment": {
      const comment = await prisma.comment.findUnique({
        where: { id: entityId },
        select: { userId: true },
      });
      userId = comment?.userId ?? null;
      break;
    }
    case "user": {
      userId = entityId;
      break;
    }
  }

  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isAdmin || user.isBanned) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    }),
    prisma.idea.updateMany({
      where: { founderId: userId, status: "ACTIVE" },
      data: { status: "REMOVED" },
    }),
  ]);
}
