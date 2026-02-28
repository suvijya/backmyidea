"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createReport } from "@/actions/report-actions";
import type { ReportReason } from "@prisma/client";

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "SPAM", label: "Spam", description: "Promotional or repetitive content" },
  { value: "INAPPROPRIATE", label: "Inappropriate", description: "Offensive or harmful content" },
  { value: "STOLEN_IDEA", label: "Stolen Idea", description: "This idea was copied from someone else" },
  { value: "FAKE", label: "Fake / Misleading", description: "False claims or misleading information" },
  { value: "HARASSMENT", label: "Harassment", description: "Targeting or bullying someone" },
  { value: "OTHER", label: "Other", description: "Something else not listed above" },
];

interface ReportModalProps {
  entityType: "idea" | "comment" | "user";
  entityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportModal({
  entityType,
  entityId,
  open,
  onOpenChange,
}: ReportModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!selectedReason) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      fd.append("reason", selectedReason);
      if (details.trim()) {
        fd.append("details", details.trim());
      }

      const result = await createReport(fd);

      if (result.success) {
        toast.success("Report submitted. We'll review it shortly.");
        onOpenChange(false);
        setSelectedReason(null);
        setDetails("");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedReason(null);
      setDetails("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[20px] text-deep-ink">
            <Flag className="h-4 w-4 text-brand-red" />
            Report this {entityType}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-text-secondary">
            Help us keep BackMyIdea safe. Select a reason below.
          </DialogDescription>
        </DialogHeader>

        {/* Reason selection */}
        <div className="mt-2 space-y-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.value}
              onClick={() => setSelectedReason(reason.value)}
              disabled={isPending}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors",
                selectedReason === reason.value
                  ? "border-brand-red bg-brand-red-light"
                  : "border-warm-border bg-white hover:border-warm-border-strong"
              )}
            >
              <p
                className={cn(
                  "text-[13px] font-semibold",
                  selectedReason === reason.value
                    ? "text-brand-red"
                    : "text-deep-ink"
                )}
              >
                {reason.label}
              </p>
              <p className="text-[12px] text-text-muted">{reason.description}</p>
            </button>
          ))}
        </div>

        {/* Optional details */}
        {selectedReason && (
          <div className="mt-3">
            <Label
              htmlFor="report-details"
              className="text-[13px] font-semibold text-deep-ink"
            >
              Additional details (optional)
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={300}
              placeholder="Provide more context to help us review..."
              rows={3}
              className="mt-1.5 resize-none input-focus-ring text-[13px]"
              disabled={isPending}
            />
            <p className="mt-1 text-right text-[11px] text-text-muted">
              {details.length}/300
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="border-warm-border text-text-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isPending}
            className="gap-1.5 bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
