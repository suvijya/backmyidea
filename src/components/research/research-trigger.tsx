"use client"

import { Button } from "@/components/ui/button"
import { useResearch } from "@/hooks/use-research"
import { useAuth } from "@clerk/nextjs"
import { Loader2, RefreshCw, CheckCircle2, CircleDashed } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ResearchTriggerProps {
  ideaId: string
  existingResearch: any | null
  isOwner: boolean
}

export const RESEARCH_STEPS = [
  "Initializing research pipeline...",
  "Formulating search queries...",
  "Searching Reddit posts...",
  "Crawling top Reddit threads for comment-level context...",
  "Searching the web for competitors, news, and Reddit discussions...",
  "Performing deep scraping on News results...",
  "Analyzing market and top competitors...",
  "Analyzing Reddit sentiment and user pain points...",
  "Synthesizing search demand, news, and generating final verdict...",
  "Saving results...",
  "Research complete!"
]

export function ResearchProgress({ progress }: { progress: string }) {
  const matchedStepIndex = RESEARCH_STEPS.indexOf(progress)
  const currentStepIndex = matchedStepIndex >= 0 ? matchedStepIndex : 0
  const hasCustomProgress = Boolean(progress) && matchedStepIndex === -1
  
  return (
    <div className="flex flex-col p-6 sm:p-8 border border-dashed border-orange-200 rounded-xl bg-orange-50/10 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        <h3 className="font-semibold text-lg text-gray-900">Researching your idea...</h3>
      </div>
      
      <div className="space-y-3">
        {hasCustomProgress && (
          <div className="flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin shrink-0 mt-0.5" />
            <span className="text-sm text-gray-900 font-medium">{progress}</span>
          </div>
        )}
        {RESEARCH_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex || progress === "Research complete!"
          const isActive = index === currentStepIndex && progress !== "Research complete!"
          const isPending = index > currentStepIndex && progress !== "Research complete!"
          
          return (
            <div key={step} className={`flex items-start gap-3 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : isActive ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin shrink-0 mt-0.5" />
              ) : (
                <CircleDashed className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${isActive ? 'text-gray-900 font-medium' : isCompleted ? 'text-gray-600' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ResearchTrigger({ ideaId, existingResearch, isOwner }: ResearchTriggerProps) {
  const { userId } = useAuth()
  const router = useRouter()
  
  const { generate, isGenerating, progress } = useResearch({ 
    ideaId,
    onComplete: () => {
      router.refresh()
    }
  })

  if (isGenerating) {
    return <ResearchProgress progress={progress} />
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

  if (existingResearch?.status === "GENERATING") {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
        <p className="font-medium text-gray-900">Research is being generated...</p>
        <p className="text-sm text-gray-500 mt-2">Check back in a minute.</p>
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
        onClick={() => generate(false)} 
        size="lg" 
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 shadow-md"
      >
        <span className="mr-2">🔍</span> Research This Idea
      </Button>
      
      <p className="text-xs text-gray-400 mt-4">
        Free · Takes ~45 seconds · {isOwner ? "Available for your ideas" : "3 free reports per day"}
      </p>
    </div>
  )
}
