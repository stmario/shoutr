"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoutCard } from "@/components/shout-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getUserLikedShouts, getUserShouts } from "@/app/actions/profile"
import { getShouts, type Shout } from "@/app/actions/shouts"
import { timelineLoadMoreClass } from "@/lib/timeline-styles"

interface ShoutListProps {
  initialShouts?: Shout[]
  userId?: number
  profileId?: number
  /** Profile owner's liked shouts (Likes tab). */
  likedProfileId?: number
  emptyMessage?: string
  /** Increment to refetch the first page (e.g. after posting a shout). */
  refreshKey?: number
  variant?: "card" | "timeline"
}

function mergeUniqueShouts(existing: Shout[], incoming: Shout[]) {
  const seen = new Set(existing.map((s) => s.id))
  const unique = incoming.filter((s) => !seen.has(s.id))
  return [...existing, ...unique]
}

export function ShoutList({
  initialShouts = [],
  userId,
  profileId,
  likedProfileId,
  emptyMessage,
  refreshKey = 0,
  variant = "card",
}: ShoutListProps) {
  const [shouts, setShouts] = useState(initialShouts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(initialShouts.length)

  const fetchPage = useCallback(
    async (pageOffset: number, limit = 10) => {
      if (likedProfileId) {
        return getUserLikedShouts(likedProfileId, limit, pageOffset)
      }
      if (profileId) {
        return getUserShouts(profileId, limit, pageOffset)
      }
      return getShouts(limit, pageOffset)
    },
    [profileId, likedProfileId],
  )

  const refreshFeed = useCallback(async () => {
    setLoading(true)
    try {
      const latest = await fetchPage(0)
      setShouts(latest)
      setOffset(latest.length)
      setHasMore(latest.length >= 10)
    } catch (error) {
      console.error("Error refreshing shouts:", error)
    } finally {
      setLoading(false)
    }
  }, [fetchPage])

  const loadMoreShouts = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newShouts = await fetchPage(offset)

      if (newShouts.length === 0) {
        setHasMore(false)
      } else {
        setShouts((prev) => mergeUniqueShouts(prev, newShouts))
        setOffset((prev) => prev + newShouts.length)
      }
    } catch (error) {
      console.error("Error loading shouts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialShouts.length > 0 && refreshKey === 0) {
      return
    }
    refreshFeed()
  }, [refreshKey, refreshFeed, initialShouts.length])

  if (shouts.length === 0 && !loading) {
    return (
      <div className={variant === "timeline" ? "px-4 py-10 text-center" : "py-10 text-center"}>
        <p className="text-muted-foreground">
          {emptyMessage ?? (likedProfileId ? "No liked shouts yet." : "No shouts to display.")}
        </p>
        {!profileId && !likedProfileId && (
          <p className="text-muted-foreground">Follow users or create your first shout!</p>
        )}
      </div>
    )
  }

  const listContent = shouts.map((shout) => (
    <ShoutCard
      key={shout.id}
      variant={variant}
      shout={shout}
      currentUserId={userId}
      onDeleted={() => setShouts((prev) => prev.filter((s) => s.id !== shout.id))}
    />
  ))

  const loadMore = hasMore ? (
    <div className={variant === "timeline" ? timelineLoadMoreClass : "flex justify-center py-4"}>
      <Button variant="outline" onClick={loadMoreShouts} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Load More"
        )}
      </Button>
    </div>
  ) : null

  if (variant === "timeline") {
    return (
      <>
        {listContent}
        {loadMore}
      </>
    )
  }

  return (
    <div className="space-y-4">
      {listContent}
      {loadMore}
    </div>
  )
}
