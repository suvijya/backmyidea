"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Check, X, Eye, AlertTriangle, Clock } from "lucide-react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>("PENDING");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

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

  async function updateReportStatus(
    reportId: string,
    newStatus: ReportStatus
  ) {
    setUpdatingId(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update report");

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: newStatus,
                resolvedAt:
                  newStatus !== "PENDING" ? new Date().toISOString() : null,
              }
            : r
        ) as ReportWithDetails[]
      );
      toast.success(`Report marked as ${newStatus.toLowerCase().replace("_", " ")}`);
    } catch {
      toast.error("Failed to update report");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-deep-ink">Reports</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            Review and manage content reports
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ReportStatus)}
        >
          <SelectTrigger className="w-[180px] border-warm-border">
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
          {reports.map((report) => (
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
                            STATUS_BADGE_STYLES[report.status]
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
                          {REASON_LABELS[report.reason]}
                        </Badge>
                        <span className="text-text-muted">
                          {report.entityType} #{report.entityId.slice(0, 8)}
                        </span>
                        <span className="flex items-center gap-1 text-text-muted">
                          <Clock className="h-3 w-3" />
                          {timeAgo(report.createdAt)}
                        </span>
                      </div>

                      {report.details && (
                        <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
                          &ldquo;{report.details}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {report.status === "PENDING" && (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 border-warm-border text-[13px]"
                        onClick={() =>
                          updateReportStatus(report.id, "DISMISSED")
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 border-warm-border text-[13px]"
                        onClick={() =>
                          updateReportStatus(report.id, "REVIEWED")
                        }
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Reviewed
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 bg-brand-red text-[13px] text-white hover:bg-brand-red/90"
                        onClick={() =>
                          updateReportStatus(report.id, "ACTION_TAKEN")
                        }
                      >
                        <Check className="h-3.5 w-3.5" />
                        Action
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

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
    </div>
  );
}
