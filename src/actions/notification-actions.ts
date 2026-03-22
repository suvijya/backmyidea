"use server";

import { getCachedUserPermissions } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import type { ActionResult, NotificationItem } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { NOTIFICATIONS_PAGE_SIZE } from "@/lib/constants";

// NOTE: createNotification has been moved to src/lib/notifications.ts
// (as createNotificationInternal) to prevent client-side invocation.
// Import from "@/lib/notifications" for internal server-side use.

// ═══════════════════════════════
// GET NOTIFICATIONS (paginated)
// ═══════════════════════════════

export async function getNotifications(
  cursor?: string
): Promise<{ notifications: NotificationItem[]; nextCursor?: string; hasMore: boolean }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { notifications: [], hasMore: false };
  }

  const notifications = await prisma.notification.findMany({
    where: { user: { clerkId } },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      data: true,
      isRead: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATIONS_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > NOTIFICATIONS_PAGE_SIZE;
  const items = hasMore ? notifications.slice(0, NOTIFICATIONS_PAGE_SIZE) : notifications;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { notifications: items, nextCursor, hasMore };
}

// ═══════════════════════════════
// GET UNREAD COUNT
// ═══════════════════════════════

export async function getUnreadNotificationCount(): Promise<number> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return 0;

  return prisma.notification.count({
    where: { user: { clerkId }, isRead: false },
  });
}

// ═══════════════════════════════
// MARK AS READ
// ═══════════════════════════════

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true, user: { select: { clerkId: true } } },
  });
  if (!notification || notification.user.clerkId !== clerkId) {
    return { success: false, error: "Notification not found" };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return { success: true, data: undefined };
}

// ═══════════════════════════════
// MARK ALL AS READ
// ═══════════════════════════════

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await getCachedUserPermissions(clerkId);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return { success: true, data: undefined };
}
