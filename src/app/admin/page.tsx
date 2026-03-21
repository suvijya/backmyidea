"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Lightbulb,
  Vote,
  MessageSquare,
  TrendingUp,
  UserPlus,
  PlusCircle,
  Activity,
  ShieldAlert,
  Settings,
  Database,
  BarChart3,
  ServerCrash
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminAnalyticsChart } from "@/components/admin/analytics-chart";
import type { AdminAnalytics } from "@/types";
import { cn } from "@/lib/utils";

type StatCard = {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bgAccent: string;
  subtitle?: string;
  highlight?: boolean;
};

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = (await res.json()) as AdminAnalytics;
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <ServerCrash className="mb-4 h-12 w-12 text-red-500/50" />
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">System Error</h2>
        <p className="mt-2 text-[15px] font-medium text-red-500/80">
          Failed to load telemetry: {error}
        </p>
      </div>
    );
  }

  const stats: StatCard[] = analytics
    ? [
        {
          label: "Total Users",
          value: analytics.totalUsers,
          icon: Users,
          accent: "text-brand-blue",
          bgAccent: "bg-brand-blue/10",
        },
        {
          label: "Total Ideas",
          value: analytics.totalIdeas,
          icon: Lightbulb,
          accent: "text-saffron",
          bgAccent: "bg-saffron/10",
        },
        {
          label: "Total Votes",
          value: analytics.totalVotes,
          icon: Vote,
          accent: "text-brand-green",
          bgAccent: "bg-brand-green/10",
        },
        {
          label: "Total Comments",
          value: analytics.totalComments,
          icon: MessageSquare,
          accent: "text-purple-500",
          bgAccent: "bg-purple-500/10",
        },
        {
          label: "New Users",
          value: analytics.newUsersToday,
          icon: UserPlus,
          accent: "text-brand-blue",
          bgAccent: "bg-brand-blue/10",
          subtitle: "today",
          highlight: true,
        },
        {
          label: "New Ideas",
          value: analytics.newIdeasToday,
          icon: PlusCircle,
          accent: "text-saffron",
          bgAccent: "bg-saffron/10",
          subtitle: "today",
          highlight: true,
        },
        {
          label: "Votes Cast",
          value: analytics.newVotesToday,
          icon: TrendingUp,
          accent: "text-brand-green",
          bgAccent: "bg-brand-green/10",
          subtitle: "today",
          highlight: true,
        },
        {
          label: "Active Users",
          value: analytics.activeUsersWeek,
          icon: Activity,
          accent: "text-rose-500",
          bgAccent: "bg-rose-500/10",
          subtitle: "7-day active",
        },
      ]
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* ─── GOD MODE HERO ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-brand-blue/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px] pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400 backdrop-blur-md mb-4 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <ShieldAlert className="h-3 w-3" /> System Command
              </div>
              <h1 className="font-display text-[32px] leading-tight md:text-[42px] tracking-tight font-extrabold text-white">
                Platform Telemetry
              </h1>
              <p className="mt-2 text-[15px] text-zinc-400 max-w-xl leading-relaxed">
                God-mode overview of Piqd ecosystem health, user growth, and interaction velocity. 
                Monitor anomalies and track platform scale in real-time.
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/20 text-brand-green">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">System Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-green"></span>
                  </span>
                  <p className="text-sm font-semibold text-zinc-200">All Systems Operational</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Metrics Highlight Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-6 border-t border-white/10 mt-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[100px] w-full rounded-2xl bg-white/5" />
                ))
              : stats.slice(0, 4).map((stat) => (
                  <PremiumStatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                  />
                ))}
          </div>
        </div>
      </div>

      {/* ─── VELOCITY & SECONDARY METRICS ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-warm-border bg-white shadow-card overflow-hidden">
            <div className="p-6 border-b border-warm-border flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-brand-blue" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-deep-ink">Interaction Velocity</h2>
                  <p className="text-[13px] text-text-secondary">7-to-30 day rolling volume</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AdminAnalyticsChart />
            </div>
          </div>
        </div>

        {/* Today's Growth Cards */}
        <div className="space-y-4 flex flex-col justify-between">
          <h3 className="text-[16px] font-bold text-deep-ink px-1 flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-blue" />
            Today's Growth
          </h3>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`side-${i}`} className="h-[92px] w-full rounded-2xl" />
            ))
          ) : (
            stats.slice(4).map((stat) => (
              <div 
                key={stat.label}
                className={cn(
                  "group relative overflow-hidden flex items-center justify-between rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
                  stat.highlight 
                    ? "border-saffron/30 bg-gradient-to-r from-saffron/[0.05] to-transparent" 
                    : "border-warm-border bg-white"
                )}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bgAccent}`}>
                    <stat.icon className={`h-6 w-6 ${stat.accent}`} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-text-secondary">
                      {stat.label}
                    </p>
                    {stat.subtitle && (
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <p className="font-data text-[28px] font-bold leading-none text-deep-ink">
                    {stat.value > 0 ? "+" : ""}{stat.value.toLocaleString()}
                  </p>
                </div>
                {stat.highlight && (
                  <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-saffron/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── CONTROL CENTER QUICK LINKS ───────────────────────────────── */}
      {!loading && (
        <div>
          <h3 className="text-[18px] font-bold text-deep-ink mb-4 px-1 flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-500" />
            Control Center
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickLink
              href="/admin/reports"
              title="Reports Queue"
              description="Review pending content and user reports"
              icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
              bgClass="bg-rose-500/10"
              borderClass="hover:border-rose-500/30"
            />
            <QuickLink
              href="/admin/ideas"
              title="Manage Ideas"
              description="Browse, feature, and moderate all platform ideas"
              icon={<Lightbulb className="h-5 w-5 text-saffron" />}
              bgClass="bg-saffron/10"
              borderClass="hover:border-saffron/30"
            />
            <QuickLink
              href="/admin/users"
              title="Manage Users"
              description="View accounts, assign roles, and handle bans"
              icon={<Users className="h-5 w-5 text-brand-blue" />}
              bgClass="bg-brand-blue/10"
              borderClass="hover:border-brand-blue/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Premium Stat Card (Hero Section) ──────────────────────────────────

function PremiumStatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 group">
      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="p-2 rounded-lg bg-white/10">
          <Icon className="h-4 w-4 text-white/80" />
        </div>
        <span className="text-[12px] font-bold uppercase tracking-wider text-white/60">
          {label}
        </span>
      </div>
      <p className="font-data text-[32px] font-bold leading-none tracking-tight text-white relative z-10">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Quick Link Card ───────────────────────────────────────────────────

function QuickLink({
  href,
  title,
  description,
  icon,
  bgClass,
  borderClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group flex items-start gap-4 rounded-2xl border border-warm-border bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-card-hover",
        borderClass
      )}
    >
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors", bgClass)}>
        {icon}
      </div>
      <div>
        <h3 className="text-[16px] font-bold text-deep-ink group-hover:text-black transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">{description}</p>
      </div>
    </a>
  );
}