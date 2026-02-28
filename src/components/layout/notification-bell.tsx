"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATION_POLL_INTERVAL_MS } from "@/lib/constants";

export function NotificationBell() {
  const { isSignedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json() as { count: number };
        setUnreadCount(data.count);
      }
    } catch {
      // Silently fail — notification count is non-critical
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;

    fetchUnread();
    const interval = setInterval(fetchUnread, NOTIFICATION_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isSignedIn, fetchUnread]);

  if (!isSignedIn) return null;

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex items-center justify-center rounded-md p-2 text-text-secondary transition-colors hover:bg-warm-hover hover:text-deep-ink"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="h-[18px] w-[18px]" />
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-saffron font-data text-[10px] font-medium text-white",
            unreadCount > 9
              ? "h-[18px] min-w-[18px] px-1"
              : "h-[16px] w-[16px]"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
