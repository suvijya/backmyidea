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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminAnalytics } from "@/types";

type StatCard = {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  bgAccent: string;
  subtitle?: string;
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
      <div className="rounded-xl border border-brand-red/20 bg-brand-red-light p-6 text-center">
        <p className="text-[15px] font-medium text-brand-red">
          Failed to load analytics: {error}
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
          bgAccent: "bg-brand-blue-light",
        },
        {
          label: "Total Ideas",
          value: analytics.totalIdeas,
          icon: Lightbulb,
          accent: "text-saffron",
          bgAccent: "bg-saffron-light",
        },
        {
          label: "Total Votes",
          value: analytics.totalVotes,
          icon: Vote,
          accent: "text-brand-green",
          bgAccent: "bg-brand-green-light",
        },
        {
          label: "Total Comments",
          value: analytics.totalComments,
          icon: MessageSquare,
          accent: "text-brand-amber",
          bgAccent: "bg-brand-amber-light",
        },
        {
          label: "New Users Today",
          value: analytics.newUsersToday,
          icon: UserPlus,
          accent: "text-brand-blue",
          bgAccent: "bg-brand-blue-light",
          subtitle: "today",
        },
        {
          label: "New Ideas Today",
          value: analytics.newIdeasToday,
          icon: PlusCircle,
          accent: "text-saffron",
          bgAccent: "bg-saffron-light",
          subtitle: "today",
        },
        {
          label: "Votes Today",
          value: analytics.newVotesToday,
          icon: TrendingUp,
          accent: "text-brand-green",
          bgAccent: "bg-brand-green-light",
          subtitle: "today",
        },
        {
          label: "Active This Week",
          value: analytics.activeUsersWeek,
          icon: Activity,
          accent: "text-brand-amber",
          bgAccent: "bg-brand-amber-light",
          subtitle: "7-day active",
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-deep-ink">
          Platform Overview
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          Real-time platform metrics and health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-warm-border">
                <CardContent className="p-5">
                  <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                  <Skeleton className="mb-2 h-8 w-20" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => (
              <Card
                key={stat.label}
                className="border-warm-border transition-shadow hover:shadow-card-hover"
              >
                <CardContent className="p-5">
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgAccent}`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.accent}`} />
                  </div>
                  <p className="font-data text-[28px] font-medium leading-none text-deep-ink">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-text-secondary">
                    {stat.label}
                    {stat.subtitle && (
                      <span className="ml-1 text-text-muted">
                        ({stat.subtitle})
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Links */}
      {!loading && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickLink
            href="/admin/reports"
            title="Reports Queue"
            description="Review pending content reports"
            icon={<span className="text-[20px]">🚩</span>}
          />
          <QuickLink
            href="/admin/ideas"
            title="Manage Ideas"
            description="Browse and moderate all ideas"
            icon={<span className="text-[20px]">💡</span>}
          />
          <QuickLink
            href="/admin/users"
            title="Manage Users"
            description="View and manage all users"
            icon={<span className="text-[20px]">👥</span>}
          />
        </div>
      )}
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-warm-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm-subtle">
        {icon}
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-deep-ink group-hover:text-saffron transition-colors">
          {title}
        </h3>
        <p className="mt-0.5 text-[13px] text-text-secondary">{description}</p>
      </div>
    </a>
  );
}
