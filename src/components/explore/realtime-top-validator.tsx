"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import type { UserLevel } from "@prisma/client";
import { LEVEL_LABELS } from "@/lib/constants";

interface TopValidatorData {
  name: string;
  username: string;
  image: string | null;
  level: UserLevel;
  reviewCount: number;
}

interface RealtimeTopValidatorProps {
  initialData: TopValidatorData | null;
}

export function RealtimeTopValidator({ initialData }: RealtimeTopValidatorProps) {
  const [topValidator, setTopValidator] = useState<TopValidatorData | null>(initialData);

  useEffect(() => {
    // Poll every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/leaderboard/top");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setTopValidator(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch top validator", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!topValidator) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-deep-ink p-4 text-white shadow-card transition-all">
      <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-saffron/20 blur-2xl" />
      
      <div className="flex items-center gap-2 mb-3 text-saffron">
        <Trophy className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Top Validator</span>
      </div>

      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10 shrink-0">
          {topValidator.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={topValidator.image} alt={topValidator.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[12px] font-bold">
              {topValidator.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-tight">{topValidator.name}</p>
          <p className="text-[10px] text-white/60">@{topValidator.username}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="font-medium text-white/60">
          <strong className="text-white font-data">{topValidator.reviewCount}</strong> votes
        </span>
        <span className="rounded-full bg-brand-green/20 px-1.5 py-0.5 font-semibold text-brand-green-light">
          {LEVEL_LABELS[topValidator.level]}
        </span>
      </div>
    </div>
  );
}
