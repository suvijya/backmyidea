import Link from "next/link";
import { Plus, Lightbulb, Vote, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/clerk";
import { getDashboardStats, getDashboardIdeas } from "@/actions/user-actions";
import { ScoreBadge } from "@/components/ideas/score-ring";
import { SCORE_TIER_LABELS, MIN_VOTES_FOR_SCORE } from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { ScoreTier } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, ideas] = await Promise.all([
    getDashboardStats(user.id),
    getDashboardIdeas(user.id),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-deep-ink">
            Dashboard
          </h1>
          <p className="mt-0.5 text-[14px] text-text-secondary">
            Welcome back, {user.name?.split(" ")[0] ?? "there"}
          </p>
        </div>
        <Link href="/dashboard/ideas/new">
          <Button className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark">
            <Plus className="h-4 w-4" />
            New Idea
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Lightbulb className="h-5 w-5 text-saffron" />}
          label="Ideas"
          value={stats.totalIdeas}
        />
        <StatCard
          icon={<Vote className="h-5 w-5 text-brand-green" />}
          label="Votes Received"
          value={stats.totalVotesReceived}
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5 text-brand-blue" />}
          label="Comments"
          value={stats.totalCommentsReceived}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-brand-amber" />}
          label="Avg Score"
          value={stats.averageScore}
        />
      </div>

      {/* My Ideas List */}
      <div className="mt-8">
        <h2 className="text-[17px] font-bold text-deep-ink">Your Ideas</h2>
        {ideas.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 p-12 text-center">
            <Lightbulb className="mx-auto h-8 w-8 text-text-muted" />
            <h3 className="mt-3 text-[15px] font-semibold text-deep-ink">
              No ideas yet
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              Post your first startup idea and get it validated by real people.
            </p>
            <Link href="/dashboard/ideas/new">
              <Button
                size="sm"
                className="mt-4 gap-1.5 bg-saffron text-white hover:bg-saffron-dark"
              >
                <Plus className="h-3.5 w-3.5" />
                Post your first idea
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                href={`/idea/${idea.slug}`}
                className="flex items-center justify-between rounded-xl border border-warm-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-deep-ink">
                      {idea.title}
                    </h3>
                    {idea.status === "ARCHIVED" && (
                      <span className="rounded-full bg-brand-amber-light px-2 py-0.5 text-[10px] font-medium text-brand-amber">
                        Archived
                      </span>
                    )}
                    {idea.status === "DRAFT" && (
                      <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[10px] font-medium text-text-muted">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[12px] text-text-muted">
                    <span className="flex items-center gap-0.5">
                      <Vote className="h-3 w-3" />
                      {formatNumber(idea.totalVotes)} votes
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" />
                      {formatNumber(idea.totalComments)} comments
                    </span>
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
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-warm-border bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-medium text-text-muted">{label}</span>
      </div>
      <p className="mt-2 font-data text-[28px] font-bold text-deep-ink">
        {formatNumber(value)}
      </p>
    </div>
  );
}
