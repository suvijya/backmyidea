"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toggleDonations } from "@/actions/payment-actions";

interface DonationsToggleProps {
  ideaId: string;
  initialEnabled: boolean;
}

export function DonationsToggle({
  ideaId,
  initialEnabled,
}: DonationsToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await toggleDonations(ideaId, checked);
      if (result.success) {
        setEnabled(checked);
        toast.success(
          checked ? "Donations enabled" : "Donations disabled"
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[14px] font-medium text-deep-ink">
          Accept Donations
        </p>
        <p className="text-[12px] text-text-muted">
          {enabled
            ? "Supporters can donate to this idea"
            : "Enable to let supporters back your idea"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
        )}
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>
    </div>
  );
}
