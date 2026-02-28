"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DonateButtonProps {
  onClick: () => void;
  totalDonations: number;
  donorCount: number;
}

export function DonateButton({
  onClick,
  totalDonations,
  donorCount,
}: DonateButtonProps) {
  const rupees = totalDonations / 100;
  const formattedAmount =
    rupees >= 1000
      ? `₹${(rupees / 1000).toFixed(rupees % 1000 === 0 ? 0 : 1)}K`
      : `₹${rupees.toFixed(0)}`;

  return (
    <div className="rounded-[12px] border border-warm-border bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-saffron" />
        <h3 className="text-[14px] font-semibold text-deep-ink">
          Back this idea
        </h3>
      </div>

      {donorCount > 0 && (
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-data text-[24px] font-bold text-deep-ink">
            {formattedAmount}
          </span>
          <span className="text-[12px] text-text-muted">
            raised from {donorCount} {donorCount === 1 ? "supporter" : "supporters"}
          </span>
        </div>
      )}

      <Button
        onClick={onClick}
        className="mt-3 w-full gap-1.5 bg-saffron text-white hover:bg-saffron-dark"
        size="sm"
      >
        <Heart className="h-3.5 w-3.5" />
        Donate
      </Button>

      <p className="mt-2 text-center text-[11px] text-text-muted">
        100% goes to the founder (minus platform fee)
      </p>
    </div>
  );
}
