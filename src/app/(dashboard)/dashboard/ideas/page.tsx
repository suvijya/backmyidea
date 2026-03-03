import Link from "next/link";
import {
  Plus,
  Vote,
  MessageSquare,
  ExternalLink,
  MoreHorizontal,
  Archive,
  Pencil,
  RotateCcw,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { requireUser } from "@/lib/clerk";
import { getDashboardIdeas } from "@/actions/user-actions";
import { ScoreBadge } from "@/components/ideas/score-ring";
import {
  SCORE_TIER_LABELS,
  MIN_VOTES_FOR_SCORE,
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
} from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { Category, IdeaStatus, ScoreTier } from "@prisma/client";
import { IdeaStatusActions } from "@/components/dashboard/idea-status-actions";

const STATUS_STYLES: Record<
  IdeaStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: "Active", className: "bg-brand-green-light text-brand-green" },
  DRAFT: { label: "Draft", className: "bg-warm-subtle text-text-muted" },
  ARCHIVED: {
    label: "Archived",
    className: "bg-brand-amber-light text-brand-amber",
  },
  REMOVED: { label: "Removed", className: "bg-brand-red-light text-brand-red" },
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600" },
  REJECTED: { label: "Rejected", className: "bg-red-500/10 text-red-600" },
};

export default async function MyIdeasPage() {
  const user = await requireUser();
  const ideas = await getDashboardIdeas(user.id);

  const activeIdeas = ideas.filter((i) => i.status === "ACTIVE");
  const pendingIdeas = ideas.filter((i) => i.status === "PENDING");
  const rejectedIdeas = ideas.filter((i) => i.status === "REJECTED");
  const archivedIdeas = ideas.filter((i) => i.status === "ARCHIVED");
  const draftIdeas = ideas.filter((i) => i.status === "DRAFT");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-deep-ink">
            My Ideas
          </h1>
          <p className="mt-0.5 text-[14px] text-text-secondary">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"} total
          </p>
        </div>
        <Link href="/dashboard/ideas/new">
          <Button className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark">
            <Plus className="h-4 w-4" />
            New Idea
          </Button>
        </Link>
      </div>

      {ideas.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-warm-border bg-warm-subtle/50 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-saffron-light">
            <Plus className="h-6 w-6 text-saffron" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold text-deep-ink">
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
        <div className="mt-6 space-y-8">
          {/* Pending Ideas */}
          {pendingIdeas.length > 0 && (
            <IdeaSection title="Pending Approval" count={pendingIdeas.length}>
              {pendingIdeas.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} />
              ))}
            </IdeaSection>
          )}

          {/* Active Ideas */}
          {activeIdeas.length > 0 && (
            <IdeaSection title="Active" count={activeIdeas.length}>
              {activeIdeas.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} />
              ))}
            </IdeaSection>
          )}

          {/* Rejected Ideas */}
          {rejectedIdeas.length > 0 && (
            <IdeaSection title="Rejected" count={rejectedIdeas.length}>
              {rejectedIdeas.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} />
              ))}
            </IdeaSection>
          )}

          {/* Draft Ideas */}
          {draftIdeas.length > 0 && (
            <IdeaSection title="Drafts" count={draftIdeas.length}>
              {draftIdeas.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} />
              ))}
            </IdeaSection>
          )}

          {/* Archived Ideas */}
          {archivedIdeas.length > 0 && (
            <IdeaSection title="Archived" count={archivedIdeas.length}>
              {archivedIdeas.map((idea) => (
                <IdeaRow key={idea.id} idea={idea} />
              ))}
            </IdeaSection>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-bold text-deep-ink">{title}</h2>
        <span className="rounded-full bg-warm-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function IdeaRow({
  idea,
}: {
  idea: {
    id: string;
    slug: string;
    title: string;
    status: IdeaStatus;
    totalVotes: number;
    totalComments: number;
    validationScore: number;
    scoreTier: ScoreTier;
    createdAt: Date;
  };
}) {
  const statusStyle = STATUS_STYLES[idea.status];

  return (
    <div className="flex items-center justify-between rounded-xl border border-warm-border bg-white p-4 transition-all hover:shadow-card-hover">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/idea/${idea.slug}`}
            className="truncate text-[15px] font-semibold text-deep-ink hover:text-saffron transition-colors"
          >
            {idea.title}
          </Link>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle.className}`}
          >
            {statusStyle.label}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-text-muted">
          <span className="flex items-center gap-1">
            <Vote className="h-3 w-3" />
            {formatNumber(idea.totalVotes)} votes
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {formatNumber(idea.totalComments)} comments
          </span>
          <span>{timeAgo(idea.createdAt)}</span>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-2">
        {idea.totalVotes >= MIN_VOTES_FOR_SCORE && (
          <ScoreBadge score={idea.validationScore} />
        )}
        <IdeaStatusActions ideaId={idea.id} slug={idea.slug} status={idea.status} />
      </div>
    </div>
  );
}
