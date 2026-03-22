"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Flag,
  Check,
  X,
  Eye,
  AlertTriangle,
  Clock,
  ShieldBan,
  Trash2,
  ExternalLink,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn, timeAgo } from "@/lib/utils";
import type { ReportWithDetails } from "@/types";
import type { ReportStatus, ReportReason } from "@prisma/client";

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACTION_TAKEN", label: "Action Taken" },
  { value: "DISMISSED", label: "Dismissed" },
];

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam",
  INAPPROPRIATE: "Inappropriate",
  STOLEN_IDEA: "Stolen Idea",
  FAKE: "Fake",
  HARASSMENT: "Harassment",
  OTHER: "Other",
};

const STATUS_BADGE_STYLES: Record<ReportStatus, string> = {
  PENDING: "bg-brand-amber-light text-brand-amber border-brand-amber/20",
  REVIEWED: "bg-brand-blue-light text-brand-blue border-brand-blue/20",
  ACTION_TAKEN: "bg-brand-green-light text-brand-green border-brand-green/20",
  DISMISSED: "bg-warm-subtle text-text-muted border-warm-border",
};

type ModerationAction = "dismiss" | "remove_content" | "ban_user" | "remove_and_ban";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>("PENDING");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    report: ReportWithDetails;
    action: ModerationAction;
  } | null>(null);

  const fetchReports = useCallback(
    async (append = false) => {
      try {
        if (!append) setLoading(true);
        const params = new URLSearchParams({ status: statusFilter });
        if (append && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/reports?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch reports");

        const data = (await res.json()) as {
          reports: ReportWithDetails[];
          hasMore: boolean;
          nextCursor: string | null;
        };

        if (append) {
          setReports((prev) => [...prev, ...data.reports]);
        } else {
          setReports(data.reports);
        }
        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      } catch {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, cursor]
  );

  useEffect(() => {
    setCursor(null);
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleModeration(
    reportId: string,
    action: ModerationAction
  ) {
    setUpdatingId(reportId);
    setConfirmDialog(null);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action }),
      });
      if (!res.ok) throw new Error("Failed to update report");

      const newStatus: ReportStatus =
        action === "dismiss" ? "DISMISSED" : "ACTION_TAKEN";

      // Remove from list if filtered by PENDING
      if (statusFilter === "PENDING") {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } else {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status: newStatus, resolvedAt: new Date().toISOString() }
              : r
          ) as ReportWithDetails[]
        );
      }

      const actionLabels: Record<ModerationAction, string> = {
        dismiss: "Report dismissed",
        remove_content: "Content removed",
        ban_user: "User banned",
        remove_and_ban: "Content removed & user banned",
      };
      toast.success(actionLabels[action]);
    } catch {
      toast.error("Failed to update report");
    } finally {
      setUpdatingId(null);
    }
  }

  function getEntityLink(report: ReportWithDetails): string | null {
    switch (report.entityType) {
      case "idea":
        // We don't have slug here, but entityId can be used via admin ideas
        return `/admin/ideas`;
      case "user":
        return `/admin/users`;
      case "comment":
        return null;
      default:
        return null;
    }
  }

  function getActionLabel(action: ModerationAction, entityType: string): string {
    switch (action) {
      case "dismiss":
        return "Dismiss Report";
      case "remove_content":
        return entityType === "idea"
          ? "Remove Idea"
          : entityType === "comment"
            ? "Hide Comment"
            : "Ban User";
      case "ban_user":
        return "Ban Author";
      case "remove_and_ban":
        return entityType === "idea"
          ? "Remove Idea & Ban Founder"
          : entityType === "comment"
            ? "Hide Comment & Ban Author"
            : "Ban User";
    }
  }

  function getConfirmDescription(action: ModerationAction, entityType: string): string {
    switch (action) {
      case "dismiss":
        return "This report will be dismissed. No action will be taken on the reported content.";
      case "remove_content":
        if (entityType === "idea") return "The reported idea will be removed from public feeds. All pending reports on this idea will also be resolved.";
        if (entityType === "comment") return "The reported comment will be hidden. All pending reports on this comment will also be resolved.";
        return "The reported user will be banned and their ideas removed.";
      case "ban_user":
        return "The author of this content will be banned from the platform. All their active ideas will also be removed. All pending reports on this entity will be resolved.";
      case "remove_and_ban":
        return "The content will be removed AND the author will be banned. All their active ideas will also be removed. All pending reports will be resolved.";
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-deep-ink">Reports</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            Review and moderate reported content
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ReportStatus)}
        >
          <SelectTrigger className="w-full border-warm-border sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-warm-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-warm-border bg-white py-16 text-center">
          <Flag className="mx-auto mb-3 h-10 w-10 text-text-disabled" />
          <p className="text-[15px] font-medium text-text-secondary">
            No {statusFilter.toLowerCase().replace("_", " ")} reports
          </p>
          <p className="mt-1 text-[13px] text-text-muted">
            {statusFilter === "PENDING"
              ? "All clear! No reports need review."
              : "No reports with this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const entityLink = getEntityLink(report);

            return (
              <Card
                key={report.id}
                className={cn(
                  "border-warm-border transition-shadow hover:shadow-card",
                  updatingId === report.id && "opacity-60 pointer-events-none"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: Report Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={report.user.image ?? undefined} />
                        <AvatarFallback className="bg-warm-subtle text-[13px] font-semibold text-text-secondary">
                          {report.user.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-deep-ink">
                            {report.user.name}
                          </span>
                          <span className="text-[13px] text-text-muted">
                            @{report.user.username}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px] font-medium",
                              STATUS_BADGE_STYLES[report.status as ReportStatus]
                            )}
                          >
                            {report.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
                          <Badge
                            variant="outline"
                            className="border-warm-border text-[11px]"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {REASON_LABELS[report.reason as ReportReason]}
                          </Badge>
                          <span className="text-text-muted">
                            {report.entityType}{" "}
                            <code className="font-data text-[11px]">
                              #{report.entityId.slice(0, 8)}
                            </code>
                          </span>
                          <span className="flex items-center gap-1 text-text-muted">
                            <Clock className="h-3 w-3" />
                            {timeAgo(report.createdAt)}
                          </span>
                          {entityLink && (
                            <Link
                              href={entityLink}
                              className="flex items-center gap-1 text-saffron hover:text-saffron-dark transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View in admin
                            </Link>
                          )}
                        </div>

                        {report.details && (
                          <p className="mt-2 text-[13px] text-text-secondary leading-relaxed rounded-lg bg-warm-subtle px-3 py-2 border border-warm-border">
                            &ldquo;{report.details}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {(report.status === "PENDING" ||
                      report.status === "REVIEWED") && (
                      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
                        {updatingId === report.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                        ) : (
                          <>
                            {/* Quick dismiss */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 border-warm-border text-[13px]"
                              onClick={() =>
                                setConfirmDialog({
                                  report,
                                  action: "dismiss",
                                })
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                              Dismiss
                            </Button>

                            {/* Moderation actions dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-8 gap-1.5 bg-brand-red text-[13px] text-white hover:bg-brand-red/90"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Take Action
                                  <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmDialog({
                                      report,
                                      action: "remove_content",
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {getActionLabel(
                                    "remove_content",
                                    report.entityType
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmDialog({
                                      report,
                                      action: "ban_user",
                                    })
                                  }
                                >
                                  <ShieldBan className="mr-2 h-4 w-4" />
                                  {getActionLabel(
                                    "ban_user",
                                    report.entityType
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmDialog({
                                      report,
                                      action: "remove_and_ban",
                                    })
                                  }
                                  className="text-brand-red focus:text-brand-red"
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  {getActionLabel(
                                    "remove_and_ban",
                                    report.entityType
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                className="border-warm-border"
                onClick={() => fetchReports(true)}
              >
                Load More Reports
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog &&
                getActionLabel(confirmDialog.action, confirmDialog.report.entityType)}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog &&
                getConfirmDescription(
                  confirmDialog.action,
                  confirmDialog.report.entityType
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-warm-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDialog &&
                handleModeration(confirmDialog.report.id, confirmDialog.action)
              }
              className={
                confirmDialog?.action === "dismiss"
                  ? "bg-warm-subtle text-deep-ink hover:bg-warm-hover border border-warm-border"
                  : "bg-brand-red hover:bg-brand-red/90"
              }
            >
              {confirmDialog?.action === "dismiss"
                ? "Dismiss"
                : "Confirm Action"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
