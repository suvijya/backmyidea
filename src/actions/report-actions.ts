"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { commentLimiter } from "@/lib/redis";
import { createReportSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

// ═══════════════════════════════
// CREATE REPORT
// ═══════════════════════════════

export async function createReport(
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || !user.onboarded) {
    return { success: false, error: "Complete onboarding first" };
  }

  if (user.isBanned) {
    return { success: false, error: "Your account is restricted" };
  }

  const raw = {
    entityType: formData.get("entityType") as string,
    entityId: formData.get("entityId") as string,
    reason: formData.get("reason") as string,
    details: (formData.get("details") as string) || undefined,
  };

  const parsed = createReportSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  // Rate limit: reuse comment limiter (10/hour is reasonable for reports too)
  const { success: withinLimit } = await commentLimiter.limit(
    `report:${user.id}`
  );
  if (!withinLimit) {
    return { success: false, error: "Too many reports submitted. Try again later." };
  }

  const data = parsed.data;

  // Prevent duplicate reports by same user on same entity
  const existingReport = await prisma.report.findFirst({
    where: {
      userId: user.id,
      entityType: data.entityType,
      entityId: data.entityId,
      status: "PENDING",
    },
  });

  if (existingReport) {
    return { success: false, error: "You have already reported this. We are reviewing it." };
  }

  // Validate the entity exists and determine ideaId for linking
  let ideaId: string | null = null;

  switch (data.entityType) {
    case "idea": {
      const idea = await prisma.idea.findUnique({
        where: { id: data.entityId },
        select: { id: true, founderId: true },
      });
      if (!idea) {
        return { success: false, error: "Idea not found" };
      }
      // Cannot report own idea
      if (idea.founderId === user.id) {
        return { success: false, error: "You cannot report your own idea" };
      }
      ideaId = idea.id;
      break;
    }
    case "comment": {
      const comment = await prisma.comment.findUnique({
        where: { id: data.entityId },
        select: { id: true, userId: true, ideaId: true },
      });
      if (!comment) {
        return { success: false, error: "Comment not found" };
      }
      if (comment.userId === user.id) {
        return { success: false, error: "You cannot report your own comment" };
      }
      ideaId = comment.ideaId;
      break;
    }
    case "user": {
      const targetUser = await prisma.user.findUnique({
        where: { id: data.entityId },
        select: { id: true },
      });
      if (!targetUser) {
        return { success: false, error: "User not found" };
      }
      if (targetUser.id === user.id) {
        return { success: false, error: "You cannot report yourself" };
      }
      break;
    }
  }

  await prisma.report.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      reason: data.reason,
      details: data.details || null,
      userId: user.id,
      ideaId,
    },
  });

  revalidatePath("/admin/reports");

  return { success: true, data: undefined };
}
