"use client";

import { useState, useTransition, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { castVote } from "@/actions/vote-actions";
import type { VoteType } from "@prisma/client";

interface VoteButtonsProps {
  ideaId: string;
  useThisCount: number;
  maybeCount: number;
  notForMeCount: number;
  userVote?: VoteType | null;
  isOwnIdea?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
}

const VOTE_CONFIG = {
  USE_THIS: {
    emoji: "\uD83D\uDD25",
    label: "I'd Use This",
    activeClasses: "border-brand-green bg-brand-green-light text-brand-green",
    hoverClasses: "hover:border-brand-green/50 hover:bg-brand-green-light/50",
  },
  MAYBE: {
    emoji: "\uD83E\uDD14",
    label: "Maybe",
    activeClasses: "border-brand-amber bg-brand-amber-light text-brand-amber",
    hoverClasses: "hover:border-brand-amber/50 hover:bg-brand-amber-light/50",
  },
  NOT_FOR_ME: {
    emoji: "\uD83D\uDC4E",
    label: "Not For Me",
    activeClasses: "border-brand-red bg-brand-red-light text-brand-red",
    hoverClasses: "hover:border-brand-red/50 hover:bg-brand-red-light/50",
  },
} as const;

export function VoteButtons({
  ideaId,
  useThisCount: initialUseThis,
  maybeCount: initialMaybe,
  notForMeCount: initialNotForMe,
  userVote: initialVote = null,
  isOwnIdea = false,
  layout = "horizontal",
  className,
}: VoteButtonsProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentVote, setCurrentVote] = useState<VoteType | null>(initialVote);
  const [counts, setCounts] = useState({
    USE_THIS: initialUseThis,
    MAYBE: initialMaybe,
    NOT_FOR_ME: initialNotForMe,
  });
  const [flyingVote, setFlyingVote] = useState<VoteType | null>(null);
  const flyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleVote = (voteType: VoteType) => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isOwnIdea || isPending) return;

    // Guard: clicking the already-selected vote type is a no-op
    if (currentVote === voteType) return;

    // Optimistic update
    const previousVote = currentVote;
    const previousCounts = { ...counts };

    // If changing vote, decrement old and increment new
    if (previousVote && previousVote !== voteType) {
      setCounts((prev) => ({
        ...prev,
        [previousVote]: Math.max(0, prev[previousVote] - 1),
        [voteType]: prev[voteType] + 1,
      }));
    } else if (!previousVote) {
      setCounts((prev) => ({
        ...prev,
        [voteType]: prev[voteType] + 1,
      }));
    }

    setCurrentVote(voteType);

    // Fly-up animation
    setFlyingVote(voteType);
    if (flyTimeoutRef.current) clearTimeout(flyTimeoutRef.current);
    flyTimeoutRef.current = setTimeout(() => setFlyingVote(null), 400);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("ideaId", ideaId);
      fd.append("type", voteType);
      const result = await castVote(fd);
      if (!result.success) {
        // Revert on failure
        setCurrentVote(previousVote);
        setCounts(previousCounts);
        toast.error(result.error);
      }
    });
  };

  const voteTypes: VoteType[] = ["USE_THIS", "MAYBE", "NOT_FOR_ME"];

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "vertical" ? "flex-col" : "flex-row",
        className
      )}
    >
      {voteTypes.map((type) => {
        const config = VOTE_CONFIG[type];
        const isSelected = currentVote === type;
        const count = counts[type];

        return (
          <button
            key={type}
            onClick={() => handleVote(type)}
            disabled={isOwnIdea || isPending}
            className={cn(
              "group relative flex flex-1 items-center justify-center gap-1.5 rounded-md border-[1.5px] px-3 text-[13px] font-medium transition-all duration-150",
              layout === "vertical" ? "h-[48px]" : "h-[40px]",
              isOwnIdea && "cursor-not-allowed opacity-50",
              isSelected
                ? config.activeClasses
                : [
                    "border-warm-border bg-warm-subtle text-text-secondary",
                    !isOwnIdea && config.hoverClasses,
                    !isOwnIdea && "hover:bg-white hover:shadow-sm active:scale-[0.97]",
                  ],
              !isSelected &&
                currentVote &&
                "opacity-60"
            )}
          >
            <span className="text-[15px]">{config.emoji}</span>
            <span className="hidden sm:inline">{config.label}</span>
            <span className="font-data text-[12px]">{count}</span>

            {/* Fly-up +1 animation */}
            {flyingVote === type && (
              <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 animate-vote-fly font-data text-[12px] font-semibold text-brand-green">
                +1
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
