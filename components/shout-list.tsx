"use client"

import { useEffect, useState } from "react"
import { ShoutCard } from "@/components/shout-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getUserShouts } from "@/app/actions/profile"
import { getShouts } from "@/app/actions/shouts"

interface ShoutListProps {
  initialShouts?: any[]
  userId?: number
  profileId?: number
}

export function ShoutList({ initialShouts = [], userId, profileId }: ShoutListProps) {
  const [shouts, setShouts] = useState(initialShouts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(initialShouts.length)

  const loadMoreShouts = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      let newShouts

      if (profileId) {
        // If profileId is provided, fetch shouts for that profile
        newShouts = await getUserShouts(profileId, 10, offset)
      } else {
        // Otherwise fetch the feed shouts
        newShouts = await getShouts(10, offset)
      }

      if (newShouts.length === 0) {
        setHasMore(false)
      } else {
        setShouts((prev) => [...prev, ...newShouts])
        setOffset((prev) => prev + newShouts.length)
      }
    } catch (error) {
      console.error("Error loading shouts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialShouts.length === 0) {
      loadMoreShouts()
    }
  }, [])

  if (shouts.length === 0 && !loading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No shouts to display.</p>
        {!profileId && <p className="text-muted-foreground">Follow users or create your first shout!</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {shouts.map((shout) => (
        <ShoutCard key={shout.id} shout={shout} currentUserId={userId} />
      ))}

      {hasMore && (
        <div className="flex justify-center py-4">
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
      )}
    </div>
  )
}
