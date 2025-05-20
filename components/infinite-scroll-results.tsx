"use client"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { search } from "@/app/actions/explore-actions"
import { ShoutList } from "@/components/shout-list"
import { UserList } from "@/components/user-list"
import { HashtagList } from "@/components/hashtag-list"
import type { SearchResult } from "@/app/actions/explore-actions"

interface InfiniteScrollResultsProps {
  initialResults: SearchResult[]
  query: string
  type?: "user" | "shout" | "hashtag"
  currentUserId: number
}

export function InfiniteScrollResults({ initialResults, query, type, currentUserId }: InfiniteScrollResultsProps) {
  const fetchMoreResults = async (offset: number) => {
    return await search(query, 10, offset, type as any)
  }

  const { data, isLoading, hasMore, error, loadMoreRef } = useInfiniteScroll<SearchResult>({
    initialData: initialResults,
    fetchMore: fetchMoreResults,
    hasMoreInitial: initialResults.length >= 10, // Assume there might be more if we got a full page
  })

  // Filter results by type if needed
  const filteredData = type ? data.filter((result) => result.type === type) : data

  // Separate data by type
  const users = filteredData.filter((result) => result.type === "user")
  const shouts = filteredData.filter((result) => result.type === "shout")
  const hashtags = filteredData.filter((result) => result.type === "hashtag")

  if (filteredData.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No results found for "{query}"</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {type === "user" || !type
        ? users.length > 0 && (
            <div>
              {!type && <h2 className="text-xl font-bold mb-4">People</h2>}
              <UserList users={users} currentUserId={currentUserId} />
            </div>
          )
        : null}

      {type === "hashtag" || !type
        ? hashtags.length > 0 && (
            <div>
              {!type && <h2 className="text-xl font-bold mb-4">Hashtags</h2>}
              <HashtagList hashtags={hashtags} />
            </div>
          )
        : null}

      {type === "shout" || !type
        ? shouts.length > 0 && (
            <div>
              {!type && <h2 className="text-xl font-bold mb-4">Shouts</h2>}
              <ShoutList initialShouts={shouts} userId={currentUserId} />
            </div>
          )
        : null}

      {/* Loading indicator and error message */}
      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-700 mr-2" />
            <span>Loading more results...</span>
          </div>
        )}
        {error && (
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                const offset = filteredData.length
                fetchMoreResults(offset)
              }}
            >
              Try Again
            </Button>
          </div>
        )}
        {!hasMore && filteredData.length > 0 && <p className="text-muted-foreground">No more results to load</p>}
      </div>
    </div>
  )
}
