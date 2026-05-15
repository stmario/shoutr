"use client"

import { FollowUserRow } from "@/components/follow-user-row"
import type { FollowListUser } from "@/app/actions/profile"

interface FollowListProps {
  users: FollowListUser[]
  currentUserId?: number
  emptyMessage: string
}

export function FollowList({ users, currentUserId, emptyMessage }: FollowListProps) {
  if (users.length === 0) {
    return <p className="text-center text-muted-foreground py-10">{emptyMessage}</p>
  }

  return (
    <div>
      {users.map((user) => (
        <FollowUserRow key={user.id} user={user} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
