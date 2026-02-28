"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Briefcase,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { reviewInvestorRequest } from "@/actions/investor-actions";
import {
  CATEGORY_LABELS,
  INVESTOR_STAGE_LABELS,
  INVESTOR_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import type { Category, InvestorStagePreference, InvestorRequestStatus } from "@prisma/client";

type InvestorRequestData = {
  id: string;
  status: InvestorRequestStatus;
  firmName: string | null;
  linkedinUrl: string;
  investmentThesis: string;
  sectorInterests: string[];
  stagePreference: InvestorStagePreference;
  ticketSizeMin: number | null;
  ticketSizeMax: number | null;
  portfolioCompanies: string | null;
  website: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    image: string | null;
  };
};

export default function AdminInvestorsPage() {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<InvestorRequestData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  // Fetch requests from API
  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/investors?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests ?? []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load investor requests");
        setLoading(false);
      });
  }, [statusFilter]);

  const handleReview = (
    requestId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    startTransition(async () => {
      const note = reviewNote[requestId] ?? undefined;
      const result = await reviewInvestorRequest(requestId, decision, note);
      if (result.success) {
        toast.success(
          decision === "APPROVED"
            ? "Investor access approved"
            : "Request rejected"
        );
        // Remove from local list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        toast.error(result.error);
      }
    });
  };

  const statusColors: Record<InvestorRequestStatus, string> = {
    PENDING: "bg-brand-amber-light text-brand-amber",
    APPROVED: "bg-brand-green-light text-brand-green",
    REJECTED: "bg-brand-red-light text-brand-red",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-deep-ink">
            Investor Access Requests
          </h1>
          <p className="text-[13px] text-text-secondary">
            Review and approve investor access requests
          </p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[160px] border-warm-border text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-warm-border bg-white py-16 text-center">
          <Clock className="mb-3 h-10 w-10 text-text-muted" />
          <p className="text-[15px] font-medium text-deep-ink">
            No {statusFilter === "all" ? "" : statusFilter.toLowerCase()} requests
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-warm-border bg-white p-5"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-warm-border bg-warm-subtle">
                    {request.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={request.user.image}
                        alt={request.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-muted">
                        {request.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-deep-ink">
                      {request.user.name}
                    </p>
                    <p className="text-[12px] text-text-muted">
                      {request.user.email}
                      {request.user.username && ` (@${request.user.username})`}
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "text-[11px] font-medium",
                    statusColors[request.status]
                  )}
                >
                  {INVESTOR_REQUEST_STATUS_LABELS[request.status]}
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {request.firmName && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                      Firm
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[13px] text-deep-ink">
                      <Briefcase className="h-3.5 w-3.5 text-text-muted" />
                      {request.firmName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                    LinkedIn
                  </p>
                  <a
                    href={request.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 flex items-center gap-1 text-[13px] text-brand-blue hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Profile
                  </a>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                    Stage Preference
                  </p>
                  <p className="mt-0.5 text-[13px] text-deep-ink">
                    {INVESTOR_STAGE_LABELS[request.stagePreference]}
                  </p>
                </div>
                {(request.ticketSizeMin !== null || request.ticketSizeMax !== null) && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                      Ticket Size
                    </p>
                    <p className="mt-0.5 font-data text-[13px] text-deep-ink">
                      {request.ticketSizeMin !== null ? `${request.ticketSizeMin}L` : "?"}
                      {" - "}
                      {request.ticketSizeMax !== null ? `${request.ticketSizeMax}L` : "?"}
                    </p>
                  </div>
                )}
                {request.website && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                      Website
                    </p>
                    <a
                      href={request.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-[13px] text-brand-blue hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {request.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>

              {/* Sectors */}
              <div className="mb-3">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Sector Interests
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {request.sectorInterests.map((sector) => (
                    <Badge
                      key={sector}
                      variant="secondary"
                      className="border-warm-border bg-warm-subtle text-[11px] text-text-secondary"
                    >
                      {CATEGORY_LABELS[sector as Category] ?? sector}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Thesis */}
              <div className="mb-4">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Investment Thesis
                </p>
                <p className="text-[13px] leading-relaxed text-text-secondary">
                  {request.investmentThesis}
                </p>
              </div>

              {/* Portfolio */}
              {request.portfolioCompanies && (
                <div className="mb-4">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                    Portfolio Companies
                  </p>
                  <p className="text-[13px] text-text-secondary">
                    {request.portfolioCompanies}
                  </p>
                </div>
              )}

              {/* Actions (only for pending) */}
              {request.status === "PENDING" && (
                <div className="border-t border-warm-border pt-4">
                  <Textarea
                    value={reviewNote[request.id] ?? ""}
                    onChange={(e) =>
                      setReviewNote((prev) => ({
                        ...prev,
                        [request.id]: e.target.value,
                      }))
                    }
                    placeholder="Optional review note (visible to applicant on rejection)..."
                    className="mb-3 resize-none border-warm-border text-[13px]"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-brand-green text-white hover:bg-brand-green/90"
                          disabled={isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Approve Investor Access?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will create an investor profile for{" "}
                            <strong>{request.user.name}</strong> and grant them
                            access to the investor dashboard. They&apos;ll be
                            notified.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-warm-border">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleReview(request.id, "APPROVED")
                            }
                            className="bg-brand-green text-white hover:bg-brand-green/90"
                          >
                            Approve Access
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-warm-border text-brand-red hover:bg-brand-red-light"
                          disabled={isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Reject Request?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reject the investor access request from{" "}
                            <strong>{request.user.name}</strong>. They can
                            reapply later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-warm-border">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleReview(request.id, "REJECTED")
                            }
                            className="bg-brand-red text-white hover:bg-brand-red/90"
                          >
                            Reject Request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {isPending && (
                      <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                    )}
                  </div>
                </div>
              )}

              {/* Review note (for already reviewed) */}
              {request.reviewNote && request.status !== "PENDING" && (
                <div className="border-t border-warm-border pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                    Review Note
                  </p>
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {request.reviewNote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
