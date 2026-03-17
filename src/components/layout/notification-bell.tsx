"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Bell, Vote, MessageSquare, TrendingUp, Trophy, Award, AlertCircle, Loader2 } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { NOTIFICATION_POLL_INTERVAL_MS } from "@/lib/constants";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNotifications, markNotificationRead } from "@/actions/notification-actions";
import type { NotificationItem, NotificationType } from "@/types";

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  NEW_VOTE: <Vote className="h-4 w-4 text-saffron" />,
  NEW_COMMENT: <MessageSquare className="h-4 w-4 text-brand-blue" />,
  COMMENT_REPLY: <MessageSquare className="h-4 w-4 text-brand-blue" />,
  SCORE_MILESTONE: <TrendingUp className="h-4 w-4 text-brand-green" />,
  VOTES_MILESTONE: <Trophy className="h-4 w-4 text-brand-amber" />,
  IDEA_TRENDING: <TrendingUp className="h-4 w-4 text-saffron" />,
  BADGE_EARNED: <Award className="h-4 w-4 text-brand-amber" />,
  SYSTEM: <AlertCircle className="h-4 w-4 text-text-muted" />,
};

export function NotificationBell() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json() as { count: number };
        setUnreadCount(data.count);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, NOTIFICATION_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isSignedIn, fetchUnread]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await getNotifications();
      // Show up to 5 most recent in the popover
      setNotifications(result.notifications.slice(0, 5));
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadNotifications();
    }
  };

  const getNotificationLink = (notification: NotificationItem) => {
    const data = notification.data as Record<string, any> | null;
    if (data?.link) return data.link;
    if (data?.ideaSlug) return `/idea/${data.ideaSlug}`;
    return "/dashboard";
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setOpen(false); // Close popover
    if (!notification.isRead) {
      startTransition(async () => {
        await markNotificationRead(notification.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });
    }
    router.push(getNotificationLink(notification));
  };

  if (!isSignedIn) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center rounded-md p-2 text-text-secondary transition-colors hover:bg-warm-hover hover:text-deep-ink outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-saffron font-data text-[10px] font-medium text-white",
                unreadCount > 9 ? "h-[18px] min-w-[18px] px-1" : "h-[16px] w-[16px]"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 shadow-elevated rounded-xl border border-warm-border bg-white" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-warm-border px-4 py-3">
          <h4 className="font-semibold text-[14px] text-deep-ink">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[11px] font-medium text-saffron bg-saffron-light/30 px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="flex flex-col max-h-[340px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-text-secondary">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex items-start gap-3 p-3 transition-colors cursor-pointer border-b border-warm-border last:border-0",
                  notification.isRead ? "bg-white hover:bg-warm-subtle" : "bg-saffron-light/10 hover:bg-saffron-light/20"
                )}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warm-subtle">
                  {NOTIFICATION_ICONS[notification.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[13px] truncate", notification.isRead ? "text-deep-ink" : "text-deep-ink font-medium")}>
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-secondary line-clamp-2 leading-snug">
                    {notification.body}
                  </p>
                  <p className="mt-1 text-[10px] text-text-muted">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-saffron" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="border-t border-warm-border p-2">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-[12px] font-medium text-text-secondary hover:text-deep-ink py-1.5 rounded-md hover:bg-warm-hover transition-colors"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
