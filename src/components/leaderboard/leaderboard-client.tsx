"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Sparkles, Award } from "lucide-react";
import { UserLeaderboardItem } from "@/components/leaderboard/user-leaderboard-item";
import { IdeaLeaderboardItem } from "@/components/leaderboard/idea-leaderboard-item";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankMedal } from "@/components/leaderboard/rank-medal";
import {
  LEVEL_LABELS,
  CATEGORY_EMOJIS,
  MIN_VOTES_FOR_SCORE,
} from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import { ScoreBadge } from "@/components/ideas/score-ring";

type TabType = "users" | "ideas";

export function LeaderboardClient({
  topUsers,
  topIdeas,
}: {
  topUsers: any[];
  topIdeas: any[];
}) {
  const [activeTab, setActiveTab] = useState<TabType>("users");

  const renderPodium = (items: any[], type: TabType) => {
    if (items.length < 3) return null;

    // Podium order: 2nd, 1st, 3rd
    const podiumOrder = [items[1], items[0], items[2]];
    const ranks = [2, 1, 3];
    const heights = ["h-28 sm:h-32", "h-36 sm:h-40", "h-24 sm:h-28"];
    const delays = [0.2, 0.1, 0.3];

    return (
      <div className="mb-12 flex items-end justify-center gap-2 sm:gap-6 pt-10 px-1 sm:px-4 max-w-full overflow-x-auto">
        {podiumOrder.map((item, idx) => {
          const rank = ranks[idx];
          const isWinner = rank === 1;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: delays[idx],
                type: "spring",
                stiffness: 100,
              }}
              className="relative flex w-[32%] min-w-[80px] max-w-[140px] flex-col items-center sm:w-[140px]"
            >
              {/* Crown for #1 */}
              {isWinner && (
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute -top-8 sm:-top-10 z-10 text-saffron drop-shadow-md"
                >
                  <Trophy size={32} className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" />
                </motion.div>
              )}

              {/* Avatar / Idea Icon */}
              <div
                className={cn(
                  "relative z-10 -mb-5 sm:-mb-6 rounded-full border-4 border-white bg-white shadow-xl transition-transform hover:scale-105",
                  isWinner
                    ? "h-18 w-18 sm:h-24 sm:w-24"
                    : "h-14 w-14 sm:h-20 sm:w-20",
                )}
              >
                {type === "users" ? (
                  <Link href={`/profile/${item.username ?? item.id}`}>
                    <Avatar className="h-full w-full">
                      <AvatarImage src={item.image ?? undefined} />
                      <AvatarFallback className="bg-saffron-light text-saffron font-bold text-xl">
                        {item.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <Link
                    href={`/idea/${item.slug}`}
                    className="flex h-full w-full items-center justify-center rounded-full bg-warm-subtle text-3xl sm:text-4xl"
                  >
                    {CATEGORY_EMOJIS[
                      item.category as keyof typeof CATEGORY_EMOJIS
                    ] || "💡"}
                  </Link>
                )}

                {/* Rank Badge overlapping avatar */}
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white p-0.5 shadow-md">
                  <RankMedal rank={rank} />
                </div>
              </div>

              {/* Podium Bar */}
              <div
                className={cn(
                  "w-full rounded-t-2xl flex flex-col items-center pt-8 px-2 text-center shadow-lg transition-colors",
                  heights[idx],
                  isWinner
                    ? "bg-linear-to-t from-saffron/10 to-saffron/30 border-t-2 border-saffron/50"
                    : "bg-linear-to-t from-warm-subtle to-warm-hover border-t-2 border-warm-border-strong",
                )}
              >
                {type === "users" ? (
                  <>
                    <p className="w-full truncate font-bold text-deep-ink text-[12px] sm:text-[15px] px-1">
                      {item.name}
                    </p>
                    <p className="mt-0.5 sm:mt-1 font-data text-[10px] sm:text-[14px] font-bold text-saffron">
                      {formatNumber(item.points)} pts
                    </p>
                  </>
                ) : (
                  <>
                    <p className="w-full truncate font-bold text-deep-ink text-[12px] sm:text-[15px] px-1">
                      {item.title}
                    </p>
                    <p className="mt-0.5 sm:mt-1 font-data text-[10px] sm:text-[14px] font-bold text-saffron">
                      {item.totalVotes >= MIN_VOTES_FOR_SCORE
                        ? `${item.validationScore} Score`
                        : `${item.totalVotes} Votes`}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const listItems = activeTab === "users" ? topUsers : topIdeas;
  // Skip the top 3 since they are in the podium
  const remainingItems = listItems.slice(3);

  return (
    <div className="relative min-h-screen pb-24 md:pb-12 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-100 w-100 rounded-full bg-saffron/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] h-75 w-75 rounded-full bg-brand-blue/10 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-4xl w-full px-4 pt-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card rotate-3">
            <Trophy className="h-8 w-8 text-saffron" />
          </div>
          <h1 className="font-display text-[32px] sm:text-[40px] leading-tight text-deep-ink md:text-[56px] relative inline-block">
            Hall of Fame
            <Sparkles className="absolute -right-6 -top-3 sm:-right-8 sm:-top-4 h-5 w-5 sm:h-6 sm:w-6 text-brand-amber animate-pulse" />
          </h1>
          <p className="mt-2 sm:mt-3 text-[14px] sm:text-[16px] text-text-secondary max-w-lg mx-auto">
            Celebrating the top visionary founders and the most active
            validators shaping the ecosystem.
          </p>
        </motion.div>

        {/* Custom Segmented Tabs */}
        <div className="mt-8 sm:mt-12 flex justify-center">
          <div className="inline-flex rounded-full bg-white p-1.5 shadow-sm border border-warm-border relative">
            <button
              onClick={() => setActiveTab("users")}
              className={cn(
                "relative z-10 flex items-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-semibold transition-colors",
                activeTab === "users"
                  ? "text-white"
                  : "text-text-secondary hover:text-deep-ink",
              )}
            >
              <Award className="h-4 w-4" />
              Top Validators
            </button>
            <button
              onClick={() => setActiveTab("ideas")}
              className={cn(
                "relative z-10 flex items-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-semibold transition-colors",
                activeTab === "ideas"
                  ? "text-white"
                  : "text-text-secondary hover:text-deep-ink",
              )}
            >
              <TrendingUp className="h-4 w-4" />
              Top Ideas
            </button>

            {/* Sliding background pill */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-saffron"
              animate={{
                left: activeTab === "users" ? "6px" : "calc(50%)",
              }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          </div>
        </div>

        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {listItems.length >= 3 && renderPodium(listItems, activeTab)}

              {remainingItems.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 relative z-20 bg-white/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/60 shadow-xl">
                  {remainingItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {activeTab === "users" ? (
                        <UserLeaderboardItem user={item} rank={index + 4} />
                      ) : (
                        <IdeaLeaderboardItem idea={item} rank={index + 4} />
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                listItems.length < 3 && (
                  <div className="rounded-2xl border border-dashed border-warm-border bg-white/50 p-16 text-center backdrop-blur-sm">
                    {activeTab === "users" ? (
                      <Award className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />
                    ) : (
                      <TrendingUp className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />
                    )}
                    <h3 className="text-[18px] font-display text-deep-ink font-bold">
                      It's quiet in here...
                    </h3>
                    <p className="mt-2 text-[15px] text-text-secondary">
                      Not enough data yet. Be the first to make it to the top!
                    </p>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
