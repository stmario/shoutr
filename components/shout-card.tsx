"use client"

import { useState, useEffect } from "react"
import { ArrowUp, ArrowDown, MessageCircle, Repeat2, Bookmark } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { reshout } from "@/app/actions/shouts"
import { voteOnShout, getUserVote } from "@/app/actions/vote-actions"
import { addBookmark, removeBookmark, isBookmarked } from "@/app/actions/bookmark-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { voteOnPost, getVoteCount, getUserVote as getBlockchainUserVote } from "@/lib/contract"

interface ShoutCardProps {
  shout: {
    id: number
    content: string
    created_at: string
    image_url?: string
    user_id: number
    username: string
    display_name: string
    avatar_url?: string
    vote_count: number
    comments_count: number
    reshouts_count: number
  }
  currentUserId?: number
  currentUserWallet?: string
  isReshouted?: boolean
  isBookmarked?: boolean
}

export function ShoutCard({
  shout,
  currentUserId,
  currentUserWallet,
  isReshouted = false,
  isBookmarked: initialIsBookmarked = false,
}: ShoutCardProps) {
  const [voteCount, setVoteCount] = useState(Number(shout.vote_count) || 0)
  const [commentCount, setCommentCount] = useState(Number(shout.comments_count) || 0)
  const [reshoutCount, setReshoutCount] = useState(Number(shout.reshouts_count) || 0)
  const [userVote, setUserVote] = useState<number>(0) // 0 for no vote, 1 for upvote, -1 for downvote
  const [reshouted, setReshouted] = useState(isReshouted)
  const [bookmarked, setBookmarked] = useState(initialIsBookmarked)
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false)
  const [isVoteLoading, setIsVoteLoading] = useState(false)
  const { toast } = useToast()

  // Check bookmark and vote status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (currentUserId) {
        // Check bookmark status
        if (initialIsBookmarked === false) {
          const bookmarkStatus = await isBookmarked(shout.id)
          setBookmarked(bookmarkStatus)
        }

        // Check vote status from database
        const voteStatus = await getUserVote(shout.id)
        setUserVote(voteStatus)

        // If wallet is connected, check blockchain vote status
        if (currentUserWallet) {
          try {
            // Get vote count from blockchain
            const blockchainVoteCount = await getVoteCount(shout.id.toString())
            if (blockchainVoteCount !== voteCount) {
              setVoteCount(blockchainVoteCount)
            }

            // Get user vote from blockchain
            const blockchainUserVote = await getBlockchainUserVote(shout.id.toString(), currentUserWallet)
            if (blockchainUserVote !== 0 && blockchainUserVote !== voteStatus) {
              setUserVote(blockchainUserVote)
            }
          } catch (error) {
            console.error("Error fetching blockchain data:", error)
          }
        }
      }
    }

    checkStatus()
  }, [shout.id, currentUserId, currentUserWallet, initialIsBookmarked, voteCount])

  const formattedDate = formatDistanceToNow(new Date(shout.created_at), { addSuffix: true })

  const handleVote = async (voteType: 1 | -1) => {
    if (!currentUserId || isVoteLoading) return

    setIsVoteLoading(true)
    try {
      // If user clicked the same vote type they already selected, treat as removing vote
      const newVoteType = userVote === voteType ? 0 : voteType

      // Update UI optimistically
      if (newVoteType === 0) {
        // Removing vote
        setVoteCount((prev) => prev - voteType)
        setUserVote(0)
      } else if (userVote === 0) {
        // New vote
        setVoteCount((prev) => prev + voteType)
        setUserVote(voteType)
      } else {
        // Changing vote
        setVoteCount((prev) => prev - userVote + voteType)
        setUserVote(voteType)
      }

      // Submit to database
      const result = await voteOnShout(shout.id, voteType)

      if (!result.success) {
        // Revert UI changes if database update fails
        toast({
          title: "Error",
          description: result.message || "Failed to vote",
          variant: "destructive",
        })
        // Reset to previous state
        setUserVote(userVote)
        setVoteCount(voteCount)
        return
      }

      // If wallet is connected, submit to blockchain
      if (currentUserWallet) {
        try {
          const blockchainResult = await voteOnPost(shout.id.toString(), voteType === 1, currentUserWallet)

          if (!blockchainResult.success) {
            toast({
              title: "Blockchain Error",
              description: "Vote recorded in database but blockchain update failed",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Blockchain vote error:", error)
          toast({
            title: "Blockchain Error",
            description: "Vote recorded in database but blockchain update failed",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsVoteLoading(false)
    }
  }

  const handleReshout = async () => {
    if (!currentUserId) return

    try {
      await reshout(currentUserId, shout.id)
      if (!reshouted) {
        setReshoutCount((prev) => prev + 1)
      }
      setReshouted(true)
    } catch (error) {
      console.error("Error reshouting:", error)
    }
  }

  const handleBookmark = async () => {
    if (!currentUserId || isBookmarkLoading) return

    setIsBookmarkLoading(true)
    try {
      if (bookmarked) {
        const result = await removeBookmark(shout.id)
        if (result.success) {
          setBookmarked(false)
          toast({
            title: "Bookmark removed",
            description: "Shout removed from your bookmarks",
          })
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to remove bookmark",
            variant: "destructive",
          })
        }
      } else {
        const result = await addBookmark(shout.id)
        if (result.success) {
          setBookmarked(true)
          toast({
            title: "Bookmarked",
            description: "Shout added to your bookmarks",
          })
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to bookmark shout",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsBookmarkLoading(false)
    }
  }

  return (
    <Card className="border-b border-x-0 rounded-none first:border-t-0 last:border-b-0 md:border md:rounded-lg">
      <CardHeader className="p-4 pb-0 flex flex-row gap-3">
        <Link href={`/profile/${shout.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={shout.avatar_url || "/placeholder.svg?height=40&width=40"} alt={shout.display_name} />
            <AvatarFallback>{shout.display_name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <Link href={`/profile/${shout.username}`} className="font-semibold hover:underline">
              {shout.display_name}
            </Link>
            <Link href={`/profile/${shout.username}`} className="text-muted-foreground text-sm hover:underline">
              @{shout.username}
            </Link>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">{formattedDate}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pl-[4.5rem]">
        <p className="whitespace-pre-wrap">
          {shout.content.split(/(#\w+)/).map((part, index) => {
            if (part.startsWith("#")) {
              return (
                <Link key={index} href={`/hashtag/${part.substring(1)}`} className="text-purple-700 hover:underline">
                  {part}
                </Link>
              )
            }
            return part
          })}
        </p>
        {shout.image_url && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border">
            <div className="relative aspect-video max-h-96 w-full">
              <Image src={shout.image_url || "/placeholder.svg"} alt="Shout image" fill className="object-contain" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 pl-[4.5rem] flex justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`${
              userVote === 1 ? "text-green-500" : "text-muted-foreground"
            } hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950`}
            onClick={() => handleVote(1)}
            disabled={!currentUserId || isVoteLoading}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span
            className={`text-sm font-medium ${voteCount > 0 ? "text-green-500" : voteCount < 0 ? "text-red-500" : ""}`}
          >
            {voteCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className={`${
              userVote === -1 ? "text-red-500" : "text-muted-foreground"
            } hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950`}
            onClick={() => handleVote(-1)}
            disabled={!currentUserId || isVoteLoading}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          <span className="text-xs">{commentCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`${
            reshouted ? "text-green-500" : "text-muted-foreground"
          } hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950`}
          onClick={handleReshout}
          disabled={!currentUserId || reshouted}
        >
          <Repeat2 className="mr-1 h-4 w-4" />
          <span className="text-xs">{reshoutCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`${
            bookmarked ? "text-purple-700" : "text-muted-foreground"
          } hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950`}
          onClick={handleBookmark}
          disabled={!currentUserId || isBookmarkLoading}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-purple-700" : ""}`} />
        </Button>
      </CardFooter>
    </Card>
  )
}
