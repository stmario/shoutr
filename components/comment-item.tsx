"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Comment } from "@/app/actions/comment-actions"
import { ClientTime } from "@/components/client-time"

interface CommentItemProps {
  comment: Comment
  currentUserId?: number
  onDelete?: (commentId: number) => void
  isDeleting?: boolean
}

export function CommentItem({ comment, currentUserId, onDelete, isDeleting }: CommentItemProps) {
  const isOwner = currentUserId === comment.user_id

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
            <Link href={`/profile/${comment.username}`} className="font-semibold text-sm hover:underline">
              @{comment.username}
            </Link>
            <ClientTime value={comment.created_at} className="text-muted-foreground text-xs ml-2" />
          </div>
          {isOwner && onDelete && (
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
          )}
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
      </div>
    </div>
  )
}
