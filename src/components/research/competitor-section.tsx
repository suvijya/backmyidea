"use client"

import { CompetitorData } from "@/lib/research"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

interface CompetitorSectionProps {
  competitors: CompetitorData[]
  count: number
}

export function CompetitorSection({ competitors, count }: CompetitorSectionProps) {
  if (count === 0 || !competitors || competitors.length === 0) {
    return (
      <div className="p-8 text-center bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
        <div className="text-4xl mb-3">🌊</div>
        <h4 className="font-semibold text-lg text-blue-900 mb-1">Blue Ocean Opportunity?</h4>
        <p className="text-blue-700">No direct competitors found. You might be onto something completely new.</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">Active</Badge>
      case "failed": return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">Failed</Badge>
      case "acquired": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">Acquired</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">Unknown</Badge>
    }
  }

  const getSimilarityBadge = (similarity: string) => {
    switch (similarity) {
      case "high": return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">High Similarity</Badge>
      case "medium": return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Medium Similarity</Badge>
      case "low": return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Low Similarity</Badge>
      default: return null
    }
  }

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {competitors.map((comp, idx) => (
          <div key={idx} className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            {comp.status === "failed" && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-10 flex items-center justify-center">
                <span className="text-4xl transform rotate-45 block mb-6 mr-6">☠️</span>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  {comp.name}
                  {comp.url && comp.url !== "null" && (
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </h4>
              </div>
              <div className="flex gap-2 items-center">
                {getStatusBadge(comp.status)}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 h-[40px] line-clamp-2">{comp.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {getSimilarityBadge(comp.similarity)}
              {comp.fundingStage && comp.fundingStage !== "null" && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">
                  💰 {comp.fundingStage}
                </Badge>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <span className="text-xs font-semibold uppercase text-gray-500 block mb-1">How you differ:</span>
              <p className="text-sm text-gray-800 italic">"{comp.differentiator}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
