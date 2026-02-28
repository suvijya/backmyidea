"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DailyStat = {
  date: string;
  views: number;
  votes: number;
  comments: number;
  shares: number;
};

const METRICS = [
  { key: "views" as const, label: "Views", color: "#60a5fa" },
  { key: "votes" as const, label: "Votes", color: "#F05A28" },
  { key: "comments" as const, label: "Comments", color: "#22c55e" },
  { key: "shares" as const, label: "Shares", color: "#a78bfa" },
];

const RANGE_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
] as const;

export function AdminAnalyticsChart() {
  const [data, setData] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/admin/analytics/daily?days=${days}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load daily stats");
        const stats = (await res.json()) as DailyStat[];
        setData(stats);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [days]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const formatTooltipLabel = (label: React.ReactNode) => {
    if (typeof label === "string") return formatDate(label);
    return String(label);
  };

  if (error) {
    return (
      <Card className="border-warm-border">
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-[13px] text-text-muted">
            Chart data unavailable. Start tracking activity to see trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warm-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-deep-ink">
            Platform Activity
          </CardTitle>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDays(opt.days)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                  days === opt.days
                    ? "bg-saffron-light text-saffron"
                    : "text-text-muted hover:bg-warm-subtle"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-[13px] text-text-muted">
              No activity data yet. Stats will appear as users interact with the
              platform.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                {METRICS.map((m) => (
                  <linearGradient
                    key={m.key}
                    id={`grad-${m.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={m.color}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={m.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E6DEDB"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "#8B8178" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8B8178" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E6DEDB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  fontSize: 13,
                }}
                labelFormatter={formatTooltipLabel}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              {METRICS.map((m) => (
                <Area
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  fill={`url(#grad-${m.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
