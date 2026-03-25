"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { IdeaResearch } from "@prisma/client"
import { IdeaDetail } from "@/types"
import { VerdictSection } from "./verdict-section"
import { CompetitorSection } from "./competitor-section"
import { RedditSection } from "./reddit-section"
import { SearchDemandSection } from "./search-demand"
import { MarketSection } from "./market-section"
import { NewsSection } from "./news-section"
import { timeAgo } from "@/lib/utils"

import { useResearch } from "@/hooks/use-research"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Download } from "lucide-react"
import { useRouter } from "next/navigation"

import { ResearchProgress } from "./research-trigger"

interface ResearchPanelProps {
  research: any // Using any for now due to Json types
  idea: IdeaDetail
  isOwner?: boolean
}

export function ResearchPanel({ research, idea, isOwner }: ResearchPanelProps) {
  const router = useRouter()
  const { generate, isGenerating, progress } = useResearch({ 
    ideaId: idea.id,
    onComplete: () => {
      router.refresh()
    }
  })

  if (isGenerating) {
    return <ResearchProgress progress={progress} />
  }

  if (!research || research.status !== "COMPLETED") return null

  const sources = [
    { id: "gemini", icon: "🤖", label: "AI Analysis" },
    ...((research.dataSourcesUsed as string[]) || [])
      .filter(s => s !== "gemini")
      .map(s => ({
        id: s,
        icon: s === "reddit" ? "💬" : s === "web_search" ? "🔍" : s === "google_trends" ? "📈" : "👥",
        label: s === "reddit" ? "Reddit" : s === "web_search" ? "Web Search" : s === "google_trends" ? "Google Trends" : "PIQD Crowd"
      }))
  ]

  const handlePrint = () => {
    // We rely on print CSS in globals.css now
    window.print()
  }

  return (
    <div className="space-y-6 bg-white" id="research-report-printable">
      {/* Print-only Header */}
      <div className="hidden print:block mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold mb-2">{idea.title} - AI Research Report</h1>
        <p className="text-gray-600">{idea.pitch}</p>
      </div>

      {/* Meta header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Data Sources:</span>
          {sources.map(source => (
            <Badge key={source.id} variant="secondary" className="bg-white hover:bg-gray-50 font-normal">
              <span className="mr-1">{source.icon}</span>
              {source.label}
            </Badge>
          ))}
        </div>
        <div className="text-xs text-gray-500 text-right shrink-0">
          Generated {timeAgo(new Date(research.generatedAt))}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["verdict", "competitors", "reddit", "market", "search", "news"]} className="space-y-4">
        
        {/* Verdict (Always open) */}
        <AccordionItem value="verdict" className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
            <div className="flex items-center text-lg font-semibold">
              <span className="mr-3 text-2xl">🎯</span> 
              AI Verdict & Cross-Validation
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2 border-t">
            <VerdictSection 
              verdict={research.verdict} 
              crowdData={research.crowdDataSnapshot || idea} 
            />
          </AccordionContent>
        </AccordionItem>

        {/* Competitors */}
        <AccordionItem value="competitors" className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
            <div className="flex items-center text-lg font-semibold">
              <span className="mr-3 text-2xl">🏢</span> 
              Competitors & Alternatives ({research.competitorCount})
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2 border-t">
            <CompetitorSection competitors={research.competitors || []} count={research.competitorCount} />
          </AccordionContent>
        </AccordionItem>

        {/* Reddit */}
        {research.redditData && (
          <AccordionItem value="reddit" className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center text-lg font-semibold">
                <span className="mr-3 text-2xl">💬</span> 
                Reddit Pulse
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2 border-t">
              <RedditSection redditData={research.redditData} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Market Context */}
        {research.marketData && (
          <AccordionItem value="market" className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center text-lg font-semibold">
                <span className="mr-3 text-2xl">🏪</span> 
                Market Context
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2 border-t">
              <MarketSection marketData={research.marketData} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Search Demand */}
        {research.searchData && (
          <AccordionItem value="search" className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center text-lg font-semibold">
                <span className="mr-3 text-2xl">📈</span> 
                Search Demand
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2 border-t">
              <SearchDemandSection searchData={research.searchData} title={idea.title} />
            </AccordionContent>
          </AccordionItem>
        )}

        {/* News */}
        {research.newsData && (
          <AccordionItem value="news" className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center text-lg font-semibold">
                <span className="mr-3 text-2xl">📰</span> 
                News & Existing Solutions
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2 border-t">
              <NewsSection newsData={research.newsData} />
            </AccordionContent>
          </AccordionItem>
        )}

      </Accordion>

      <p className="text-xs text-center text-gray-400 mt-8 mb-4">
        Disclaimer: This research is generated by AI. While we strive for accuracy, please verify critical information independently.
      </p>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-6 border-t pt-6 print:hidden">
        <Button variant="outline" className="w-full sm:w-auto min-w-[140px] gap-2" onClick={handlePrint}>
          <Download className="w-4 h-4 shrink-0" />
          Export as PDF
        </Button>
        {isOwner && (
          <Button 
            variant="secondary" 
            className="w-full sm:w-auto min-w-[140px] gap-2" 
            onClick={() => generate(true)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0" />
            )}
            <span>{isGenerating ? "Regenerating..." : "Regenerate"}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
