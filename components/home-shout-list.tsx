"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoutCard } from "@/components/shout-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getHomeFeed, type FeedItem, type Shout } from "@/app/actions/shouts"

interface HomeShoutListProps {
  userId: number
  refreshKey?: number
}

const PAGE_SIZE = 10

function feedItemKey(item: FeedItem) {
  return item.item_type === "reshout"
    ? `r-${item.reshouted_by?.id}-${item.shout.id}-${item.sort_at}`
    : `s-${item.shout.id}`
}

function mergeUniqueFeedItems(existing: FeedItem[], incoming: FeedItem[]) {
  const seen = new Set(existing.map(feedItemKey))
  const unique = incoming.filter((item) => !seen.has(feedItemKey(item)))
  return [...existing, ...unique]
}

function mergeUniqueShouts(existing: Shout[], incoming: Shout[]) {
  const seen = new Set(existing.map((s) => s.id))
  const unique = incoming.filter((s) => !seen.has(s.id))
  return [...existing, ...unique]
}

export function HomeShoutList({ userId, refreshKey = 0 }: HomeShoutListProps) {
  const [following, setFollowing] = useState<FeedItem[]>([])
  const [discover, setDiscover] = useState<Shout[]>([])
  const [followingOffset, setFollowingOffset] = useState(0)
  const [discoverOffset, setDiscoverOffset] = useState(0)
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true)
  const [hasMoreDiscover, setHasMoreDiscover] = useState(true)
  const [loading, setLoading] = useState(false)

  const refreshFeed = useCallback(async () => {
    setLoading(true)
    try {
      const page = await getHomeFeed(PAGE_SIZE, 0, PAGE_SIZE, 0)
      setFollowing(page.following)
      setDiscover(page.discover)
      setFollowingOffset(page.following.length)
      setDiscoverOffset(page.discover.length)
      setHasMoreFollowing(page.following.length >= PAGE_SIZE)
      setHasMoreDiscover(page.discover.length >= PAGE_SIZE)
    } catch (error) {
      console.error("Error refreshing home feed:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshFeed()
  }, [refreshKey, refreshFeed])

  const loadMore = async () => {
    if (loading || (!hasMoreFollowing && !hasMoreDiscover)) return

    setLoading(true)
    try {
      const page = await getHomeFeed(
        hasMoreFollowing ? PAGE_SIZE : 0,
        hasMoreFollowing ? followingOffset : 0,
        hasMoreDiscover ? PAGE_SIZE : 0,
        hasMoreDiscover ? discoverOffset : 0,
      )

      if (hasMoreFollowing) {
        if (page.following.length === 0) {
          setHasMoreFollowing(false)
        } else {
          setFollowing((prev) => mergeUniqueFeedItems(prev, page.following))
          setFollowingOffset((prev) => prev + page.following.length)
          if (page.following.length < PAGE_SIZE) {
            setHasMoreFollowing(false)
          }
        }
      }

      if (hasMoreDiscover) {
        if (page.discover.length === 0) {
          setHasMoreDiscover(false)
        } else {
          setDiscover((prev) => mergeUniqueShouts(prev, page.discover))
          setDiscoverOffset((prev) => prev + page.discover.length)
          if (page.discover.length < PAGE_SIZE) {
            setHasMoreDiscover(false)
          }
        }
      }
    } catch (error) {
      console.error("Error loading more home feed:", error)
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = following.length === 0 && discover.length === 0 && !loading

  if (isEmpty) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-muted-foreground">No shouts to display.</p>
        <p className="text-muted-foreground">Follow users or create your first shout!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-4">
      {following.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            From people you follow
          </h2>
          {following.map((item) => (
            <ShoutCard
              key={feedItemKey(item)}
              shout={item.shout}
              currentUserId={userId}
              reshoutedBy={item.reshouted_by}
              onDeleted={() =>
                setFollowing((prev) => prev.filter((f) => f.shout.id !== item.shout.id))
              }
            />
          ))}
        </section>
      )}

      {discover.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Popular from others
          </h2>
          {discover.map((shout) => (
            <ShoutCard
              key={`d-${shout.id}`}
              shout={shout}
              currentUserId={userId}
              onDeleted={() => setDiscover((prev) => prev.filter((s) => s.id !== shout.id))}
            />
          ))}
        </section>
      )}

      {(hasMoreFollowing || hasMoreDiscover) && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
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
      )}
    </div>
  )
}
