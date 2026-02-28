import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { ScoreBadge } from "@/components/ideas/score-ring";
import { CATEGORY_EMOJIS, MIN_VOTES_FOR_SCORE } from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { IdeaFeedItem } from "@/types";
import type { Category } from "@prisma/client";

export function ProfileIdeaList({ ideas }: { ideas: IdeaFeedItem[] }) {
  const activeIdeas = ideas.filter((i) => i.status === "ACTIVE");

  return (
    <div className="mt-8">
      <h2 className="text-[17px] font-bold text-deep-ink">
        Ideas ({activeIdeas.length})
      </h2>

      {activeIdeas.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 p-8 text-center">
          <Lightbulb className="mx-auto h-6 w-6 text-text-muted" />
          <p className="mt-2 text-[13px] text-text-secondary">
            No published ideas yet.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {activeIdeas.map((idea) => (
            <Link
              key={idea.id}
              href={`/idea/${idea.slug}`}
              className="flex items-center justify-between rounded-xl border border-warm-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">
                    {CATEGORY_EMOJIS[idea.category as Category]}
                  </span>
                  <h3 className="truncate text-[15px] font-semibold text-deep-ink">
                    {idea.title}
                  </h3>
                </div>
                <p className="mt-1 line-clamp-1 text-[13px] text-text-secondary">
                  {idea.pitch}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-text-muted">
                  <span>{formatNumber(idea.totalVotes)} votes</span>
                  <span>{timeAgo(idea.createdAt)}</span>
                </div>
              </div>
              {idea.totalVotes >= MIN_VOTES_FOR_SCORE && (
                <ScoreBadge score={idea.validationScore} className="ml-3" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
