"use client"

import { SearchDemandData } from "@/lib/research"
import { getGoogleTrendsEmbedUrl } from "@/lib/search-providers"
import { Badge } from "@/components/ui/badge"

function estimateMomentumScore(searchData: SearchDemandData): number {
  const base = searchData.trendDirection === "rising" ? 72 : searchData.trendDirection === "stable" ? 55 : 38
  const keywordBonus = Math.min(searchData.relatedKeywords.length, 8) * 3
  return Math.min(100, base + keywordBonus)
}

function estimateCompetitionIndex(searchData: SearchDemandData): number {
  const highCount = searchData.relatedKeywords.filter((k) => k.volume === "high").length
  const mediumCount = searchData.relatedKeywords.filter((k) => k.volume === "medium").length
  return Math.min(100, highCount * 12 + mediumCount * 6 + 20)
}

function demandLabel(score: number): string {
  if (score >= 75) return "High Demand"
  if (score >= 55) return "Growing Demand"
  if (score >= 40) return "Moderate Demand"
  return "Early Demand"
}

interface SearchDemandSectionProps {
  searchData: SearchDemandData
  title: string
}

export function SearchDemandSection({ searchData, title }: SearchDemandSectionProps) {
  const momentumScore = estimateMomentumScore(searchData)
  const competitionIndex = estimateCompetitionIndex(searchData)

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising": return <span className="text-green-500 font-bold">↑</span>
      case "declining": return <span className="text-red-500 font-bold">↓</span>
      default: return <span className="text-gray-500 font-bold">→</span>
    }
  }

  const getVolumeBadge = (volume: string) => {
    switch (volume) {
      case "high": return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 shadow-none">High</Badge>
      case "medium": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 shadow-none">Medium</Badge>
      case "low": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0 shadow-none">Low</Badge>
      default: return null
    }
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Primary Keyword & Trend */}
        <div className="flex-1 p-5 rounded-xl border bg-gray-50 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1">Primary Search Target</div>
            <div className="text-xl font-bold text-gray-900">"{searchData.primaryKeyword}"</div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white ${
            searchData.trendDirection === "rising" ? "border-green-200 text-green-700" :
            searchData.trendDirection === "declining" ? "border-red-200 text-red-700" :
            "border-gray-200 text-gray-700"
          }`}>
            <span className="text-lg">{
              searchData.trendDirection === "rising" ? "📈" :
              searchData.trendDirection === "declining" ? "📉" : "➡️"
            }</span>
            <span className="font-semibold capitalize">{searchData.trendDirection}</span>
          </div>
        </div>

        <div className="md:w-[260px] p-5 rounded-xl border bg-gray-50">
          <div className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2">Demand Momentum</div>
          <div className="text-2xl font-bold text-gray-900">{momentumScore}/100</div>
          <div className="text-sm text-gray-600 mt-1">{demandLabel(momentumScore)}</div>
          <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${momentumScore}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4 bg-white">
          <div className="text-xs uppercase font-semibold tracking-wider text-gray-500">Competition Index</div>
          <div className="mt-1 text-xl font-bold text-gray-900">{competitionIndex}/100</div>
          <div className="text-sm text-gray-600 mt-1">Higher means crowded category with active search competitors.</div>
        </div>
        <div className="border rounded-xl p-4 bg-white">
          <div className="text-xs uppercase font-semibold tracking-wider text-gray-500">Opportunity Snapshot</div>
          <div className="mt-1 text-sm text-gray-700">
            {momentumScore >= 65
              ? "Strong demand momentum. Prioritize differentiation and speed to execution."
              : "Demand is emerging. Focus on targeted niche positioning and founder-led distribution."}
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-gray-800 font-medium">
        {searchData.trendSummary}
      </p>

      {/* Search Intent */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <h4 className="font-semibold text-blue-900 text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
          <span>🧠</span> User Search Intent
        </h4>
        <p className="text-blue-800 text-sm">
          {searchData.searchIntent}
        </p>
      </div>

      {/* Trends Embed */}
      {searchData.primaryKeyword && (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
              <span className="ml-1 text-gray-600">Trends: India (Past 12 Months)</span>
            </h4>
          </div>
          <div className="w-full h-[350px] relative bg-gray-50/50">
            {/* Fallback if iframe fails/loads slowly */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 text-gray-400 text-sm">
              Loading Google Trends data...
            </div>
            <iframe 
              src={getGoogleTrendsEmbedUrl(searchData.primaryKeyword)} 
              className="w-full h-full border-0"
              title={`Google Trends for ${searchData.primaryKeyword}`}
            />
          </div>
        </div>
      )}

      {/* Related Keywords */}
      {searchData.relatedKeywords.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Related Search Queries</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Keyword</th>
                  <th className="px-4 py-3 font-semibold w-24 text-center">Volume</th>
                  <th className="px-4 py-3 font-semibold w-24 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {searchData.relatedKeywords.map((kw, i) => (
                  <tr key={i} className="bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{kw.keyword}</td>
                    <td className="px-4 py-3 text-center">{getVolumeBadge(kw.volume)}</td>
                    <td className="px-4 py-3 text-center text-lg">{getTrendIcon(kw.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
