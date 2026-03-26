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
    const pdf = new jsPDF("p", "pt", "a4")
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 42
    const contentW = pageW - margin * 2
    let y = margin

    const ensurePage = (h: number) => {
      if (y + h > pageH - margin) {
        pdf.addPage()
        y = margin
      }
    }

    const drawHeader = () => {
      pdf.setFillColor(17, 24, 39)
      pdf.rect(0, 0, pageW, 96, "F")
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(22)
      pdf.setTextColor(255, 255, 255)
      pdf.text("PIQD Deep Dive Report", margin, 40)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(11)
      pdf.setTextColor(229, 231, 235)
      pdf.text(`Generated ${new Date(research.generatedAt).toLocaleString()}`, margin, 62)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(10)
      pdf.setTextColor(251, 191, 36)
      pdf.text("India-Born Startup Intelligence", pageW - margin - 170, 40)
      y = 124
    }

    const drawCoverPage = () => {
      drawHeader()
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(28)
      pdf.setTextColor(17, 24, 39)
      const titleLines = pdf.splitTextToSize(idea.title, contentW)
      pdf.text(titleLines, margin, 190)

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(12)
      pdf.setTextColor(75, 85, 99)
      const pitchLines = pdf.splitTextToSize(idea.pitch || "", contentW)
      pdf.text(pitchLines, margin, 230)

      pdf.setFillColor(255, 247, 237)
      pdf.roundedRect(margin, 290, contentW, 140, 10, 10, "F")
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.setTextColor(17, 24, 39)
      pdf.text("Founder Snapshot", margin + 16, 316)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(11)
      pdf.setTextColor(55, 65, 81)
      pdf.text(`Category: ${idea.category.replace(/_/g, " ")}`, margin + 16, 340)
      pdf.text(`Stage: ${idea.stage.replace(/_/g, " ")}`, margin + 16, 360)
      pdf.text(`Signal: ${String(research?.verdict?.overallSignal || "moderate").toUpperCase()}`, margin + 16, 380)
      pdf.text(`Sources discovered: ${research?.sourceStats?.discovered || 0}`, margin + 16, 400)

      pdf.setFont("helvetica", "italic")
      pdf.setFontSize(10)
      pdf.setTextColor(100, 116, 139)
      pdf.text("Confidential report generated for PIQD founders.", margin, pageH - 50)
      pdf.addPage()
      y = margin
    }

    const drawTOC = () => {
      drawHeader()
      y = 140
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(20)
      pdf.setTextColor(17, 24, 39)
      pdf.text("Table of Contents", margin, y)
      y += 28

      const tocItems = [
        "1. Executive Summary",
        "2. Investor Snapshot",
        "3. Strengths, Risks, Recommendations",
        "4. Market Context",
        "5. Search Demand",
        "6. Reddit Pulse",
        "7. Competitor Landscape",
        "8. News and Evidence",
        "9. Source Appendix",
      ]

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(12)
      tocItems.forEach((item) => {
        pdf.text(item, margin, y)
        y += 20
      })

      pdf.addPage()
      y = margin
    }

    const drawTitleBlock = () => {
      ensurePage(120)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(20)
      pdf.setTextColor(17, 24, 39)
      const titleLines = pdf.splitTextToSize(idea.title, contentW)
      pdf.text(titleLines, margin, y)
      y += titleLines.length * 24

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(11)
      pdf.setTextColor(75, 85, 99)
      const pitchLines = pdf.splitTextToSize(idea.pitch || "", contentW)
      pdf.text(pitchLines, margin, y)
      y += pitchLines.length * 16 + 12

      pdf.setDrawColor(229, 231, 235)
      pdf.line(margin, y, pageW - margin, y)
      y += 16
    }

    const drawMetricCards = () => {
      ensurePage(96)
      const gap = 10
      const boxW = (contentW - gap * 2) / 3
      const cards = [
        { label: "Overall Score", value: `${research?.verdict?.overallScore ?? 0}/100` },
        { label: "Signal", value: String(research?.verdict?.overallSignal || "moderate").toUpperCase() },
        { label: "Sources", value: String(research?.sourceStats?.discovered || 0) },
      ]
      cards.forEach((c, i) => {
        const x = margin + i * (boxW + gap)
        pdf.setFillColor(249, 250, 251)
        pdf.setDrawColor(229, 231, 235)
        pdf.roundedRect(x, y, boxW, 78, 8, 8, "FD")
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(9)
        pdf.setTextColor(107, 114, 128)
        pdf.text(c.label.toUpperCase(), x + 12, y + 18)
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(18)
        pdf.setTextColor(17, 24, 39)
        pdf.text(c.value, x + 12, y + 44)
      })
      y += 96
    }

    const drawSection = (title: string, body?: string, bullets?: string[]) => {
      ensurePage(48)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(14)
      pdf.setTextColor(17, 24, 39)
      pdf.text(title, margin, y)
      y += 14
      pdf.setDrawColor(243, 244, 246)
      pdf.line(margin, y, pageW - margin, y)
      y += 14

      if (body) {
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(11)
        pdf.setTextColor(55, 65, 81)
        const lines = pdf.splitTextToSize(body, contentW)
        ensurePage(lines.length * 14 + 8)
        pdf.text(lines, margin, y)
        y += lines.length * 14 + 8
      }

      if (bullets && bullets.length > 0) {
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(10)
        pdf.setTextColor(55, 65, 81)
        bullets.slice(0, 8).forEach((item) => {
          const lines = pdf.splitTextToSize(item, contentW - 14)
          ensurePage(lines.length * 13 + 6)
          pdf.text("-", margin, y)
          pdf.text(lines, margin + 12, y)
          y += lines.length * 13 + 6
        })
      }

      y += 8
    }

    drawCoverPage()
    drawTOC()
    drawHeader()
    drawTitleBlock()
    drawMetricCards()

    drawSection("Executive Summary", research?.verdict?.summary || "No summary generated.")
    drawSection("Key Insight", research?.verdict?.keyInsight || "No key insight generated.")
    drawSection("Strengths", undefined, Array.isArray(research?.verdict?.strengths) ? research.verdict.strengths : [])
    drawSection("Risks", undefined, Array.isArray(research?.verdict?.risks) ? research.verdict.risks : [])
    drawSection("Recommendations", undefined, Array.isArray(research?.verdict?.recommendations) ? research.verdict.recommendations : [])

    drawSection(
      "Market Context",
      `TAM: ${research?.marketData?.estimatedTAM || "N/A"}\nSAM: ${research?.marketData?.estimatedSAM || "N/A"}\nGrowth: ${research?.marketData?.growthRate || "N/A"}\nMaturity: ${research?.marketData?.marketMaturity || "N/A"}`
    )

    drawSection(
      "Search Demand",
      `Primary keyword: ${research?.searchData?.primaryKeyword || "N/A"}\nTrend direction: ${research?.searchData?.trendDirection || "stable"}\n${research?.searchData?.trendSummary || "No trend summary available."}`,
      Array.isArray(research?.searchData?.relatedKeywords)
        ? research.searchData.relatedKeywords.slice(0, 8).map((k: { keyword: string; volume: string; trend: string }) => `${k.keyword} (${k.volume}, ${k.trend})`)
        : []
    )

    drawSection(
      "Reddit Pulse",
      `Posts analyzed: ${research?.redditData?.totalPostsFound || 0}\nSentiment: ${research?.redditData?.sentiment || "neutral"} (${research?.redditData?.sentimentScore || 0}/100)\n${research?.redditData?.summary || "No summary available."}`,
      Array.isArray(research?.redditData?.topPosts)
        ? research.redditData.topPosts.slice(0, 6).map((p: { title: string; upvotes: number; commentCount: number }) => `${p.title} | ${p.upvotes} upvotes | ${p.commentCount} comments`)
        : []
    )

    drawSection(
      "Top Competitors",
      undefined,
      Array.isArray(research?.competitors)
        ? research.competitors.slice(0, 8).map((c: { name: string; similarity: string; differentiator: string }) => `${c.name} (${c.similarity}) - ${c.differentiator}`)
        : []
    )

    drawSection(
      "News and Evidence",
      research?.newsData?.industryNews || "No industry summary available.",
      Array.isArray(research?.newsData?.articles)
        ? research.newsData.articles.slice(0, 10).map((a: { title: string; source: string }) => `${a.title} - ${a.source}`)
        : []
    )

    pdf.addPage()
    y = margin
    drawHeader()
    y = 140
    drawSection(
      "Investor Snapshot (One-Page)",
      `${idea.title}\nScore: ${research?.verdict?.overallScore || 0}/100\nSignal: ${research?.verdict?.overallSignal || "moderate"}\nShould Build: ${research?.verdict?.shouldBuild || "maybe"}\nKey Insight: ${research?.verdict?.keyInsight || "N/A"}`,
      [
        ...(Array.isArray(research?.verdict?.strengths) ? research.verdict.strengths.slice(0, 3).map((s: string) => `Strength: ${s}`) : []),
        ...(Array.isArray(research?.verdict?.risks) ? research.verdict.risks.slice(0, 3).map((r: string) => `Risk: ${r}`) : []),
      ]
    )

    drawSection(
      "Source Appendix",
      "Top evidence references grouped by channel.",
      [
        `Reddit analyzed: ${research?.redditData?.totalPostsFound || 0}`,
        `News articles: ${research?.newsData?.articles?.length || 0}`,
        `Discovered sources: ${research?.sourceStats?.discovered || 0}`,
        `Scraped sources: ${research?.sourceStats?.scraped || 0}`,
      ]
    )

    const appendixSources: string[] = []
    if (Array.isArray(research?.newsData?.articles)) {
      research.newsData.articles.slice(0, 20).forEach((a: { title: string; source: string; url?: string }) => {
        appendixSources.push(`${a.title} (${a.source})${a.url ? ` - ${a.url}` : ""}`)
      })
    }
    if (Array.isArray(research?.redditData?.topPosts)) {
      research.redditData.topPosts.slice(0, 15).forEach((p: { title: string; url?: string }) => {
        appendixSources.push(`${p.title}${p.url ? ` - ${p.url}` : ""}`)
      })
    }
    drawSection("Evidence URLs", undefined, appendixSources)

    if (research?.sourceCitations) {
      drawSection("Citations: Market", undefined, (research.sourceCitations.market || []).slice(0, 12))
      drawSection("Citations: Search", undefined, (research.sourceCitations.search || []).slice(0, 10))
      drawSection("Citations: Reddit", undefined, (research.sourceCitations.reddit || []).slice(0, 12))
      drawSection("Citations: Competitors", undefined, (research.sourceCitations.competitors || []).slice(0, 10))
      drawSection("Citations: News", undefined, (research.sourceCitations.news || []).slice(0, 12))
    }

    const pages = pdf.getNumberOfPages()
    for (let i = 1; i <= pages; i += 1) {
      pdf.setPage(i)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9)
      pdf.setTextColor(107, 114, 128)
      pdf.text(`Page ${i} of ${pages}`, pageW - margin - 56, pageH - 18)
    }

    pdf.save(`${idea.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_research_report.pdf`)
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
        {research?.sourceStats && (
          <div className="flex gap-2 text-[11px] text-gray-600">
            <span className="px-2 py-1 rounded-full bg-white border">Discovered: {research.sourceStats.discovered}</span>
            <span className="px-2 py-1 rounded-full bg-white border">Scraped: {research.sourceStats.scraped}</span>
          </div>
        )}
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
