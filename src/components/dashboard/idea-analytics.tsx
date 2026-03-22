"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Users, MapPin, Briefcase } from "lucide-react";

interface IdeaAnalyticsProps {
  useThisCount: number;
  maybeCount: number;
  notForMeCount: number;
  dailyStats: {
    date: string | Date;
    votes: number;
  }[];
  demographics: {
    city: string | null;
    isStudent: boolean;
  }[];
}

const COLORS = {
  USE_THIS: "#2CA87F", // brand-green
  MAYBE: "#F5A623", // brand-amber
  NOT_FOR_ME: "#E05D52", // brand-red
};

export function IdeaAnalytics({
  useThisCount,
  maybeCount,
  notForMeCount,
  dailyStats,
  demographics,
}: IdeaAnalyticsProps) {
  // --- Pie Chart Data ---
  const pieData = useMemo(() => {
    return [
      { name: "I'd Use This", value: useThisCount, color: COLORS.USE_THIS },
      { name: "Maybe", value: maybeCount, color: COLORS.MAYBE },
      { name: "Not For Me", value: notForMeCount, color: COLORS.NOT_FOR_ME },
    ].filter((d) => d.value > 0);
  }, [useThisCount, maybeCount, notForMeCount]);

  // --- Line Chart Data ---
  const lineData = useMemo(() => {
    return dailyStats.map((stat) => ({
      date: format(new Date(stat.date), "MMM d"),
      votes: stat.votes,
    }));
  }, [dailyStats]);

  // --- Demographics ---
  const { topCities, studentPct, workingPct } = useMemo(() => {
    if (demographics.length === 0) return { topCities: [], studentPct: 0, workingPct: 0 };
    
    let studentCount = 0;
    const cityMap: Record<string, number> = {};

    demographics.forEach((d) => {
      if (d.isStudent) studentCount++;
      if (d.city) {
        cityMap[d.city] = (cityMap[d.city] || 0) + 1;
      }
    });

    const studentPct = Math.round((studentCount / demographics.length) * 100);
    const workingPct = 100 - studentPct;

    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / demographics.length) * 100),
      }));

    return { topCities, studentPct, workingPct };
  }, [demographics]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-xl border border-warm-border bg-white p-5">
          <h3 className="mb-4 text-[15px] font-bold text-deep-ink">Vote Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="flex h-[200px] items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #EAE5DF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-text-muted">
              Not enough votes yet
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div className="rounded-xl border border-warm-border bg-white p-5">
          <h3 className="mb-4 text-[15px] font-bold text-deep-ink">Voter Demographics</h3>
          {demographics.length > 0 ? (
            <div className="space-y-5">
              {/* Student vs Working */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium">
                  <span className="flex items-center gap-1.5 text-deep-ink">
                    <Briefcase className="h-3.5 w-3.5 text-text-muted" />
                    Profession
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-warm-subtle">
                  <div className="bg-brand-blue" style={{ width: `${workingPct}%` }} />
                  <div className="bg-saffron" style={{ width: `${studentPct}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
                  <span>{workingPct}% Working</span>
                  <span>{studentPct}% Students</span>
                </div>
              </div>

              {/* Top Cities */}
              {topCities.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-deep-ink">
                    <MapPin className="h-3.5 w-3.5 text-text-muted" />
                    Top Locations
                  </div>
                  <div className="space-y-2">
                    {topCities.map((city, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[13px] text-text-secondary">{city.name}</span>
                        <span className="font-data text-[13px] font-medium text-deep-ink">{city.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-text-muted">
              Not enough demographic data yet
            </div>
          )}
        </div>
      </div>

      {/* Line Chart */}
      <div className="rounded-xl border border-warm-border bg-white p-5">
        <h3 className="mb-4 text-[15px] font-bold text-deep-ink">Votes Over Time</h3>
        {lineData.length > 1 ? (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE5DF" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#8C857B' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#8C857B' }} 
                  allowDecimals={false}
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #EAE5DF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  name="Votes"
                  stroke="#F05A28" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#F05A28', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#F05A28', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-[13px] text-text-muted">
            Wait for more daily data to see trends
          </div>
        )}
      </div>
    </div>
  );
}
