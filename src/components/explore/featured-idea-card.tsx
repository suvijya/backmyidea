"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Category } from "@prisma/client";

interface FeaturedIdeaCardProps {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  category: Category;
  validationScore: number;
}

export function FeaturedIdeaCard({
  id,
  slug,
  title,
  pitch,
  category,
  validationScore,
}: FeaturedIdeaCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-deep-ink p-6 md:p-8 text-white shadow-xl mb-8">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-saffron/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 -mb-16 h-48 w-48 rounded-full bg-brand-blue/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="rounded-full bg-saffron px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Featured
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {CATEGORY_LABELS[category]}
            </span>
          </div>

          <h2 className="font-display text-[28px] md:text-[36px] leading-tight mb-3">
            {title}
          </h2>
          <p className="text-[15px] text-white/70 line-clamp-2 md:line-clamp-none max-w-xl">
            {pitch}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <Link
              href={`/idea/${slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-saffron px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-saffron-dark"
            >
              View Details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Validation Score Badge */}
        <div className="shrink-0 flex flex-col items-center justify-center rounded-full border border-white/10 bg-deep-ink px-5 py-3 shadow-xl backdrop-blur-md self-start md:self-center">
          <div className="flex items-center gap-2 text-brand-green">
            <CheckCircle className="h-5 w-5" />
            <span className="font-data text-[24px] font-bold leading-none">{validationScore}%</span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/60 mt-1">
            Validation Score
          </span>
        </div>
      </div>
    </div>
  );
}