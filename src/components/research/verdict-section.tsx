"use client"

import { RESEARCH_SIGNALS } from "@/lib/constants"
import { VerdictData } from "@/lib/research"
import { Badge } from "@/components/ui/badge"

interface VerdictSectionProps {
  verdict: VerdictData
  crowdData: any
}

export function VerdictSection({ verdict, crowdData }: VerdictSectionProps) {
  const signalKey = verdict.overallSignal.toUpperCase() as keyof typeof RESEARCH_SIGNALS
  const signal = RESEARCH_SIGNALS[signalKey] || RESEARCH_SIGNALS.MODERATE
  
  let alignmentIndicator = null
  switch(verdict.crowdVsMarket) {
    case "aligned":
      alignmentIndicator = <div className="text-green-600 font-medium text-sm flex items-center"><span className="mr-1">✅</span> Crowd and market data are aligned</div>
      break
    case "crowd_higher":
      alignmentIndicator = <div className="text-amber-600 font-medium text-sm flex items-center"><span className="mr-1">⚠️</span> Crowd interest is higher than market evidence</div>
      break
    case "market_higher":
      alignmentIndicator = <div className="text-blue-600 font-medium text-sm flex items-center"><span className="mr-1">💡</span> Market demand exists but crowd score is low</div>
      break
    case "divergent":
      alignmentIndicator = <div className="text-red-600 font-medium text-sm flex items-center"><span className="mr-1">🔴</span> Both crowd and market signals are weak</div>
      break
  }

  const buildIcons = {
    definitely: "🚀",
    probably: "👍",
    maybe: "🤔",
    reconsider: "⏸️"
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Top Banner */}
      <div className={`p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 border ${signal.bg} border-opacity-50`}>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{signal.emoji}</div>
          <div>
            <h3 className={`text-2xl font-bold ${signal.color} mb-1`}>{signal.label}</h3>
            {alignmentIndicator}
          </div>
        </div>
        
        <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm min-w-[120px]">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Score</span>
          <div className="text-3xl font-bold font-mono">{verdict.overallScore}<span className="text-lg text-gray-400">/100</span></div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-lg text-gray-800 leading-relaxed font-medium">
        {verdict.summary}
      </p>

      {/* Key Insight Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <span className="text-xl mr-3 mt-0.5">💡</span>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm uppercase tracking-wider mb-1">Key Insight</h4>
            <p className="text-blue-800">{verdict.keyInsight}</p>
          </div>
        </div>
      </div>

      {/* Should Build */}
      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border">
        <span className="font-medium text-gray-700">Should you build this?</span>
        <Badge variant="outline" className="text-base py-1 px-3 bg-white">
          <span className="mr-2">{buildIcons[verdict.shouldBuild] || "🤔"}</span>
          <span className="capitalize">{verdict.shouldBuild}</span>
        </Badge>
      </div>

      {/* 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Strengths */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-green-800">
            <span className="bg-green-100 p-1 rounded">💪</span> Strengths
          </h4>
          <ul className="space-y-2">
            {verdict.strengths.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start">
                <span className="text-green-500 mr-2 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-red-800">
            <span className="bg-red-100 p-1 rounded">⚠️</span> Risks
          </h4>
          <ul className="space-y-2">
            {verdict.risks.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start">
                <span className="text-red-500 mr-2 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3 text-blue-800">
            <span className="bg-blue-100 p-1 rounded">🎯</span> Next Steps
          </h4>
          <ul className="space-y-2">
            {verdict.recommendations.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
