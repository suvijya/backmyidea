"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface UseResearchOptions {
  ideaId: string
  onComplete?: () => void
}

type ResearchDepth = "fast" | "deep"

export function useResearch({ ideaId, onComplete }: UseResearchOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState("")
  const [progressFeed, setProgressFeed] = useState<string[]>([])
  const [sourcesFeed, setSourcesFeed] = useState<Array<{ url: string; status: "queued" | "scraping" | "done" | "failed"; chars?: number; channel?: "reddit" | "news" | "web" | "x" | "forum"; relevance?: number }>>([])
  const [research, setResearch] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (force: boolean = false, depth: ResearchDepth = "deep") => {
    setIsGenerating(true)
    setError(null)
    setProgress("Starting research...")
    setProgressFeed(["Starting research..."])
    setSourcesFeed([])

    try {
      const searchParams = new URLSearchParams()
      if (force) searchParams.set("force", "true")
      searchParams.set("depth", depth)
      const url = `/api/ideas/${ideaId}/research?${searchParams.toString()}`
      const res = await fetch(url, {
        method: "POST",
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to start research")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("Stream not supported")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                setProgress(data.message)
                setProgressFeed((prev) => {
                  if (prev[prev.length - 1] === data.message) return prev
                  return [...prev, data.message].slice(-60)
                })
              } else if (data.type === 'source') {
                setSourcesFeed((prev) => {
                  const existingIndex = prev.findIndex((s) => s.url === data.url)
                  const next = [...prev]
                  const item = {
                    url: data.url,
                    status: data.status as "queued" | "scraping" | "done" | "failed",
                    chars: typeof data.chars === "number" ? data.chars : undefined,
                    channel: data.channel as "reddit" | "news" | "web" | "x" | "forum" | undefined,
                    relevance: typeof data.relevance === "number" ? data.relevance : undefined,
                  }
                  if (existingIndex >= 0) {
                    next[existingIndex] = { ...next[existingIndex], ...item }
                  } else {
                    next.push(item)
                  }
                  return next.slice(-300)
                })
              } else if (data.type === 'complete' || data.type === 'cached') {
                setResearch(data.research)
                toast.success("Research report ready!")
                onComplete?.()
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e
              }
            }
          }
        }
      }
    } catch (err: any) {
      const message = err.message || "Failed to generate research. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
      setProgress("")
      setProgressFeed([])
      setSourcesFeed([])
    }
  }, [ideaId, onComplete])

  const fetchExisting = useCallback(async () => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/research`)
      const data = await res.json()
      if (data.research && data.research.status === "COMPLETED") {
        setResearch(data.research)
      }
      return data.research
    } catch {
      return null
    }
  }, [ideaId])

  return {
    generate,
    fetchExisting,
    isGenerating,
    progress,
    progressFeed,
    sourcesFeed,
    research,
    error,
    setResearch,
  }
}
