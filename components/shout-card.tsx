"use client"

import { useState, useEffect } from "react"
import { Heart, MessageCircle, Repeat2, Bookmark, Repeat, MoreHorizontal, Trash2, Link2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteShoutDialog } from "@/components/delete-shout-dialog"
import { getShoutModerationDeleteEligibility } from "@/app/actions/shout-delete-actions"
import { ClientTime } from "@/components/client-time"
import { toggleReshout, getShoutReshoutStatus } from "@/app/actions/reshout-actions"
import type { ReshoutedBy } from "@/app/actions/shouts"
import { toggleLikeShout, getShoutLikeStatus, getUserStakedLikePower } from "@/app/actions/vote-actions"
import { addBookmark, removeBookmark, isBookmarked } from "@/app/actions/bookmark-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ShoutContent } from "@/components/shout-content"
import { ShoutEmbeddedImage } from "@/components/shout-embedded-image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatLikeWeightShot, LIKE_CURRENCY } from "@/lib/like-weight"
import { UsernameDisplay } from "@/components/username-display"
import { timelineRowClass } from "@/lib/timeline-styles"
import { cn } from "@/lib/utils"

interface ShoutCardProps {
  shout: {
    id: number
    content: string
    created_at: string
    image_url?: string
    user_id: number
    username: string
    avatar_url?: string
    wallet_address?: string | null
    author_is_verified?: boolean
    vote_count: number | string
    comments_count: number
    reshouts_count: number
  }
  currentUserId?: number
  currentUserWallet?: string
  isReshouted?: boolean
  isBookmarked?: boolean
  reshoutedBy?: ReshoutedBy
  onBookmarkChange?: (bookmarked: boolean) => void
  onDeleted?: () => void
  /** Full-width rows with shared dividers (home feed). */
  variant?: "card" | "timeline"
}

export function ShoutCard({
  shout,
  currentUserId,
  currentUserWallet: _currentUserWallet,
  isReshouted = false,
  isBookmarked: initialIsBookmarked = false,
  reshoutedBy,
  onBookmarkChange,
  onDeleted,
  variant = "card",
}: ShoutCardProps) {
  const initialTotal = shout.vote_count?.toString() ?? "0"
  const [likeTotalWei, setLikeTotalWei] = useState(initialTotal)
  const [liked, setLiked] = useState(false)
  const [userLikeWeightWei, setUserLikeWeightWei] = useState("0")
  const [stakedLikePower, setStakedLikePower] = useState<string | null>(null)
  const [commentCount, setCommentCount] = useState(Number(shout.comments_count) || 0)
  const [reshoutCount, setReshoutCount] = useState(Number(shout.reshouts_count) || 0)
  const [reshouted, setReshouted] = useState(isReshouted)
  const [bookmarked, setBookmarked] = useState(initialIsBookmarked)
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isReshoutLoading, setIsReshoutLoading] = useState(false)
  const [canModerateDelete, setCanModerateDelete] = useState(false)
  const [moderationCheckLoading, setModerationCheckLoading] = useState(false)
  const [moderationMessage, setModerationMessage] = useState<string | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  const isOwnShout = Boolean(currentUserId) && currentUserId === shout.user_id
  const showModerationMenu = Boolean(currentUserId) && !isOwnShout
  const showDeleteInMenu = Boolean(currentUserId) && (isOwnShout || showModerationMenu)

  useEffect(() => {
    const checkStatus = async () => {
      if (!currentUserId) return

      if (initialIsBookmarked === false) {
        const bookmarkStatus = await isBookmarked(shout.id)
        setBookmarked(bookmarkStatus)
      }

      const likeStatus = await getShoutLikeStatus(shout.id)
      setLiked(likeStatus.liked)
      setUserLikeWeightWei(likeStatus.userWeightWei)
      setLikeTotalWei(likeStatus.totalWeightWei)

      const power = await getUserStakedLikePower()
      if (power.success && power.formatted !== undefined) {
        setStakedLikePower(power.formatted)
      }

      const reshoutStatus = await getShoutReshoutStatus(shout.id)
      setReshouted(reshoutStatus.reshouted)
      setReshoutCount(reshoutStatus.count)
    }

    void checkStatus()
  }, [shout.id, currentUserId, initialIsBookmarked])

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/shout/${shout.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied",
        description: "Shout link copied to clipboard.",
      })
    } catch {
      toast({
        title: "Could not copy",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      })
    }
  }

  const handleModerationMenuOpenChange = (open: boolean) => {
    if (!open || !showModerationMenu) return

    void (async () => {
      setModerationCheckLoading(true)
      setCanModerateDelete(false)
      setModerationMessage(undefined)

      try {
        const deleteEligibility = await getShoutModerationDeleteEligibility(shout.id, {
          authorWalletAddress: shout.wallet_address,
        })
        setCanModerateDelete(deleteEligibility.canDelete)
        setModerationMessage(deleteEligibility.message)
      } catch (error) {
        console.error("Moderation eligibility check failed:", error)
        setModerationMessage("Could not verify staked SHOT")
      } finally {
        setModerationCheckLoading(false)
      }
    })()
  }

  const likeDisplay = formatLikeWeightShot(likeTotalWei)

  const handleLike = async () => {
    if (!currentUserId || isLikeLoading) return

    setIsLikeLoading(true)
    const prevLiked = liked
    const prevTotal = likeTotalWei
    const prevUserWeight = userLikeWeightWei

    try {
      const result = await toggleLikeShout(shout.id)

      if (!result.success) {
        toast({
          title: "Cannot like",
          description: result.message || "Failed to like",
          variant: "destructive",
        })
        return
      }

      setLiked(result.liked ?? false)
      if (result.totalWeightWei !== undefined) setLikeTotalWei(result.totalWeightWei)
      if (result.userWeightWei !== undefined) setUserLikeWeightWei(result.userWeightWei)

      if (result.liked && result.message) {
        toast({ title: "Liked", description: result.message })
      }
    } catch (error) {
      console.error("Error liking:", error)
      setLiked(prevLiked)
      setLikeTotalWei(prevTotal)
      setUserLikeWeightWei(prevUserWeight)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleReshout = async () => {
    if (!currentUserId || isReshoutLoading) return

    setIsReshoutLoading(true)
    const prevReshouted = reshouted
    const prevCount = reshoutCount

    try {
      const result = await toggleReshout(shout.id)

      if (!result.success) {
        toast({
          title: "Cannot reshout",
          description: result.message || "Failed to reshout",
          variant: "destructive",
        })
        return
      }

      setReshouted(result.reshouted ?? false)
      if (result.count !== undefined) {
        setReshoutCount(result.count)
      }
    } catch (error) {
      console.error("Error reshouting:", error)
      setReshouted(prevReshouted)
      setReshoutCount(prevCount)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsReshoutLoading(false)
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
          onBookmarkChange?.(false)
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
          onBookmarkChange?.(true)
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
    <Card
      className={cn(
        variant === "timeline"
          ? timelineRowClass
          : "border-b border-x-0 rounded-none first:border-t-0 last:border-b-0 md:border md:rounded-lg",
      )}
    >
      {reshoutedBy && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
          <Repeat className="h-4 w-4 shrink-0 text-green-600" />
          <Link href={`/profile/${reshoutedBy.username}`} className="font-medium hover:underline text-foreground">
            @{reshoutedBy.username}
          </Link>
          <span>reshouted</span>
          <span>·</span>
          <ClientTime value={reshoutedBy.created_at} />
        </div>
      )}
      <CardHeader className={`p-4 pb-0 flex flex-row gap-3 items-start ${reshoutedBy ? "pt-2" : ""}`}>
        <Link href={`/profile/${shout.username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={shout.avatar_url || "/placeholder.svg?height=40&width=40"} alt={shout.username} />
            <AvatarFallback>{shout.username.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {shout.wallet_address ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <UsernameDisplay
                    username={shout.username}
                    verified={shout.author_is_verified}
                    nameClassName="font-semibold"
                  />
                </TooltipTrigger>
                <TooltipContent className="font-mono text-xs max-w-xs break-all">
                  {shout.wallet_address}
                </TooltipContent>
              </Tooltip>
            ) : (
              <UsernameDisplay
                username={shout.username}
                verified={shout.author_is_verified}
                nameClassName="font-semibold"
              />
            )}
            <span className="text-muted-foreground text-sm">·</span>
            <ClientTime value={shout.created_at} className="text-muted-foreground text-sm" />
          </div>
        </div>
        <DropdownMenu
          onOpenChange={showDeleteInMenu && !isOwnShout ? handleModerationMenuOpenChange : undefined}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Shout actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-xs">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                void handleCopyLink()
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            {showDeleteInMenu ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={!isOwnShout && (moderationCheckLoading || !canModerateDelete)}
                  onSelect={(event) => {
                    if (!isOwnShout && (moderationCheckLoading || !canModerateDelete)) {
                      event.preventDefault()
                      return
                    }
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isOwnShout
                    ? "Delete shout"
                    : moderationCheckLoading
                      ? "Checking stake…"
                      : "Delete shout"}
                </DropdownMenuItem>
                {!isOwnShout && !moderationCheckLoading && moderationMessage && !canModerateDelete && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">{moderationMessage}</p>
                )}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {showDeleteInMenu ? (
          <DeleteShoutDialog
            shoutId={shout.id}
            authorUsername={shout.username}
            mode={isOwnShout ? "own" : "moderation"}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onDeleted={onDeleted}
          />
        ) : null}
      </CardHeader>
      <CardContent className="p-4 pt-2 pl-[4.5rem]">
        {shout.content ? (
          <ShoutContent content={shout.content} className="whitespace-pre-wrap" />
        ) : null}
        {shout.image_url ? <ShoutEmbeddedImage src={shout.image_url} /> : null}
      </CardContent>
      <CardFooter className="p-2 pl-[4.5rem] flex justify-between">
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 shrink-0 ${
                  liked ? "text-red-500" : "text-muted-foreground"
                } hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950`}
                onClick={handleLike}
                disabled={!currentUserId || isLikeLoading}
                aria-label={liked ? "Unlike shout" : "Like shout"}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-red-500" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {currentUserId ? (
                liked ? (
                  <span>
                    You liked with {formatLikeWeightShot(userLikeWeightWei)} staked
                    {stakedLikePower ? ` · Current stake: ${stakedLikePower}` : ""}
                  </span>
                ) : (
                  <span>
                    Like with your staked {LIKE_CURRENCY}
                    {stakedLikePower ? ` (${stakedLikePower} staked)` : ""}
                  </span>
                )
              ) : (
                "Sign in to like"
              )}
            </TooltipContent>
          </Tooltip>
          <span
            className={`text-xs font-medium tabular-nums ${
              liked && currentUserId ? "text-red-500" : "text-foreground"
            }`}
          >
            {likeDisplay}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
          asChild
        >
          <Link href={`/shout/${shout.id}`}>
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs">{commentCount}</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`${
            reshouted ? "text-green-600" : "text-muted-foreground"
          } hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950`}
          onClick={handleReshout}
          disabled={!currentUserId || isReshoutLoading || currentUserId === shout.user_id}
          title={
            currentUserId === shout.user_id
              ? "You cannot reshout your own shout"
              : reshouted
                ? "Undo reshout"
                : "Reshout"
          }
        >
          <Repeat2 className={`mr-1 h-4 w-4 ${reshouted ? "text-green-600" : ""}`} />
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
