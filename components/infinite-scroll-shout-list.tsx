"use client"

import { useCallback } from "react"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { ShoutCard } from "@/components/shout-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getShoutsByHashtag } from "@/app/actions/explore-actions"

const PAGE_SIZE = 10

interface InfiniteScrollShoutListProps {
  initialShouts: any[]
  userId?: number
  hashtagName: string
}

export function InfiniteScrollShoutList({
  initialShouts,
  userId,
  hashtagName,
}: InfiniteScrollShoutListProps) {
  const fetchMore = useCallback(
    (offset: number) => getShoutsByHashtag(hashtagName, PAGE_SIZE, offset),
    [hashtagName],
  )

  const { data, isLoading, hasMore, error, loadMoreRef } = useInfiniteScroll<any>({
    initialData: initialShouts,
    fetchMore,
    hasMoreInitial: initialShouts.length >= PAGE_SIZE,
  })

  if (data.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No shouts to display.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((shout) => (
        <ShoutCard key={shout.id} shout={shout} currentUserId={userId} />
      ))}

      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-700 mr-2" />
            <span>Loading more shouts...</span>
          </div>
        )}
        {error && (
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <Button variant="outline" onClick={() => fetchMore(data.length)}>
              Try Again
            </Button>
          </div>
        )}
        {!hasMore && data.length > 0 && <p className="text-muted-foreground">No more shouts to load</p>}
      </div>
    </div>
  )
}
