"use client"

import { useState } from "react"
import { ComposeShout } from "@/components/compose-shout"
import { ShoutList } from "@/components/shout-list"

interface HomeFeedProps {
  userId: number
  username: string
  avatarUrl?: string | null
}

export function HomeFeed({ userId, username, avatarUrl }: HomeFeedProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <div className="border-b p-4">
        <ComposeShout
          username={username}
          avatarUrl={avatarUrl}
          onShoutCreated={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <ShoutList userId={userId} refreshKey={refreshKey} />
    </>
  )
}
