"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { IdeaStatus, ReportStatus } from "@prisma/client";

// ═══════════════════════════════
// BAN / UNBAN USER
// ═══════════════════════════════

export async function toggleUserBan(
  userId: string,
  ban: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  // Cannot ban another admin
  if (targetUser.isAdmin) {
    return { success: false, error: "Cannot ban an admin user" };
  }

  // Cannot ban yourself
  if (targetUser.id === admin.id) {
    return { success: false, error: "Cannot ban yourself" };
  }

  // Atomic: ban user + archive their ideas together
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isBanned: ban },
    });

    // If banning, also archive all their active ideas
    if (ban) {
      await tx.idea.updateMany({
        where: { founderId: userId, status: "ACTIVE" },
        data: { status: "REMOVED" },
      });
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/ideas");
  revalidatePath("/explore");

  return { success: true, data: undefined };
}

// ═══════════════════════════════
// CHANGE IDEA STATUS (admin override)
// ═══════════════════════════════

export async function adminUpdateIdeaStatus(
  ideaId: string,
  status: IdeaStatus
): Promise<ActionResult> {
  await requireAdmin();

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  await prisma.idea.update({
    where: { id: ideaId },
    data: { status },
  });

  revalidatePath("/admin/ideas");
  revalidatePath(`/idea/${idea.slug}`);
  revalidatePath("/explore");

  return { success: true, data: undefined };
}

// ═══════════════════════════════
// RESOLVE REPORT WITH CONTENT ACTION
// ═══════════════════════════════

export async function resolveReportWithAction(
  reportId: string,
  action: "dismiss" | "remove_content" | "ban_user" | "remove_and_ban"
): Promise<ActionResult> {
  await requireAdmin();

  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    return { success: false, error: "Report not found" };
  }

  if (report.status !== "PENDING" && report.status !== "REVIEWED") {
    return { success: false, error: "Report already resolved" };
  }

  // Determine report status based on action
  const newStatus: ReportStatus =
    action === "dismiss" ? "DISMISSED" : "ACTION_TAKEN";

  // Execute moderation action
  switch (action) {
    case "dismiss":
      // Just update report status
      break;

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

  // Update report status
  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: newStatus,
      resolvedAt: new Date(),
    },
  });

  // Also resolve all other pending reports targeting the same entity
  if (action !== "dismiss") {
    await prisma.report.updateMany({
      where: {
        entityType: report.entityType,
        entityId: report.entityId,
        status: "PENDING",
        id: { not: reportId },
      },
      data: {
        status: newStatus,
        resolvedAt: new Date(),
      },
    });
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin/ideas");
  revalidatePath("/admin/users");
  revalidatePath("/explore");

  return { success: true, data: undefined };
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
      const idea = await prisma.idea.findUnique({ where: { id: entityId } });
      if (idea && idea.status !== "REMOVED") {
        await prisma.idea.update({
          where: { id: entityId },
          data: { status: "REMOVED" },
        });
      }
      break;
    }
    case "comment": {
      const comment = await prisma.comment.findUnique({
        where: { id: entityId },
      });
      if (comment && !comment.isHidden) {
        await prisma.comment.update({
          where: { id: entityId },
          data: { isHidden: true },
        });
      }
      break;
    }
    case "user": {
      // For user reports, "remove content" means ban the user + remove their ideas
      const user = await prisma.user.findUnique({ where: { id: entityId } });
      if (user && !user.isBanned && !user.isAdmin) {
        await prisma.user.update({
          where: { id: entityId },
          data: { isBanned: true },
        });
        await prisma.idea.updateMany({
          where: { founderId: entityId, status: "ACTIVE" },
          data: { status: "REMOVED" },
        });
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

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: true },
  });

  // Remove all their active ideas
  await prisma.idea.updateMany({
    where: { founderId: userId, status: "ACTIVE" },
    data: { status: "REMOVED" },
  });
}

// ═══════════════════════════════
// GET REPORTED ENTITY DETAILS
// ═══════════════════════════════

export type ReportedEntity =
  | {
      type: "idea";
      data: {
        id: string;
        title: string;
        slug: string;
        status: IdeaStatus;
        founderName: string;
        founderUsername: string | null;
        founderId: string;
        isBanned: boolean;
      };
    }
  | {
      type: "comment";
      data: {
        id: string;
        content: string;
        isHidden: boolean;
        authorName: string;
        authorUsername: string | null;
        authorId: string;
        isBanned: boolean;
        ideaSlug: string;
      };
    }
  | {
      type: "user";
      data: {
        id: string;
        name: string;
        username: string | null;
        isBanned: boolean;
        isAdmin: boolean;
      };
    }
  | null;

export async function getReportedEntity(
  entityType: string,
  entityId: string
): Promise<ReportedEntity> {
  await requireAdmin();

  switch (entityType) {
    case "idea": {
      const idea = await prisma.idea.findUnique({
        where: { id: entityId },
        include: {
          founder: {
            select: {
              id: true,
              name: true,
              username: true,
              isBanned: true,
            },
          },
        },
      });
      if (!idea) return null;
      return {
        type: "idea",
        data: {
          id: idea.id,
          title: idea.title,
          slug: idea.slug,
          status: idea.status,
          founderName: idea.founder.name,
          founderUsername: idea.founder.username,
          founderId: idea.founder.id,
          isBanned: idea.founder.isBanned,
        },
      };
    }
    case "comment": {
      const comment = await prisma.comment.findUnique({
        where: { id: entityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              isBanned: true,
            },
          },
          idea: { select: { slug: true } },
        },
      });
      if (!comment) return null;
      return {
        type: "comment",
        data: {
          id: comment.id,
          content: comment.content,
          isHidden: comment.isHidden,
          authorName: comment.user.name,
          authorUsername: comment.user.username,
          authorId: comment.user.id,
          isBanned: comment.user.isBanned,
          ideaSlug: comment.idea.slug,
        },
      };
    }
    case "user": {
      const user = await prisma.user.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          username: true,
          isBanned: true,
          isAdmin: true,
        },
      });
      if (!user) return null;
      return {
        type: "user",
        data: user,
      };
    }
    default:
      return null;
  }
}
