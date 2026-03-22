import Link from "next/link";
import { Suspense } from "react";
import { Vote, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/clerk";
import { getUserVotes } from "@/actions/vote-actions";
import { ScoreBadge } from "@/components/ideas/score-ring";
import {
  VOTE_TYPE_LABELS,
  VOTE_TYPE_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  MIN_VOTES_FOR_SCORE,
} from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";
import { timeAgo, formatNumber } from "@/lib/utils";
import type { VoteType, Category } from "@prisma/client";

const VOTE_COLORS: Record<VoteType, string> = {
  USE_THIS: "bg-brand-green-light text-brand-green border-brand-green/20",
  MAYBE: "bg-brand-amber-light text-brand-amber border-brand-amber/20",
  NOT_FOR_ME: "bg-brand-red-light text-brand-red border-brand-red/20",
};

async function VotesLoader({ userId }: { userId: string }) {
  const votes = await getUserVotes(userId);

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[28px] leading-tight text-deep-ink">
          My Votes
        </h1>
        <p className="mt-0.5 text-[14px] text-text-secondary">
          {votes.length} {votes.length === 1 ? "idea" : "ideas"} you&apos;ve voted on
        </p>
      </div>

      {votes.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 p-12 text-center">
          <Vote className="mx-auto h-8 w-8 text-text-muted" />
          <h3 className="mt-3 text-[15px] font-semibold text-deep-ink">
            No votes yet
          </h3>
          <p className="mt-1 text-[13px] text-text-secondary">
            Start exploring ideas and cast your first vote.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-saffron px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-saffron-dark"
          >
            Explore ideas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {votes.map((vote: any) => (
            <Link
              key={vote.id}
              href={`/idea/${vote.idea.slug}`}
              className="flex items-center gap-4 rounded-xl border border-warm-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              {/* Vote type badge */}
              <div
                className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium ${VOTE_COLORS[vote.type as VoteType]}`}
              >
                <span>{VOTE_TYPE_EMOJIS[vote.type as VoteType]}</span>
                <span className="hidden sm:inline">
                  {VOTE_TYPE_LABELS[vote.type as VoteType]}
                </span>
              </div>

              {/* Idea info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold text-deep-ink">
                  {vote.idea.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-text-muted">
                  <span className="flex items-center gap-1">
                    {vote.idea.founder.image ? (
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={vote.idea.founder.image} />
                        <AvatarFallback className="text-[8px]">
                          {vote.idea.founder.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                    {vote.idea.founder.name}
                  </span>
                  <span>·</span>
                  <span>
                    {CATEGORY_EMOJIS[vote.idea.category as Category]}{" "}
                    {CATEGORY_LABELS[vote.idea.category as Category]}
                  </span>
                  <span>·</span>
                  <span>{timeAgo(vote.createdAt)}</span>
                </div>
              </div>

              {/* Score + votes */}
              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="font-data text-[12px] font-medium text-text-muted">
                    {formatNumber(vote.idea.totalVotes)} votes
                  </p>
                </div>
                {vote.idea.totalVotes >= MIN_VOTES_FOR_SCORE && (
                  <ScoreBadge score={vote.idea.validationScore} />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default async function MyVotesPage() {
  const user = await requireUser();

  return (
    <div>
      <Suspense fallback={
        <div>
          <div className="mb-6">
            <Skeleton className="h-[34px] w-48 mb-1" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-[74px] w-full rounded-xl" />
            <Skeleton className="h-[74px] w-full rounded-xl" />
            <Skeleton className="h-[74px] w-full rounded-xl" />
          </div>
        </div>
      }>
        <VotesLoader userId={user.id} />
      </Suspense>
    </div>
  );
}
