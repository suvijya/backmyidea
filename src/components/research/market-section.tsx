"use client"

import { MarketData } from "@/lib/research"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, TrendingUp } from "lucide-react"

interface MarketSectionProps {
  marketData: MarketData
}

export function MarketSection({ marketData }: MarketSectionProps) {
  const getMaturityBadge = (maturity: string) => {
    switch(maturity) {
      case "nascent": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0 shadow-none">🌱 Nascent</Badge>
      case "growing": return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0 shadow-none">📈 Growing</Badge>
      case "mature": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 shadow-none">🏛️ Mature</Badge>
      case "declining": return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0 shadow-none">📉 Declining</Badge>
      default: return null
    }
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Market Sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border rounded-xl p-5 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold text-indigo-800 uppercase tracking-wider">TAM (Total Addressable)</h4>
            <span className="text-xl opacity-50">🌍</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{marketData.estimatedTAM}</div>
          <p className="text-xs text-gray-500 mt-1">Total Indian market for this category</p>
        </div>
        
        <div className="border rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-semibold text-blue-800 uppercase tracking-wider">SAM (Serviceable)</h4>
            <span className="text-xl opacity-50">🎯</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{marketData.estimatedSAM}</div>
          <p className="text-xs text-gray-500 mt-1">Realistic target segment</p>
        </div>
      </div>

      {/* Meta Stats Row */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-gray-50">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Growth:</span>
          <span className="font-semibold text-gray-900">{marketData.growthRate}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-gray-50">
          <span className="text-sm text-gray-600">Maturity:</span>
          {getMaturityBadge(marketData.marketMaturity)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Target Profile */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2 text-gray-900">
              <Users className="w-5 h-5 text-blue-500" /> Ideal Customer Profile
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-700 leading-relaxed">
              {marketData.targetDemographic}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2 text-gray-900">
              <MapPin className="w-5 h-5 text-orange-500" /> Focus Geography (India)
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-700 leading-relaxed">
              {marketData.geographicFocus}
            </div>
          </div>
        </div>

        {/* Key Trends */}
        <div>
          <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 p-1 rounded">🌊</span> Market Trends
          </h4>
          <ul className="space-y-3">
            {marketData.keyTrends.map((trend, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-50 text-purple-600 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 pt-0.5">{trend}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
