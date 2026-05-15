"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  profileUserId: number
  initialIsFollowing: boolean
  size?: "default" | "sm"
}

export function FollowButton({ profileUserId, initialIsFollowing, size = "default" }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleToggleFollow = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const result = isFollowing ? await unfollowUser(profileUserId) : await followUser(profileUserId)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      const nowFollowing = !isFollowing
      setIsFollowing(nowFollowing)
      toast({
        title: nowFollowing ? "Following" : "Unfollowed",
        description: nowFollowing
          ? "You are now following this user."
          : "You are no longer following this user.",
      })
      router.refresh()
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
      size={size}
      variant={isFollowing ? "outline" : "default"}
      className={isFollowing ? "" : "bg-purple-700 hover:bg-purple-800"}
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
    </Button>
  )
}
