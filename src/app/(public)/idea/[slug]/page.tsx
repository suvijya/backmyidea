import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
import {
  Calendar,
  Eye,
  Share2,
  MapPin,
  ExternalLink,
  Tag,
  Users,
  ArrowLeft,
  Flag,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getIdeaBySlug } from "@/actions/idea-actions";
import { VoteButtons } from "@/components/voting/vote-buttons";
import { VoteBreakdown } from "@/components/voting/vote-breakdown";
import { ScoreRing } from "@/components/ideas/score-ring";
import { CommentList } from "@/components/comments/comment-list";
import { IdeaDetailClient } from "@/components/ideas/idea-detail-client";
import { DonationSection } from "@/components/payments/donation-section";
import { ExpressInterestButton } from "@/components/investor/express-interest-button";
import { EmployeeReviewBanner } from "@/components/ideas/employee-review-banner";
import { getPublicDonors } from "@/actions/payment-actions";
import { getCurrentUser, canUserViewGlobalScores } from "@/lib/clerk";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  STAGE_LABELS,
  TARGET_AUDIENCE_LABELS,
  SCORE_TIER_LABELS,
  MIN_VOTES_FOR_SCORE,
  APP_NAME,
} from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import type { VoteType, TargetAudience } from "@prisma/client";
import IdeaDetailLoading from "./loading";

interface IdeaDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: IdeaDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Lightweight fetch just for metadata
  const idea = await prisma.idea.findUnique({
    where: { slug },
    select: { title: true, pitch: true },
  });

  if (!idea) {
    return { title: "Idea Not Found" };
  }

  return {
    title: `${idea.title} — ${APP_NAME}`,
    description: idea.pitch,
    openGraph: {
      title: idea.title,
      description: idea.pitch,
      type: "article",
    },
  };
}

async function IdeaDetailLoader({ slug }: { slug: string }) {
  const result = await getIdeaBySlug(slug);

  if (!result.success) {
    notFound();
  }

  const idea = result.data;
  
  const user = await getCurrentUser();

  // Find current user's vote
  let userVote: VoteType | null = null;
  let currentUserId: string | null = user?.id || null;
  let isEmployeeOrAdmin = user ? (user.isEmployee || user.isAdmin) : false;
  
  if (user) {
    const vote = idea.votes.find((v) => v.userId === user.id);
    userVote = vote?.type ?? null;
  }

  const isOwnIdea = currentUserId === idea.founderId;
  const canViewGlobalScores = await canUserViewGlobalScores();
  const canViewScore = canViewGlobalScores || isOwnIdea;
  const showScore = idea.totalVotes >= MIN_VOTES_FOR_SCORE && canViewScore;

  // Check if current user is an approved investor (for express interest button)
  let isInvestor = false;
  let hasExpressedInterest = false;
  if (currentUserId && !isOwnIdea) {
    const investorProfile = await prisma.investorProfile.findUnique({
      where: { userId: currentUserId },
      select: { id: true },
    });
    if (investorProfile) {
      isInvestor = true;
      const existingInterest = await prisma.investorInterest.findUnique({
        where: {
          investorId_ideaId: {
            investorId: investorProfile.id,
            ideaId: idea.id,
          },
        },
        select: { id: true },
      });
      hasExpressedInterest = !!existingInterest;
    }
  }

  // Fetch public donors for the supporter wall (only if donations enabled)
  const publicDonors = idea.donationsEnabled
    ? await getPublicDonors(idea.id, 10)
    : [];

  return (
    <>
      {/* Employee Review Banner for PENDING ideas */}
      {idea.status === "PENDING" && isEmployeeOrAdmin && (
        <EmployeeReviewBanner ideaId={idea.id} />
      )}

      {/* Back link */}
      <Link
        href="/explore"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-deep-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* ═══════════════════════════════════════
            MAIN CONTENT
            ═══════════════════════════════════════ */}
        <div className="min-w-0">
          {/* Category + Stage */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-warm-border bg-warm-subtle px-2.5 py-1 text-[12px] font-medium text-text-secondary">
              {CATEGORY_EMOJIS[idea.category]} {CATEGORY_LABELS[idea.category]}
            </span>
            <span className="rounded-full border border-warm-border bg-warm-subtle px-2.5 py-1 text-[12px] font-medium text-text-secondary">
              {STAGE_LABELS[idea.stage]}
            </span>
            {idea.status === "ARCHIVED" && (
              <span className="rounded-full border border-brand-amber/30 bg-brand-amber-light px-2.5 py-1 text-[12px] font-medium text-brand-amber">
                Archived
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 font-display text-[32px] leading-[1.1] text-deep-ink md:text-[40px]">
            {idea.title}
          </h1>

          {/* Pitch */}
          <p className="mt-3 text-[16px] leading-[1.7] text-text-secondary md:text-[18px]">
            {idea.pitch}
          </p>

          {/* Founder row */}
          <div className="mt-5 flex items-center gap-3 border-b border-warm-border pb-5">
            <Link href={`/profile/${idea.founder.username ?? ""}`}>
              <div className="h-10 w-10 overflow-hidden rounded-full bg-warm-subtle">
                {idea.founder.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={idea.founder.image}
                    alt={idea.founder.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[15px] font-semibold text-text-secondary">
                    {idea.founder.name?.charAt(0) ?? "U"}
                  </div>
                )}
              </div>
            </Link>
            <div>
              <Link
                href={`/profile/${idea.founder.username ?? ""}`}
                className="text-[14px] font-semibold text-deep-ink hover:underline"
              >
                {idea.founder.name}
              </Link>
              <div className="flex items-center gap-2 text-[12px] text-text-muted">
                {idea.founder.city && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {idea.founder.city}
                  </span>
                )}
                <span className="flex items-center gap-0.5">
                  <Calendar className="h-3 w-3" />
                  {formatDate(idea.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Problem Section */}
          <section className="mt-6">
            <h2 className="text-[15px] font-bold uppercase tracking-wide text-text-muted">
              The Problem
            </h2>
            <p className="mt-2 text-[15px] leading-[1.8] text-deep-ink">
              {idea.problem}
            </p>
          </section>

          {/* Solution Section */}
          <section className="mt-6">
            <h2 className="text-[15px] font-bold uppercase tracking-wide text-text-muted">
              The Solution
            </h2>
            <p className="mt-2 text-[15px] leading-[1.8] text-deep-ink">
              {idea.solution}
            </p>
          </section>

          {/* Feedback Question */}
          {idea.feedbackQuestion && (
            <section className="mt-6 rounded-xl border border-saffron/20 bg-saffron-light p-5">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-saffron">
                Founder&apos;s Question
              </h2>
              <p className="mt-1.5 text-[15px] leading-[1.6] text-deep-ink">
                {idea.feedbackQuestion}
              </p>
            </section>
          )}

          {/* Target Audience */}
          {idea.targetAudience.length > 0 && (
            <section className="mt-6">
              <h2 className="flex items-center gap-1.5 text-[15px] font-bold uppercase tracking-wide text-text-muted">
                <Users className="h-4 w-4" />
                Target Audience
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {(idea.targetAudience as TargetAudience[]).map((audience) => (
                  <span
                    key={audience}
                    className="rounded-full border border-warm-border bg-warm-subtle px-3 py-1 text-[13px] font-medium text-text-secondary"
                  >
                    {TARGET_AUDIENCE_LABELS[audience]}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {idea.tags.length > 0 && (
            <section className="mt-5">
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-md border border-warm-border bg-warm-subtle px-2 py-0.5 text-[12px] text-text-muted"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Link */}
          {idea.linkUrl && (
            <section className="mt-5">
              <a
                href={idea.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-saffron transition-colors hover:text-saffron-dark"
              >
                <ExternalLink className="h-4 w-4" />
                View project link
              </a>
            </section>
          )}

          {/* Separator */}
          <div className="my-8 border-t border-warm-border" />

          {/* Comments */}
          <CommentList
            ideaId={idea.id}
            ideaFounderId={idea.founderId}
            totalComments={idea._count.comments}
          />
        </div>

        {/* ═══════════════════════════════════════
            SIDEBAR (sticky on desktop)
            ═══════════════════════════════════════ */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="space-y-5">
            {/* Score Card */}
            {(idea.totalVotes < MIN_VOTES_FOR_SCORE || canViewScore) && (
              <div className="rounded-[16px] border border-warm-border bg-white p-6 shadow-card">
                {idea.totalVotes >= MIN_VOTES_FOR_SCORE ? (
                  <>
                    <div className="flex flex-col items-center">
                      <ScoreRing
                        score={idea.validationScore}
                        size={120}
                        strokeWidth={10}
                        tier={SCORE_TIER_LABELS[idea.scoreTier]}
                      />
                      <p className="mt-3 text-center text-[12px] leading-relaxed text-text-muted">
                        Based on {formatNumber(idea.totalVotes)} votes
                      </p>
                    </div>
                    {/* Vote Breakdown */}
                    <div className="mt-5 border-t border-warm-border pt-5">
                      <VoteBreakdown
                        useThisCount={idea.useThisCount}
                        maybeCount={idea.maybeCount}
                        notForMeCount={idea.notForMeCount}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warm-subtle">
                      <span className="font-data text-[28px] font-bold text-text-muted">
                        {idea.totalVotes}/{MIN_VOTES_FOR_SCORE}
                      </span>
                    </div>
                    <p className="mt-3 text-center text-[13px] text-text-muted">
                      {MIN_VOTES_FOR_SCORE - idea.totalVotes} more votes needed
                      to generate a score
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Vote Buttons */}
            <div className="rounded-[16px] border border-warm-border bg-white p-5 shadow-card">
              <h3 className="mb-3 text-center text-[14px] font-semibold text-deep-ink">
                {isOwnIdea
                  ? "You can't vote on your own idea"
                  : "Would you use this?"}
              </h3>
              <VoteButtons
                ideaId={idea.id}
                useThisCount={idea.useThisCount}
                maybeCount={idea.maybeCount}
                notForMeCount={idea.notForMeCount}
                userVote={userVote}
                isOwnIdea={isOwnIdea}
                layout="vertical"
              />
            </div>

            {/* Stats */}
            <div className="rounded-[16px] border border-warm-border bg-white p-5 shadow-card">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-data text-[20px] font-bold text-deep-ink">
                    {formatNumber(idea.totalVotes)}
                  </p>
                  <p className="text-[11px] text-text-muted">Votes</p>
                </div>
                <div>
                  <p className="font-data text-[20px] font-bold text-deep-ink">
                    {formatNumber(idea.totalViews)}
                  </p>
                  <p className="text-[11px] text-text-muted">Views</p>
                </div>
                <div>
                  <p className="font-data text-[20px] font-bold text-deep-ink">
                    {formatNumber(idea._count.comments)}
                  </p>
                  <p className="text-[11px] text-text-muted">Comments</p>
                </div>
              </div>
            </div>

            {/* Express Interest (investors only) */}
            {isInvestor && !isOwnIdea && !hasExpressedInterest && (
              <ExpressInterestButton ideaId={idea.id} ideaTitle={idea.title} />
            )}
            {isInvestor && !isOwnIdea && hasExpressedInterest && (
              <div className="flex items-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green-light px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-brand-green" />
                <span className="text-[13px] font-medium text-brand-green">Interest expressed</span>
              </div>
            )}

            {/* Donations */}
            {idea.donationsEnabled && !isOwnIdea && (
              <DonationSection
                ideaId={idea.id}
                ideaTitle={idea.title}
                founderName={idea.founder.name ?? "Founder"}
                totalDonations={idea.totalDonations}
                donorCount={idea.donorCount}
              />
            )}

            {/* Supporter Wall */}
            {idea.donationsEnabled && publicDonors.length > 0 && (
              <div className="rounded-[16px] border border-warm-border bg-white p-5 shadow-card">
                <h3 className="text-[14px] font-semibold text-deep-ink">
                  Supporters
                </h3>
                <div className="mt-3 space-y-3">
                  {publicDonors.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-start gap-2.5"
                    >
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-warm-subtle">
                        {!donation.isAnonymous && donation.donor.image ? (
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="truncate text-[13px] font-medium text-deep-ink">
                            {donation.isAnonymous
                              ? "Anonymous"
                              : donation.donor.name}
                          </span>
                          <span className="shrink-0 font-data text-[12px] font-semibold text-saffron">
                            {`\u20B9${(donation.amountPaise / 100).toLocaleString("en-IN")}`}
                          </span>
                        </div>
                        {donation.message && (
                          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted line-clamp-2">
                            {donation.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <IdeaDetailClient ideaId={idea.id} slug={idea.slug} isOwnIdea={isOwnIdea} />
          </div>
        </aside>
      </div>

      {/* Mobile sticky vote bar */}
      <div className="fixed inset-x-0 bottom-[60px] z-40 border-t border-warm-border bg-white/95 p-3 backdrop-blur-sm md:bottom-0 lg:hidden">
        <VoteButtons
          ideaId={idea.id}
          useThisCount={idea.useThisCount}
          maybeCount={idea.maybeCount}
          notForMeCount={idea.notForMeCount}
          userVote={userVote}
          isOwnIdea={isOwnIdea}
        />
      </div>
    </>
  );
}

export default async function IdeaDetailPage({
  params,
}: IdeaDetailPageProps) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
      <Suspense fallback={<IdeaDetailLoading />}>
        <IdeaDetailLoader slug={slug} />
      </Suspense>
    </div>
  );
}
