"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { moderateDeleteComment } from "@/app/actions/comment-delete-actions"
import { MAX_DELETE_REASON_LENGTH, MIN_DELETE_REASON_LENGTH } from "@/lib/moderation-shot"
import { useToast } from "@/hooks/use-toast"

type DeleteCommentDialogProps = {
  commentId: number
  authorUsername: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteCommentDialog({
  commentId,
  authorUsername,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCommentDialogProps) {
  const [reason, setReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await moderateDeleteComment(commentId, reason)

      if (!result.success) {
        toast({
          title: "Cannot delete comment",
          description: result.message || "Failed to delete",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Comment deleted",
        description: `Removed @${authorUsername}'s comment.`,
      })
      setReason("")
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      console.error("Delete comment error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete comment</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes @{authorUsername}&apos;s comment. You must have at least 10,000 SHOT staked and
            more stake than the author. Provide a clear reason for the deletion.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor={`delete-comment-reason-${commentId}`}>Reason for deletion</Label>
          <Textarea
            id={`delete-comment-reason-${commentId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this comment is being removed…"
            rows={4}
            maxLength={MAX_DELETE_REASON_LENGTH}
            disabled={isDeleting}
          />
          <p className="text-xs text-muted-foreground">
            {reason.trim().length}/{MAX_DELETE_REASON_LENGTH} characters (min {MIN_DELETE_REASON_LENGTH})
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || reason.trim().length < MIN_DELETE_REASON_LENGTH}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete comment"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
