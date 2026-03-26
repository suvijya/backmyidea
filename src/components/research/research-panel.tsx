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
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { useState } from "react"

import { ResearchProgress } from "./research-trigger"

interface ResearchPanelProps {
  research: any // Using any for now due to Json types
  idea: IdeaDetail
  isOwner?: boolean
}

export function ResearchPanel({ research, idea, isOwner }: ResearchPanelProps) {
  const router = useRouter()
  const [depth, setDepth] = useState<"fast" | "deep">("deep")
  const { generate, isGenerating, progress, progressFeed, sourcesFeed } = useResearch({ 
    ideaId: idea.id,
    onComplete: () => {
      router.refresh()
    }
  })

  if (isGenerating) {
    return <ResearchProgress progress={progress} progressFeed={progressFeed} sourcesFeed={sourcesFeed} />
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

  const handlePrint = async () => {
    const report = document.getElementById("research-report-printable")
    if (!report) return

    const prevStyle = report.getAttribute("style")
    report.style.maxWidth = "1200px"
    report.style.padding = "24px"
    report.style.background = "#ffffff"

    try {
      const canvas = await html2canvas(report, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      const imgData = canvas.toDataURL("image/png", 1.0)
      const pdf = new jsPDF("p", "pt", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 24
      const contentWidth = pdfWidth - margin * 2
      const scaledHeight = (canvas.height * contentWidth) / canvas.width

      let remainingHeight = scaledHeight
      let position = 0

      while (remainingHeight > 0) {
        pdf.addImage(imgData, "PNG", margin, margin - position, contentWidth, scaledHeight)
        remainingHeight -= pdfHeight - margin * 2
        position += pdfHeight - margin * 2
        if (remainingHeight > 0) {
          pdf.addPage()
        }
      }

      pdf.save(`${idea.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_research_report.pdf`)
    } finally {
      if (prevStyle === null) {
        report.removeAttribute("style")
      } else {
        report.setAttribute("style", prevStyle)
      }
    }
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
          <AccordionItem value="verdict" data-pdf-title="AI Verdict and Cross Validation" className="border rounded-xl bg-white overflow-hidden shadow-sm">
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
          <AccordionItem value="competitors" data-pdf-title="Competitors and Alternatives" className="border rounded-xl bg-white overflow-hidden shadow-sm">
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
          <AccordionItem value="reddit" data-pdf-title="Reddit Pulse" className="border rounded-xl bg-white overflow-hidden shadow-sm">
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
          <AccordionItem value="market" data-pdf-title="Market Context" className="border rounded-xl bg-white overflow-hidden shadow-sm">
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
          <AccordionItem value="search" data-pdf-title="Search Demand" className="border rounded-xl bg-white overflow-hidden shadow-sm">
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
          <AccordionItem value="news" data-pdf-title="News and Existing Solutions" className="border rounded-xl bg-white overflow-hidden shadow-sm">
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
            onClick={() => generate(true, depth)}
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
        {isOwner && (
          <div className="inline-flex items-center gap-1 rounded-full border bg-white p-1">
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded-full ${depth === "fast" ? "bg-orange-100 text-orange-700" : "text-gray-600"}`}
              onClick={() => setDepth("fast")}
            >
              Fast
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs rounded-full ${depth === "deep" ? "bg-orange-100 text-orange-700" : "text-gray-600"}`}
              onClick={() => setDepth("deep")}
            >
              Deep
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
