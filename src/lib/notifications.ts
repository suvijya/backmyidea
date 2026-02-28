// NOTE: This file intentionally does NOT have "use server" — the
// createNotificationInternal function is an internal helper that should only
// be called from server-side code. The public-facing notification actions
// (getNotifications, markNotificationRead, etc.) remain in
// src/actions/notification-actions.ts as proper server actions with auth checks.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { NotificationType } from "@prisma/client";

export async function createNotificationInternal(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ?? Prisma.JsonNull,
    },
  });
}
