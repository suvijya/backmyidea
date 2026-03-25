import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Vote,
  MessageSquare,
  Eye,
  Share2,
  CalendarDays,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { Category, IdeaStage } from "@prisma/client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { getIdeaById } from "@/actions/idea-actions";
import { getDonationStats } from "@/actions/payment-actions";
import { ScoreBadge } from "@/components/ideas/score-ring";
import { DonationsToggle } from "@/components/payments/donations-toggle";
import { InvestorInterestList } from "@/components/investor/interest-list";
import { IdeaAnalytics } from "@/components/dashboard/idea-analytics";
import { CommentList } from "@/components/comments/comment-list";
import { ShareModal } from "@/components/shared/share-modal";
import { ResearchTrigger } from "@/components/research/research-trigger";
import { ResearchPanel } from "@/components/research/research-panel";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  STAGE_LABELS,
  MIN_VOTES_FOR_SCORE,
} from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/utils";

interface IdeaDetailDashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function IdeaDetailDashboardPage({
  params,
}: IdeaDetailDashboardPageProps) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<IdeaDetailSkeleton />}>
      <IdeaDetailDashboardLoader id={id} />
    </Suspense>
  );
}

function IdeaDetailSkeleton() {
  return (
    <div className="pb-20 animate-pulse">
      <div className="mb-5 h-4 w-32 bg-warm-subtle rounded"></div>
      
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 rounded-full bg-warm-subtle"></div>
            <div className="h-6 w-24 rounded-full bg-warm-subtle"></div>
          </div>
          <div className="h-8 w-3/4 bg-warm-subtle rounded-md"></div>
          <div className="h-4 w-full bg-warm-subtle rounded"></div>
          <div className="h-4 w-5/6 bg-warm-subtle rounded"></div>
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="h-9 w-24 rounded-md bg-warm-subtle"></div>
          <div className="h-9 w-24 rounded-md bg-warm-subtle"></div>
          <div className="h-9 w-24 rounded-md bg-warm-subtle"></div>
        </div>
      </div>

      {/* Stats Row Skeleton */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-warm-border bg-white p-4 h-24">
            <div className="h-4 w-16 bg-warm-subtle rounded mb-2"></div>
            <div className="h-8 w-12 bg-warm-subtle rounded mt-2"></div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="mt-8 space-y-4">
        <div className="h-64 w-full bg-warm-subtle rounded-xl"></div>
        <div className="h-40 w-full bg-warm-subtle rounded-xl mt-12"></div>
      </div>
    </div>
  );
}

async function IdeaDetailDashboardLoader({ id }: { id: string }) {
  const user = await requireUser();
  const result = await getIdeaById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const idea = result.data;

  // Only the founder (or admin) should see this page — getIdeaById already checks
  const showScore = idea.totalVotes >= MIN_VOTES_FOR_SCORE;
  const daysSincePosted = Math.max(0, differenceInDays(new Date(), idea.createdAt));

  // Fetch donation stats if donations are enabled
  const donationStatsResult = idea.donationsEnabled
    ? await getDonationStats(idea.id)
    : null;
  const donationStats =
    donationStatsResult?.success === true ? donationStatsResult.data : null;

  // Fetch investor interests for this idea
  const investorInterests = await prisma.investorInterest.findMany({
    where: { ideaId: idea.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      message: true,
      createdAt: true,
      investor: {
        select: {
          id: true,
          firmName: true,
          linkedinUrl: true,
          investmentThesis: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
    },
  });

  // Fetch direct messages (private suggestions)
  const directMessages = await prisma.directMessage.findMany({
    where: { ideaId: idea.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  });
  
  // Fetch Analytics data
  const dailyStats = await prisma.ideaDailyStat.findMany({
    where: { ideaId: idea.id },
    orderBy: { date: "asc" },
  });
  
  const rawVotes = await prisma.vote.findMany({
    where: { ideaId: idea.id },
    select: {
      user: {
        select: {
          city: true,
          college: true,
          role: true,
        }
      }
    }
  });
  
  const demographics = rawVotes.map((v: any) => ({
    city: v.user.city,
    isStudent: Boolean(v.user.college && v.user.college.length > 0) || v.user.role === 'EXPLORER',
  }));

  // Serialize dates to strings for the client component
  const serializedInterests = investorInterests.map((interest: any) => ({
    ...interest,
    createdAt: interest.createdAt.toISOString(),
  }));

  return (
    <div className="pb-20">
      {/* Back to ideas list */}
      <Link
        href="/dashboard/ideas"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-deep-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to My Ideas
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-warm-border bg-warm-subtle px-2.5 py-1 text-[12px] font-medium text-text-secondary">
              {CATEGORY_EMOJIS[idea.category as Category]}{" "}
              {CATEGORY_LABELS[idea.category as Category]}
            </span>
            <span className="rounded-full border border-warm-border bg-warm-subtle px-2.5 py-1 text-[12px] font-medium text-text-secondary">
              {STAGE_LABELS[idea.stage as IdeaStage]}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[28px] leading-tight text-deep-ink">
            {idea.title}
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary line-clamp-2">
            {idea.pitch}
          </p>
          <p className="mt-2 text-[12px] text-text-muted">
            Posted {timeAgo(idea.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {showScore && <ScoreBadge score={idea.validationScore} />}
          <ShareModal ideaId={idea.id} title={idea.title} slug={idea.slug}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-warm-border text-text-secondary hover:bg-warm-hover"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Card
            </Button>
          </ShareModal>
          <Link href={`/idea/${idea.slug}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-warm-border text-text-secondary hover:bg-warm-hover"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Public
            </Button>
          </Link>
          <Link href={`/dashboard/ideas/${idea.id}/edit`}>
            <Button
              size="sm"
              className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Views"
          value={formatNumber(idea.totalViews)}
          icon={<Eye className="h-4 w-4 text-saffron" />}
        />
        <StatCard
          label="Votes"
          value={formatNumber(idea.totalVotes)}
          icon={<Vote className="h-4 w-4 text-saffron" />}
        />
        <StatCard
          label="Score"
          value={showScore ? `${idea.validationScore}` : "—"}
          icon={
            <div className="h-4 w-4 rounded-full bg-saffron-light text-center text-[10px] font-bold leading-4 text-saffron">
              S
            </div>
          }
        />
        <StatCard
          label="Comments"
          value={formatNumber(idea.totalComments)}
          icon={<MessageSquare className="h-4 w-4 text-saffron" />}
        />
        <StatCard
          label="Shares"
          value={formatNumber(idea.totalShares)}
          icon={<Share2 className="h-4 w-4 text-saffron" />}
        />
        <StatCard
          label="Days Live"
          value={`${daysSincePosted}`}
          icon={<CalendarDays className="h-4 w-4 text-saffron" />}
        />
      </div>
      
      {/* Analytics Section */}
      <div className="mt-8">
        <IdeaAnalytics 
          useThisCount={idea.useThisCount}
          maybeCount={idea.maybeCount}
          notForMeCount={idea.notForMeCount}
          dailyStats={dailyStats}
          demographics={demographics}
        />
      </div>

      {/* AI Research Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-deep-ink flex items-center gap-2">
            <span className="text-lg">🤖</span> AI Deep Dive Research
          </h2>
        </div>
        
        {(!idea.research || idea.research.status === "FAILED") ? (
          <div className="rounded-xl border border-warm-border bg-white p-6 shadow-sm">
            <ResearchTrigger ideaId={idea.id} existingResearch={idea.research} isOwner={true} />
            {idea.research?.status === "FAILED" && (
              <p className="mt-2 text-xs text-red-500 text-center">Previous generation failed. You can try again.</p>
            )}
          </div>
        ) : idea.research.status === "COMPLETED" ? (
          <div className="space-y-4">
            <ResearchPanel research={idea.research} idea={idea as any} isOwner={true} />
          </div>
        ) : (
          <div className="rounded-xl border border-warm-border bg-white p-6 text-center">
            <ResearchTrigger ideaId={idea.id} existingResearch={idea.research} isOwner={true} />
          </div>
        )}
      </div>

      {/* Private Suggestions */}
      {directMessages.length > 0 && (
        <div className="mt-8" id="messages">
          <h2 className="mb-4 text-[15px] font-bold text-deep-ink">
            Private Suggestions ({directMessages.length})
          </h2>
          <div className="space-y-3">
            {directMessages.map((msg: any) => (
              <div
                key={msg.id}
                className="rounded-xl border border-warm-border bg-white p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 overflow-hidden rounded-full bg-warm-subtle">
                    {msg.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.user.image}
                        alt={msg.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-text-muted">
                        {msg.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-deep-ink">
                      {msg.user.name}
                    </span>
                    <span className="ml-2 text-[12px] text-text-muted">
                      @{msg.user.username}
                    </span>
                  </div>
                  <span className="ml-auto text-[11px] text-text-muted">
                    {timeAgo(new Date(msg.createdAt))}
                  </span>
                </div>
                <p className="text-[14px] text-text-secondary whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Comments */}
      <div className="mt-12 rounded-xl border border-warm-border bg-white p-5 lg:p-8">
        <h2 className="mb-4 text-[18px] font-bold text-deep-ink">
          Public Comments
        </h2>
        <p className="mb-6 text-[14px] text-text-secondary">
          Reply to community feedback, pin helpful comments, and report spam.
        </p>
        <CommentList 
          ideaId={idea.id} 
          ideaFounderId={idea.founderId} 
          currentUserId={user.id}
          totalComments={idea.totalComments} 
          isAdminOrEmployee={user.isAdmin || user.isEmployee}
        />
      </div>

      {/* Donations Section */}
      {idea.status === "ACTIVE" && (
        <div className="mt-8">
          <h2 className="text-[15px] font-bold text-deep-ink">
            Micro-Donations
          </h2>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            Let supporters back your idea with small donations. Platform takes
            10% on payouts.
          </p>

          <div className="mt-4 rounded-xl border border-warm-border bg-white p-5">
            <DonationsToggle
              ideaId={idea.id}
              initialEnabled={idea.donationsEnabled}
            />

            {/* Donation Stats (only show when enabled and has data) */}
            {idea.donationsEnabled && donationStats && (
              <div className="mt-5 border-t border-warm-border pt-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[12px] text-text-muted">Total Raised</p>
                    <p className="font-data text-[24px] font-bold text-deep-ink">
                      {`\u20B9${(donationStats.totalRaisedPaise / 100).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-text-muted">Supporters</p>
                    <p className="font-data text-[24px] font-bold text-deep-ink">
                      {donationStats.donorCount}
                    </p>
                  </div>
                </div>

                {/* Recent Donations */}
                {donationStats.recentDonations.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-[13px] font-semibold text-deep-ink">
                      Recent Donations
                    </h3>
                    <div className="mt-3 space-y-3">
                      {donationStats.recentDonations.map((donation) => (
                          <div
                            key={donation.id}
                            className="flex items-center justify-between gap-2"
                          >
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-warm-subtle">
                              {!donation.isAnonymous &&
                              donation.donor.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={donation.donor.image}
                                  alt={donation.donor.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-text-muted">
                                  {donation.isAnonymous
                                    ? "?"
                                    : donation.donor.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="truncate text-[13px] font-medium text-deep-ink">
                                {donation.isAnonymous
                                  ? "Anonymous"
                                  : donation.donor.name}
                              </p>
                              {donation.message && (
                                <p className="text-[11px] text-text-muted line-clamp-1">
                                  {donation.message}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 font-data text-[14px] font-semibold text-saffron">
                            {`\u20B9${(donation.amountPaise / 100).toLocaleString("en-IN")}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investor Interest */}
      {serializedInterests.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-[15px] font-bold text-deep-ink">
            Investor Interest
          </h2>
          <InvestorInterestList interests={serializedInterests} />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-warm-border bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] text-text-muted">{label}</span>
      </div>
      <p className="mt-1.5 font-data text-[22px] font-bold text-deep-ink">
        {value}
      </p>
    </div>
  );
}
