"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { followUser } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { UsernameDisplay } from "@/components/username-display"

interface SuggestedUsersProps {
  users?: {
    id: number
    username: string
    avatar_url: string | null
    is_verified?: boolean
    followers_count: number
  }[]
  currentUserId?: number
}

export function SuggestedUsers({ users = [], currentUserId = 0 }: SuggestedUsersProps) {
  const [followingState, setFollowingState] = useState<Record<number, boolean>>({})
  const [loadingState, setLoadingState] = useState<Record<number, boolean>>({})
  const { toast } = useToast()

  if (users.length === 0) {
    return null
  }

  const handleFollow = async (userId: number) => {
    if (loadingState[userId]) return

    setLoadingState((prev) => ({ ...prev, [userId]: true }))
    try {
      const result = await followUser(userId)
      if (result.error) {
        throw new Error(result.error)
      }
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
    <Card>
      <CardHeader>
        <CardTitle>Who to follow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link href={`/profile/${user.username}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || "/placeholder.svg?height=40&width=40"} alt={user.username} />
                <AvatarFallback>
                  {(user.username?.trim() || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <UsernameDisplay
                username={user.username}
                verified={user.is_verified === true}
                nameClassName="font-medium"
              />
            </div>
            <Button
              size="sm"
              className={followingState[user.id] ? "" : "bg-purple-700 hover:bg-purple-800"}
              variant={followingState[user.id] ? "outline" : "default"}
              onClick={() => handleFollow(user.id)}
              disabled={currentUserId <= 0 || loadingState[user.id] || followingState[user.id]}
            >
              {followingState[user.id] ? "Following" : "Follow"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
