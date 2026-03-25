import { searchWeb, searchRedditTargeted } from "./src/lib/search-providers.js"
import dotenv from "dotenv"
dotenv.config()

async function test() {
  console.log("Testing Serper API...")
  const web = await searchWeb("Zenith AI Meeting Assistant", 2)
  console.log(web)

  console.log("\nTesting Reddit API...")
  const reddit = await searchRedditTargeted("Zenith AI Meeting OR saas", ["india", "startups", "SaaS"], 5)
  console.log(reddit)
}

test()
