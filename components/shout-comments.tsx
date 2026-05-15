"use client"

import { useState } from "react"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { CommentItem } from "@/components/comment-item"
import { CommentForm } from "@/components/comment-form"
import { Button } from "@/components/ui/button"
import {
  deleteComment,
  type Comment,
} from "@/app/actions/comment-actions"
import { useToast } from "@/hooks/use-toast"

interface ShoutCommentsProps {
  shoutId: number
  initialComments: Comment[]
  currentUserId?: number
}

export function ShoutComments({ shoutId, initialComments, currentUserId }: ShoutCommentsProps) {
  const [comments, setComments] = useState(initialComments)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { toast } = useToast()

  const handlePosted = (comment: Comment) => {
    setComments((prev) => [...prev, comment])
  }

  const handleDelete = async (commentId: number) => {
    setDeletingId(commentId)
    try {
      const result = await deleteComment(commentId)
      if (!result.success) {
        toast({
          title: "Could not delete",
          description: result.message || "Try again",
          variant: "destructive",
        })
        return
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mt-8 border-t pt-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-purple-700" />
        Comments
        <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">No comments yet. Be the first to reply.</p>
      ) : (
        <div className="divide-y mb-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              isDeleting={deletingId === comment.id}
            />
          ))}
        </div>
      )}

      {currentUserId ? (
        <CommentForm shoutId={shoutId} onPosted={handlePosted} />
      ) : (
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">Sign in to join the conversation</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in with wallet</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
