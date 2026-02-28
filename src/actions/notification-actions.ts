"use server";

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

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) {
    return { notifications: [], hasMore: false };
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
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

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return 0;

  return prisma.notification.count({
    where: { userId: user.id, isRead: false },
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

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });
  if (!notification || notification.userId !== user.id) {
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

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return { success: true, data: undefined };
}
