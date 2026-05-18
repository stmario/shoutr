"use client"

import { useCallback, useEffect, useState } from "react"
import { ShoutCard } from "@/components/shout-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getUserReshouts } from "@/app/actions/profile"
import type { ReshoutedBy } from "@/app/actions/shouts"

type ReshoutRow = {
  id: number
  content: string
  created_at: string
  image_url: string | null
  user_id: number
  username: string
  avatar_url: string | null
  wallet_address: string | null
  vote_count: string | number
  comments_count: number
  reshouts_count: number
  reshouted_at: string
}

interface ProfileReshoutListProps {
  profileId: number
  profileUsername: string
  profileAvatarUrl?: string | null
  currentUserId?: number
}

export function ProfileReshoutList({
  profileId,
  profileUsername,
  profileAvatarUrl,
  currentUserId,
}: ProfileReshoutListProps) {
  const [rows, setRows] = useState<ReshoutRow[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchPage = useCallback(
    async (pageOffset: number) => {
      return (await getUserReshouts(profileId, 10, pageOffset, currentUserId)) as ReshoutRow[]
    },
    [profileId, currentUserId],
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const page = await fetchPage(0)
        setRows(page)
        setOffset(page.length)
        setHasMore(page.length >= 10)
      } catch (error) {
        console.error("Error loading reshouts:", error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [fetchPage])

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const page = await fetchPage(offset)
      if (page.length === 0) {
        setHasMore(false)
      } else {
        setRows((prev) => [...prev, ...page])
        setOffset((prev) => prev + page.length)
        if (page.length < 10) setHasMore(false)
      }
    } finally {
      setLoading(false)
    }
  }

  if (rows.length === 0 && !loading) {
    return <p className="text-center text-muted-foreground py-10">No reshouts yet.</p>
  }

  const reshoutedBy: ReshoutedBy = {
    id: profileId,
    username: profileUsername,
    avatar_url: profileAvatarUrl ?? null,
    created_at: "",
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <ShoutCard
          key={`${row.id}-${row.reshouted_at}`}
          shout={{
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            image_url: row.image_url ?? undefined,
            user_id: row.user_id,
            username: row.username,
            avatar_url: row.avatar_url ?? undefined,
            wallet_address: row.wallet_address,
            vote_count: row.vote_count,
            comments_count: Number(row.comments_count) || 0,
            reshouts_count: Number(row.reshouts_count) || 0,
          }}
          currentUserId={currentUserId}
          reshoutedBy={{ ...reshoutedBy, created_at: row.reshouted_at }}
          onDeleted={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
        />
      ))}
      {hasMore && (
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
