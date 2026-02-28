import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Vote,
  MessageSquare,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { getIdeaById } from "@/actions/idea-actions";
import { getDonationStats } from "@/actions/payment-actions";
import { ScoreBadge } from "@/components/ideas/score-ring";
import { DonationsToggle } from "@/components/payments/donations-toggle";
import { InvestorInterestList } from "@/components/investor/interest-list";
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
  const user = await requireUser();
  const result = await getIdeaById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const idea = result.data;

  // Only the founder (or admin) should see this page — getIdeaById already checks
  const showScore = idea.totalVotes >= MIN_VOTES_FOR_SCORE;

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

  // Serialize dates to strings for the client component
  const serializedInterests = investorInterests.map((interest) => ({
    ...interest,
    createdAt: interest.createdAt.toISOString(),
  }));

  return (
    <div>
      {/* Back to ideas list */}
      <Link
        href="/dashboard/ideas"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-deep-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to My Ideas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-warm-border bg-warm-subtle px-2.5 py-1 text-[12px] font-medium text-text-secondary">
              {CATEGORY_EMOJIS[idea.category]}{" "}
              {CATEGORY_LABELS[idea.category]}
            </span>
            <span className="rounded-full border border-warm-border bg-warm-subtle px-2.5 py-1 text-[12px] font-medium text-text-secondary">
              {STAGE_LABELS[idea.stage]}
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

        <div className="flex shrink-0 items-center gap-2">
          {showScore && <ScoreBadge score={idea.validationScore} />}
          <Link href={`/idea/${idea.slug}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-warm-border text-text-secondary hover:bg-warm-hover"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View
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
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Votes"
          value={formatNumber(idea.totalVotes)}
          icon={<Vote className="h-4 w-4 text-saffron" />}
        />
        <StatCard
          label="Comments"
          value={formatNumber(idea.totalComments)}
          icon={<MessageSquare className="h-4 w-4 text-saffron" />}
        />
        <StatCard
          label="Views"
          value={formatNumber(idea.totalViews)}
          icon={<Eye className="h-4 w-4 text-saffron" />}
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
                          className="flex items-center justify-between"
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
                              <p className="text-[13px] font-medium text-deep-ink">
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
    <div className="rounded-xl border border-warm-border bg-white p-4">
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
