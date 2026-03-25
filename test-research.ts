import { PrismaClient } from "@prisma/client"
import { generateResearch } from "./src/lib/research"

const prisma = new PrismaClient()

async function test() {
  console.log("Fetching an idea...")
  const idea = await prisma.idea.findFirst({
    include: { founder: true }
  })

  if (!idea) {
    console.error("No ideas found in DB.")
    process.exit(1)
  }

  console.log(`Testing with idea: ${idea.title}`)
  console.log(`Pitch: ${idea.pitch}`)

  try {
    console.log("Generating research report...")
    const result = await generateResearch({ idea } as any)
    console.log("Research successfully generated!")
    console.log("Competitors:", result.competitors?.length)
    if (result.marketData) console.log("Market Analysis Present")
    if (result.redditData) console.log("Reddit Data Present")
    if (result.searchData) console.log("Search Data Present")
    console.log("Verdict:", result.verdict?.summary)
  } catch (error) {
    console.error("Error generating research:", error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
