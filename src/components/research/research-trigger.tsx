"use client"

import { Button } from "@/components/ui/button"
import { useResearch } from "@/hooks/use-research"
import { useAuth } from "@clerk/nextjs"
import { Loader2, RefreshCw } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ResearchTriggerProps {
  ideaId: string
  existingResearch: any | null
  isOwner: boolean
}

const PROGRESS_STEPS = [
  { id: "intent", label: "Analyze idea intent", matches: ["intent", "semantic scope"] },
  { id: "discover", label: "Discover sources", matches: ["searching reddit", "searching the web", "source universe", "found "] },
  { id: "crawl", label: "Collect source evidence", matches: ["crawling", "scraping source", "queued", "captured", "scraped successfully"] },
  { id: "synthesize", label: "Synthesize insights", matches: ["analyzing market", "reddit sentiment", "generating final verdict", "synthesizing"] },
  { id: "finalize", label: "Finalize report", matches: ["saving results", "research complete"] },
]

function formatSourceLabel(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() || ""
    const cleaned = lastSegment
      .replace(/[-_]+/g, " ")
      .replace(/\b(comments?|item|posts?|article|topic|tag|products?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()

    if (!cleaned) return host
    return `${host} • ${cleaned.slice(0, 42)}`
  } catch {
    return url.slice(0, 52)
  }
}

export function ResearchProgress({
  progress,
  progressFeed = [],
  sourcesFeed = [],
}: {
  progress: string
  progressFeed?: string[]
  sourcesFeed?: Array<{ url: string; status: "queued" | "scraping" | "done" | "failed"; chars?: number; channel?: "reddit" | "news" | "web" | "x" | "forum"; relevance?: number; error?: string }>
}) {
  const latestUpdates = (progressFeed.length > 0 ? progressFeed : [progress || "Starting analysis..."]).slice(-4)
  const progressJoined = `${progressFeed.join(" ")} ${progress}`.toLowerCase()
  const activeStepIndex = Math.max(
    0,
    PROGRESS_STEPS.reduce((last, step, index) => {
      const hit = step.matches.some((term) => progressJoined.includes(term))
      return hit ? index : last
    }, 0)
  )

  const sourceCards = sourcesFeed
    .map((item) => ({
      key: item.url,
      label: formatSourceLabel(item.url),
    }))
    .slice(-24)
  
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 border border-orange-100 rounded-xl bg-gradient-to-b from-white to-orange-50/40 max-w-xl mx-auto w-full text-left overflow-hidden shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Running AI deep dive...</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 break-words">{progress || "Collecting market and discussion signals..."}</p>
        </div>
      </div>

      <div className="rounded-lg border border-orange-100 bg-white/80 p-3">
        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-500 font-semibold mb-2">Progress</div>
        <div className="mb-3 space-y-1.5">
          {PROGRESS_STEPS.map((step, index) => {
            const done = index < activeStepIndex
            const active = index === activeStepIndex
            return (
              <div key={step.id} className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${done ? "bg-emerald-500" : active ? "bg-orange-500" : "bg-gray-300"}`}
                />
                <span className={`text-xs ${done ? "text-gray-700" : active ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-500 font-semibold mb-2">Live Updates</div>
        <div className="space-y-1.5 max-h-20 overflow-auto pr-1">
          {latestUpdates.map((line, idx) => (
            <p key={`${line}-${idx}`} className="text-xs text-gray-700 leading-relaxed break-words">{line}</p>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-orange-100 bg-white/80 p-3">
        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-500 font-semibold mb-2">Live Source Feed</div>
        <div className="max-h-36 overflow-auto pr-1">
          {sourceCards.length === 0 ? (
            <p className="text-xs text-gray-500">Discovering sources...</p>
          ) : (
            <motion.div layout className="flex flex-wrap gap-1.5">
              <AnimatePresence initial={false}>
                {sourceCards.map((source) => (
                  <motion.span
                    key={source.key}
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="inline-flex max-w-full items-center rounded-md border border-orange-100 bg-orange-50/70 px-2 py-1 text-[11px] text-gray-700"
                    title={source.label}
                  >
                    <span className="truncate">{source.label}</span>
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ResearchTrigger({ ideaId, existingResearch, isOwner }: ResearchTriggerProps) {
  const { userId } = useAuth()
  const router = useRouter()
  const [depth, setDepth] = useState<"fast" | "deep">("deep")
  const staleGenerating = Boolean(
    existingResearch?.status === "GENERATING" &&
      existingResearch?.generatedAt &&
      Date.now() - new Date(existingResearch.generatedAt).getTime() > 20 * 60 * 1000
  )
  
  const { generate, isGenerating, progress, progressFeed, sourcesFeed } = useResearch({ 
    ideaId,
    onComplete: () => {
      router.refresh()
    }
  })

  if (isGenerating) {
    return <ResearchProgress progress={progress} progressFeed={progressFeed} sourcesFeed={sourcesFeed} />
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-orange-50/30 text-center">
        <h3 className="font-semibold text-lg mb-2">Unlock AI Research</h3>
        <p className="text-gray-600 mb-4 max-w-md">
          See competitor analysis, Reddit sentiment, and search demand for this idea.
        </p>
        <Button asChild>
          <Link href="/sign-in">Sign in to view research</Link>
        </Button>
      </div>
    )
  }

  if (existingResearch?.status === "GENERATING" && !staleGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
        <p className="font-medium text-gray-900">Research is being generated...</p>
        <p className="text-sm text-gray-500 mt-2">Check back in a minute.</p>
      </div>
    )
  }

  if (staleGenerating && isOwner) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-gray-50 text-center">
        <p className="text-gray-600 mb-4">Previous generation appears stuck. You can safely retry now.</p>
        <Button onClick={() => generate(true, depth)} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Research
        </Button>
      </div>
    )
  }

  if (existingResearch?.status === "COMPLETED") {
    const isExpired = new Date(existingResearch.expiresAt) < new Date()
    
    if (isExpired && isOwner) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-gray-50 text-center">
          <p className="text-gray-600 mb-4">This research report is older than 7 days.</p>
          <Button onClick={() => generate(true)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Research
          </Button>
        </div>
      )
    }
    
    return null // Panel will be shown instead
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 border border-orange-100 rounded-xl bg-gradient-to-b from-white to-orange-50/30 text-center shadow-sm">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-2xl">
        🔬
      </div>
      <h3 className="font-bold text-xl sm:text-2xl mb-2 text-gray-900">
        Generate AI Research Report
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        Our AI will analyze competitors, Reddit sentiment, market demand, and provide a comprehensive cross-validation verdict.
      </p>
      
      <Button 
        onClick={() => generate(false, depth)} 
        size="lg" 
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 shadow-md"
      >
        <span className="mr-2">🔍</span> Research This Idea
      </Button>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-white p-1">
        <button
          type="button"
          className={`px-3 py-1 text-xs rounded-full ${depth === "fast" ? "bg-orange-100 text-orange-700" : "text-gray-600"}`}
          onClick={() => setDepth("fast")}
        >
          Fast (~30 sources)
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-xs rounded-full ${depth === "deep" ? "bg-orange-100 text-orange-700" : "text-gray-600"}`}
          onClick={() => setDepth("deep")}
        >
          Deep (40-100 sources)
        </button>
      </div>
      
      <p className="text-xs text-gray-400 mt-4">
        Free · Takes ~45 seconds · {isOwner ? "Available for your ideas" : "3 free reports per day"}
      </p>
    </div>
  )
}
