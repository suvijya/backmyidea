"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  CheckCheck,
  Vote,
  MessageSquare,
  Trophy,
  Award,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notification-actions";
import { timeAgo, cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/types";
import { useEffect } from "react";

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = useCallback(async (cursor?: string) => {
    const result = await getNotifications(cursor);
    return result;
  }, []);

  useEffect(() => {
    loadNotifications().then((result) => {
      setNotifications(result.notifications);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setIsLoading(false);
    });
  }, [loadNotifications]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const result = await loadNotifications(nextCursor);
    setNotifications((prev) => [...prev, ...result.notifications]);
    setNextCursor(result.nextCursor);
    setHasMore(result.hasMore);
    setIsLoadingMore(false);
  };

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      const result = await markNotificationRead(id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      } else {
        toast.error(result.error);
      }
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-deep-ink">
            Notifications
          </h1>
          <p className="mt-0.5 text-[14px] text-text-secondary">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="gap-1.5 border-warm-border text-text-secondary"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-warm-subtle"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 p-12 text-center">
          <BellOff className="mx-auto h-8 w-8 text-text-muted" />
          <h3 className="mt-3 text-[15px] font-semibold text-deep-ink">
            No notifications yet
          </h3>
          <p className="mt-1 text-[13px] text-text-secondary">
            When someone votes on your idea or replies to your comment,
            you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-2">
            <AnimatePresence initial={false}>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                    notification.isRead
                      ? "border-warm-border bg-white"
                      : "border-saffron/20 bg-saffron-light/30"
                  )}
                >
                  {/* Icon */}
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warm-subtle">
                    {NOTIFICATION_ICONS[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-deep-ink">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-[13px] text-text-secondary">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Mark as read */}
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      className="shrink-0 rounded-full p-1 text-saffron transition-colors hover:bg-saffron-light"
                      title="Mark as read"
                    >
                      <div className="h-2 w-2 rounded-full bg-saffron" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="gap-1.5 border-warm-border text-text-secondary"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
