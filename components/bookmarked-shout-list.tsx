"use client"

import { useCallback, useState } from "react"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { ShoutCard } from "@/components/shout-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getBookmarkedShouts, type BookmarkedShout } from "@/app/actions/bookmark-actions"

const PAGE_SIZE = 10

interface BookmarkedShoutListProps {
  initialShouts: BookmarkedShout[]
  userId: number
}

export function BookmarkedShoutList({ initialShouts, userId }: BookmarkedShoutListProps) {
  const [removedIds, setRemovedIds] = useState<Set<number>>(() => new Set())

  const fetchMore = useCallback(
    (offset: number) => getBookmarkedShouts(PAGE_SIZE, offset),
    [],
  )

  const handleBookmarkChange = useCallback((shoutId: number, bookmarked: boolean) => {
    if (!bookmarked) {
      setRemovedIds((prev) => new Set(prev).add(shoutId))
    }
  }, [])

  const { data, isLoading, hasMore, error, loadMoreRef } = useInfiniteScroll<BookmarkedShout>({
    initialData: initialShouts,
    fetchMore,
    hasMoreInitial: initialShouts.length >= PAGE_SIZE,
  })

  const visible = data.filter((shout) => !removedIds.has(shout.id))

  if (visible.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No bookmarked shouts to show.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visible.map((shout) => (
        <ShoutCard
          key={shout.id}
          shout={shout}
          currentUserId={userId}
          isBookmarked
          onBookmarkChange={(bookmarked) => handleBookmarkChange(shout.id, bookmarked)}
        />
      ))}

      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-700 mr-2" />
            <span>Loading more…</span>
          </div>
        )}
        {error && (
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <Button variant="outline" onClick={() => fetchMore(data.length)}>
              Try again
            </Button>
          </div>
        )}
        {!hasMore && visible.length > 0 && (
          <p className="text-muted-foreground">No more bookmarks</p>
        )}
      </div>
    </div>
  )
}
