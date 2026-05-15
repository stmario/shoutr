"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton } from "@/components/follow-button"
import type { FollowListUser } from "@/app/actions/profile"

interface FollowUserRowProps {
  user: FollowListUser
  currentUserId?: number
}

export function FollowUserRow({ user, currentUserId }: FollowUserRowProps) {
  const isSelf = currentUserId === user.id

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
      <Link href={`/profile/${user.username}`}>
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar_url || "/placeholder.svg?height=48&width=48"} alt={user.username} />
          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.username}`} className="hover:underline">
          <div className="font-medium truncate">{user.username}</div>
        </Link>
        {user.bio && <p className="text-sm text-muted-foreground truncate">{user.bio}</p>}
      </div>
      {!isSelf && (
        <FollowButton profileUserId={user.id} initialIsFollowing={user.is_following} size="sm" />
      )}
    </div>
  )
}
