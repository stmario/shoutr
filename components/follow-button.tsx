"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"

interface FollowButtonProps {
  currentUserId: number
  profileUserId: number
  initialIsFollowing: boolean
}

export function FollowButton({ currentUserId, profileUserId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggleFollow = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, profileUserId)
        setIsFollowing(false)
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        })
      } else {
        await followUser(currentUserId, profileUserId)
        setIsFollowing(true)
        toast({
          title: "Following",
          description: "You are now following this user.",
        })
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      className={isFollowing ? "" : "bg-purple-700 hover:bg-purple-800"}
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  )
}
