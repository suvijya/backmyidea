"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface UseResearchOptions {
  ideaId: string
  onComplete?: () => void
}

export function useResearch({ ideaId, onComplete }: UseResearchOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState("")
  const [research, setResearch] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (force: boolean = false) => {
    setIsGenerating(true)
    setError(null)
    setProgress("Starting research...")

    try {
      const url = force ? `/api/ideas/${ideaId}/research?force=true` : `/api/ideas/${ideaId}/research`
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
    research,
    error,
    setResearch,
  }
}
