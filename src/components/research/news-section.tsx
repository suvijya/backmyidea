"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface NewsSectionProps {
  newsData: any
}

export function NewsSection({ newsData }: NewsSectionProps) {
  const articles = newsData?.articles || []

  if (!newsData || articles.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
        <p>No recent news or related solutions found for this topic.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {articles.map((item: any, idx: number) => {
          const href = item.url || "#"
          const sourceLabel = item.source || (item.url ? new URL(item.url).hostname.replace('www.', '') : 'unknown')

          return (
          <a 
            key={idx} 
            href={href}
            target="_blank" 
            rel="noopener noreferrer"
            className="group block"
          >
            <Card className="hover:border-blue-200 hover:shadow-sm transition-all bg-white border-gray-100 overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {item.relevance || item.content || "Relevant industry coverage"}
                  </p>
                  <div className="pt-2 text-xs text-gray-400 font-medium truncate max-w-[250px] sm:max-w-sm">
                    {sourceLabel}
                  </div>
                </div>
                <div className="shrink-0 p-2 bg-gray-50 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 text-gray-400 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </a>
        )})}
      </div>
      
      {newsData.queries && newsData.queries.length > 0 && (
        <div className="pt-4 mt-2 border-t text-sm">
          <span className="text-gray-500 mr-2">Searched for:</span>
          <span className="text-gray-700 italic">"{newsData.queries[0]}"</span>
        </div>
      )}
    </div>
  )
}
