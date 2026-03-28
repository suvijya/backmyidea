"use client"

import { RedditData } from "@/lib/research"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, MessageCircle, ArrowUp } from "lucide-react"

interface RedditSectionProps {
  redditData: RedditData
}

export function RedditSection({ redditData }: RedditSectionProps) {
  if (redditData.totalPostsFound === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-500">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>No relevant Reddit discussions found about this specific problem.</p>
      </div>
    )
  }

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === "positive") return "text-green-600 bg-green-50 border-green-200"
    if (sentiment === "negative") return "text-red-600 bg-red-50 border-red-200"
    if (sentiment === "mixed") return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  const getSentimentEmoji = (sentiment: string) => {
    if (sentiment === "positive") return "😃"
    if (sentiment === "negative") return "😡"
    if (sentiment === "mixed") return "🤷"
    return "😐"
  }

  const cleanList = (items: string[]) => items
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 12 && !/^(n\/a|none|unknown|null)$/i.test(item))

  const painPoints = cleanList(redditData.commonPainPoints || [])
  const praises = cleanList(redditData.commonPraises || [])

  const communityDemandScore = Math.max(0, Math.min(100, Math.round(((redditData.sentimentScore + 100) / 2) * 0.6 + Math.min(redditData.totalPostsFound, 20) * 2)))
  const engagementIntensity = redditData.topPosts.reduce((sum, post) => sum + post.upvotes + post.commentCount * 2, 0)
  const concernRatio = painPoints.length + praises.length > 0
    ? Math.round((painPoints.length / (painPoints.length + praises.length)) * 100)
    : 50

  return (
    <div className="space-y-6 pt-2">
      {/* Top Stats */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sentiment Score */}
        <div className={`flex-1 p-5 rounded-xl border ${getSentimentColor(redditData.sentiment)} flex items-center gap-4`}>
          <div className="text-4xl">{getSentimentEmoji(redditData.sentiment)}</div>
          <div>
            <div className="text-xs uppercase font-bold tracking-wider opacity-70 mb-1">Overall Sentiment</div>
            <div className="text-xl font-bold capitalize flex items-baseline gap-2">
              {redditData.sentiment}
              <span className="text-sm font-normal opacity-70">
                (Score: {redditData.sentimentScore}/100)
              </span>
            </div>
          </div>
        </div>

        {/* Post Count & Subreddits */}
        <div className="flex-[2] p-5 rounded-xl border border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-semibold text-gray-500 uppercase">Analyzed {redditData.totalPostsFound} Posts</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {redditData.topSubreddits.map(sub => (
              <Badge key={sub} variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
                {sub}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex-1 p-5 rounded-xl border border-violet-200 bg-violet-50/40">
          <div className="text-xs uppercase font-bold tracking-wider text-violet-700 mb-1">Community Demand Score</div>
          <div className="text-2xl font-bold text-violet-900">{communityDemandScore}/100</div>
          <div className="mt-2 h-2 w-full bg-violet-100 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500" style={{ width: `${communityDemandScore}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase font-semibold text-gray-500">Engagement Intensity</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{engagementIntensity.toLocaleString()}</div>
          <p className="text-sm text-gray-600 mt-1">Combined weighted upvotes + comments across top discussions.</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase font-semibold text-gray-500">Concern Ratio</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{concernRatio}%</div>
          <p className="text-sm text-gray-600 mt-1">Share of pain points versus praise signals in Reddit narratives.</p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-gray-800 font-medium leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-l-orange-400">
        {redditData.summary}
      </p>

      {/* Pain Points vs Praises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {painPoints.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <span className="bg-red-100 p-1 rounded">🔴</span> Common Pain Points
            </h4>
            <ul className="space-y-2 bg-red-50/30 p-4 rounded-lg border border-red-100 h-full">
              {painPoints.map((point, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start">
                  <span className="text-red-500 mr-2 mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {praises.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span className="bg-green-100 p-1 rounded">🟢</span> What People Love
            </h4>
            <ul className="space-y-2 bg-green-50/30 p-4 rounded-lg border border-green-100 h-full">
              {praises.map((praise, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start">
                  <span className="text-green-500 mr-2 mt-0.5">•</span>
                  {praise}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Top Posts */}
      {redditData.topPosts.length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold text-gray-900 mb-4">Top Relevant Discussions</h4>
          <div className="space-y-3">
            {redditData.topPosts.map((post, i) => (
              <a 
                key={i}
                href={post.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 border rounded-lg hover:border-orange-300 hover:shadow-sm transition-all group bg-white"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left side stats */}
                  <div className="flex sm:flex-col gap-4 sm:gap-1 items-center sm:w-16 shrink-0 text-gray-500">
                    <div className="flex items-center gap-1 font-medium">
                      <ArrowUp className="w-4 h-4" /> {post.upvotes}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <MessageCircle className="w-3.5 h-3.5" /> {post.commentCount}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-gray-500">
                        {post.subreddit}
                      </Badge>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center">
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${post.sentiment === 'positive' ? 'bg-green-500' : post.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                        {post.sentiment}
                      </span>
                    </div>
                    <h5 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight pr-6 relative">
                      {post.title}
                      <ExternalLink className="w-3.5 h-3.5 absolute right-0 top-1 opacity-0 group-hover:opacity-100 text-blue-600" />
                    </h5>
                    <div className="bg-gray-50 p-2.5 rounded text-sm text-gray-700 italic border-l-2 border-gray-300">
                      "{post.keyInsight}"
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
