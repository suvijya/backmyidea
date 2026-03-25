import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "suvijya123@gmail.com" }
  })

  if (!user) {
    console.error("User not found")
    return
  }

  const dummyIdea = await prisma.idea.create({
    data: {
      founderId: user.id,
      title: "Zenith - AI Meeting Assistant",
      pitch: "An AI tool that records, transcribes, and automatically extracts action items and assigns them to team members directly in Jira or Asana.",
      problem: "Teams spend hours manually writing notes and transferring action items to project management tools after meetings, causing delays and dropped tasks.",
      solution: "Zenith joins meetings as a silent participant, transcribes the conversation with high accuracy, identifies actionable tasks using LLMs, and uses webhooks to create tickets directly in your team's project management software.",
      category: "SAAS",
      stage: "PROTOTYPE",
      tags: ["AI", "Productivity", "B2B"],
      feedbackQuestion: "Would your team actually pay for this to save time?",
      status: "ACTIVE",
      slug: "zenith-ai-meeting-assistant-dummy123",
      validationScore: 40,
      totalVotes: 5,
      useThisCount: 3,
      maybeCount: 1,
      notForMeCount: 1
    }
  })

  console.log("Created dummy idea:", dummyIdea.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())