import { NextRequest, NextResponse } from "next/server"
import { getResearch } from "@/actions/research-actions"
import { getCurrentUser } from "@/lib/clerk"
import { prisma } from "@/lib/prisma"
import { researchLimiter } from "@/lib/redis"
import { generateResearch, type ResearchInput, type ResearchProgressEvent } from "@/lib/research"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const research = await getResearch(id)
  return NextResponse.json({ research })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 })
  }

  const { id: ideaId } = await params
  const force = req.nextUrl.searchParams.get("force") === "true"
  const requestedDepth = req.nextUrl.searchParams.get("depth")
  const researchDepth: "fast" | "deep" = requestedDepth === "fast" ? "fast" : "deep"

  // 1. Rate limiting
  let rateLimitOk = true
  if (!user.isAdmin && user.email !== "suvijya123@gmail.com") {
    const { success } = await researchLimiter.limit(user.id)
    rateLimitOk = success
  }

  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "You've used your 3 free research reports today. Try again tomorrow." },
      { status: 429 }
    )
  }

  // 2. Check existing
  const existing = await prisma.ideaResearch.findUnique({
    where: { ideaId },
  })

  if (!force && existing && existing.status === "COMPLETED" && existing.expiresAt > new Date()) {
    // Already completed, just stream a "done" event
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: ${JSON.stringify({ type: 'cached', research: existing })}\n\n`)
        controller.close()
      }
    })
    return new NextResponse(stream, { headers: { "Content-Type": "text/event-stream" } })
  }

  if (!force && existing && existing.status === "GENERATING") {
    return NextResponse.json(
      { error: "Research is already being generated. Please wait." },
      { status: 400 }
    )
  }
  
  if (force && existing) {
     await prisma.ideaResearch.deleteMany({ where: { ideaId } })
  }

  // 3. Fetch idea
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, status: "ACTIVE" },
    select: {
      id: true, title: true, pitch: true, problem: true,
      solution: true, category: true, stage: true, tags: true,
      feedbackQuestion: true, validationScore: true,
      totalVotes: true, useThisCount: true, maybeCount: true,
      notForMeCount: true, totalComments: true, slug: true,
    },
  })

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 })
  }

  // 4. Setup Stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
      }

      try {
        sendEvent("progress", { message: "Initializing research pipeline..." })

        // Mark as generating
        const researchRecord = await prisma.ideaResearch.upsert({
          where: { ideaId },
          create: {
            ideaId,
            requestedById: user.id,
            status: "GENERATING",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            crowdDataSnapshot: {
              validationScore: idea.validationScore,
              totalVotes: idea.totalVotes,
              useThisPercent: idea.totalVotes > 0 ? Math.round((idea.useThisCount / idea.totalVotes) * 100) : 0,
              maybePercent: idea.totalVotes > 0 ? Math.round((idea.maybeCount / idea.totalVotes) * 100) : 0,
              notForMePercent: idea.totalVotes > 0 ? Math.round((idea.notForMeCount / idea.totalVotes) * 100) : 0,
              totalComments: idea.totalComments,
            },
          },
          update: {
            status: "GENERATING",
            requestedById: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        })

        const input: ResearchInput = {
          ideaId: idea.id,
          title: idea.title,
          pitch: idea.pitch,
          problem: idea.problem,
          solution: idea.solution,
          category: idea.category,
          stage: idea.stage,
          tags: idea.tags,
          feedbackQuestion: idea.feedbackQuestion,
          validationScore: idea.validationScore,
          totalVotes: idea.totalVotes,
          useThisCount: idea.useThisCount,
          maybeCount: idea.maybeCount,
          notForMeCount: idea.notForMeCount,
          totalComments: idea.totalComments,
          researchDepth,
        }

        // Run research and hook into progress
        const result = await generateResearch(input, (event: ResearchProgressEvent) => {
          if (event.type === "progress") {
            sendEvent("progress", { message: event.message })
            return
          }

          sendEvent("source", {
            url: event.url,
            status: event.status,
            chars: event.chars,
            channel: event.channel,
            relevance: event.relevance,
            error: event.error,
          })
        })

        sendEvent("progress", { message: "Saving results..." })

        // Save results
        const updated = await prisma.ideaResearch.update({
          where: { id: researchRecord.id },
          data: {
            status: "COMPLETED",
            competitors: result.competitors as any,
            competitorCount: result.competitors.length,
            marketData: result.marketData as any,
            redditData: result.redditData as any,
            searchData: result.searchData as any,
            newsData: result.newsData as any,
            verdict: result.verdict as any,
            generationTime: result.generationTime,
            dataSourcesUsed: result.dataSourcesUsed,
            crowdDataSnapshot: {
              ...(researchRecord.crowdDataSnapshot as Record<string, unknown>),
              sourceStats: result.sourceStats || null,
            },
            generatedAt: new Date(),
          },
        })

        // Finally send complete
        sendEvent("complete", { research: updated })
      } catch (err: any) {
        console.error("Research SSE generation failed:", err)
        
        // Try to update DB to failed state
        await prisma.ideaResearch.update({
          where: { ideaId },
          data: {
            status: "FAILED",
            error: err.message || "Unknown error",
          },
        }).catch(() => {})

        sendEvent("error", { message: err.message || "An error occurred during generation." })
      } finally {
        controller.close()
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
