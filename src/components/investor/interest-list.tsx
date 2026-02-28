"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Briefcase,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { respondToInterest } from "@/actions/investor-actions";
import type { InterestStatus } from "@prisma/client";

interface InvestorInterestItem {
  id: string;
  status: InterestStatus;
  message: string | null;
  createdAt: string;
  investor: {
    id: string;
    firmName: string | null;
    linkedinUrl: string;
    investmentThesis: string;
    user: {
      id: string;
      name: string;
      username: string | null;
      image: string | null;
    };
  };
}

interface InvestorInterestListProps {
  interests: InvestorInterestItem[];
}

const STATUS_STYLES: Record<InterestStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-brand-amber-light text-brand-amber" },
  ACCEPTED: { label: "Accepted", className: "bg-brand-green-light text-brand-green" },
  DECLINED: { label: "Declined", className: "bg-brand-red-light text-brand-red" },
};

export function InvestorInterestList({ interests: initialInterests }: InvestorInterestListProps) {
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState(initialInterests);

  const handleRespond = (interestId: string, response: "ACCEPTED" | "DECLINED") => {
    startTransition(async () => {
      const result = await respondToInterest(interestId, response);
      if (result.success) {
        setInterests((prev) =>
          prev.map((i) =>
            i.id === interestId ? { ...i, status: response } : i
          )
        );
        toast.success(
          response === "ACCEPTED"
            ? "Interest accepted! The investor will be notified."
            : "Interest declined."
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  if (interests.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-warm-border bg-white p-5">
      <h3 className="mb-4 text-[15px] font-semibold text-deep-ink">
        Investor Interest ({interests.length})
      </h3>
      <div className="space-y-4">
        {interests.map((interest) => {
          const statusInfo = STATUS_STYLES[interest.status];
          return (
            <div
              key={interest.id}
              className="rounded-lg border border-warm-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 overflow-hidden rounded-full border border-warm-border bg-warm-subtle">
                    {interest.investor.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={interest.investor.user.image}
                        alt={interest.investor.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-muted">
                        {interest.investor.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-deep-ink">
                      {interest.investor.user.name}
                    </p>
                    {interest.investor.firmName && (
                      <p className="flex items-center gap-1 text-[12px] text-text-muted">
                        <Briefcase className="h-3 w-3" />
                        {interest.investor.firmName}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={cn("text-[11px]", statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
              </div>

              {/* Message */}
              {interest.message && (
                <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                  &quot;{interest.message}&quot;
                </p>
              )}

              {/* LinkedIn */}
              <a
                href={interest.investor.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-brand-blue hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View LinkedIn Profile
              </a>

              {/* Actions (only for pending) */}
              {interest.status === "PENDING" && (
                <div className="mt-3 flex items-center gap-2 border-t border-warm-border pt-3">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(interest.id, "ACCEPTED")}
                    disabled={isPending}
                    className="h-7 gap-1 bg-brand-green text-[12px] text-white hover:bg-brand-green/90"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRespond(interest.id, "DECLINED")}
                    disabled={isPending}
                    className="h-7 gap-1 border-warm-border text-[12px] text-text-secondary hover:text-brand-red"
                  >
                    <XCircle className="h-3 w-3" />
                    Decline
                  </Button>
                  {isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
