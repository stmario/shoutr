"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Comment } from "@/app/actions/comment-actions"
import { getCommentModerationDeleteEligibility } from "@/app/actions/comment-delete-actions"
import { DeleteCommentDialog } from "@/components/delete-comment-dialog"
import { ClientTime } from "@/components/client-time"
import { UsernameDisplay } from "@/components/username-display"

interface CommentItemProps {
  comment: Comment
  currentUserId?: number
  onDelete?: (commentId: number) => void
  onModeratedDelete?: (commentId: number) => void
  isDeleting?: boolean
}

export function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onModeratedDelete,
  isDeleting,
}: CommentItemProps) {
  const isOwner = currentUserId === comment.user_id
  const showModerationMenu = Boolean(currentUserId) && !isOwner

  const [canModerateDelete, setCanModerateDelete] = useState(false)
  const [moderationCheckLoading, setModerationCheckLoading] = useState(false)
  const [moderationMessage, setModerationMessage] = useState<string | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleModerationMenuOpenChange = (open: boolean) => {
    if (!open || !showModerationMenu) return

    void (async () => {
      setModerationCheckLoading(true)
      setModerationMessage(undefined)
      try {
        const eligibility = await getCommentModerationDeleteEligibility(comment.id)
        setCanModerateDelete(eligibility.canDelete)
        if (!eligibility.canDelete) {
          setModerationMessage(eligibility.message)
        }
      } catch {
        setCanModerateDelete(false)
        setModerationMessage("Could not verify moderation eligibility")
      } finally {
        setModerationCheckLoading(false)
      }
    })()
  }

  return (
    <div className="flex gap-3 py-3">
      <Link href={`/profile/${comment.username}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={comment.avatar_url || "/placeholder.svg?height=36&width=36"}
            alt={comment.username}
          />
          <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <UsernameDisplay
              username={comment.username}
              verified={comment.is_verified}
              nameClassName="font-semibold text-sm"
            />
            <ClientTime value={comment.created_at} className="text-muted-foreground text-xs ml-2" />
          </div>
          {isOwner && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
              title="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
          {showModerationMenu ? (
            <>
              <DropdownMenu onOpenChange={handleModerationMenuOpenChange}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Comment actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-w-xs">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={moderationCheckLoading || !canModerateDelete}
                    onSelect={(event) => {
                      if (moderationCheckLoading || !canModerateDelete) {
                        event.preventDefault()
                        return
                      }
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {moderationCheckLoading ? "Checking stake…" : "Delete comment"}
                  </DropdownMenuItem>
                  {!moderationCheckLoading && moderationMessage && !canModerateDelete ? (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">{moderationMessage}</p>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
              <DeleteCommentDialog
                commentId={comment.id}
                authorUsername={comment.username}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onDeleted={() => onModeratedDelete?.(comment.id)}
              />
            </>
          ) : null}
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
      </div>
    </div>
  )
}
