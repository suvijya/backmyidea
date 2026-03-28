"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/clerk"
import { generateResearch, type ResearchInput } from "@/lib/research"
import { researchLimiter } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { IdeaResearch } from "@prisma/client"

const STALE_GENERATION_MS = 10 * 60 * 1000

export async function requestResearch(ideaId: string) {
  const user = await requireUser()

  // Rate limit: 3 per day per user
  let rateLimitOk = true
  if (!user.isAdmin && user.email !== "suvijya123@gmail.com") {
    const { success } = await researchLimiter.limit(user.id)
    rateLimitOk = success
  }

  if (!rateLimitOk) {
    return { error: "You've used your 3 free research reports today. Try again tomorrow." }
  }

  // Check if research already exists and is fresh
  const existing = await prisma.ideaResearch.findUnique({
    where: { ideaId },
  })

  if (existing && existing.status === "COMPLETED" && existing.expiresAt > new Date()) {
    return { success: true, research: existing, cached: true }
  }

  if (existing && existing.status === "GENERATING") {
    const isStale = Date.now() - existing.generatedAt.getTime() > STALE_GENERATION_MS
    if (!isStale) {
      return { error: "Research is already being generated. Please wait." }
    }

    await prisma.ideaResearch.update({
      where: { id: existing.id },
      data: {
        status: "FAILED",
        error: "Auto-marked stale generation after timeout",
      },
    })
  }

  // Fetch idea with all needed data
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

  if (!idea) return { error: "Idea not found" }

  // Create or update research record as GENERATING
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
        useThisPercent: idea.totalVotes > 0
          ? Math.round((idea.useThisCount / idea.totalVotes) * 100)
          : 0,
        maybePercent: idea.totalVotes > 0
          ? Math.round((idea.maybeCount / idea.totalVotes) * 100)
          : 0,
        notForMePercent: idea.totalVotes > 0
          ? Math.round((idea.notForMeCount / idea.totalVotes) * 100)
          : 0,
        totalComments: idea.totalComments,
      },
    },
    update: {
      status: "GENERATING",
      requestedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      generatedAt: new Date(),
      error: null,
    },
  })

  // Generate research (this takes 15-45 seconds)
  try {
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
    }

    const result = await generateResearch(input)

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
        generatedAt: new Date(),
      },
    })

    revalidatePath(`/idea/${idea.slug}`)
    return { success: true, research: updated, cached: false }
  } catch (error) {
    console.error("Research generation failed:", error)

    await prisma.ideaResearch.update({
      where: { id: researchRecord.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })

    return { error: "Research generation failed. Please try again." }
  }
}

export async function getResearch(ideaId: string) {
  const research = await prisma.ideaResearch.findUnique({
    where: { ideaId },
  })

  if (!research) return null
  if (research.status !== "COMPLETED") return { status: research.status }

  // Increment view count (fire and forget)
  prisma.ideaResearch.update({
    where: { id: research.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  return research
}

export async function regenerateResearch(ideaId: string) {
  const user = await requireUser()

  // Verify the idea belongs to the user OR user is admin
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { founderId: true },
  })

  if (!idea) return { error: "Idea not found" }
  if (idea.founderId !== user.id && !user.isAdmin) {
    return { error: "Only the idea founder can regenerate research" }
  }

  // Delete existing and regenerate
  await prisma.ideaResearch.deleteMany({ where: { ideaId } })
  return requestResearch(ideaId)
}
