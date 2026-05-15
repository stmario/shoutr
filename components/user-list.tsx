"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { followUser } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import type { SearchResult } from "@/app/actions/explore-actions"

interface UserListProps {
  users: SearchResult[]
  currentUserId: number
}

export function UserList({ users, currentUserId }: UserListProps) {
  const [followingState, setFollowingState] = useState<Record<number, boolean>>({})
  const [loadingState, setLoadingState] = useState<Record<number, boolean>>({})
  const { toast } = useToast()

  const handleFollow = async (userId: number) => {
    if (loadingState[userId]) return

    setLoadingState((prev) => ({ ...prev, [userId]: true }))
    try {
      await followUser(currentUserId, userId)
      setFollowingState((prev) => ({ ...prev, [userId]: true }))
      toast({
        title: "Success",
        description: "You are now following this user.",
      })
    } catch (error) {
      console.error("Error following user:", error)
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingState((prev) => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="p-4">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.username}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url || "/placeholder.svg?height=48&width=48"} alt={user.username ?? ""} />
                <AvatarFallback>{user.username?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.username}`} className="hover:underline">
                <div className="font-medium">{user.username}</div>
              </Link>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
            <Button
              size="sm"
              className={followingState[user.id] ? "" : "bg-purple-700 hover:bg-purple-800"}
              variant={followingState[user.id] ? "outline" : "default"}
              onClick={() => handleFollow(user.id)}
              disabled={loadingState[user.id] || followingState[user.id]}
            >
              {followingState[user.id] ? "Following" : "Follow"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
