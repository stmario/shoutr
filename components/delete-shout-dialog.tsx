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
import { moderateDeleteShout } from "@/app/actions/shout-delete-actions"
import {
  MAX_DELETE_REASON_LENGTH,
  MIN_DELETE_REASON_LENGTH,
} from "@/lib/moderation-shot"
import { useToast } from "@/hooks/use-toast"

type DeleteShoutDialogProps = {
  shoutId: number
  authorUsername: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteShoutDialog({
  shoutId,
  authorUsername,
  open,
  onOpenChange,
  onDeleted,
}: DeleteShoutDialogProps) {
  const [reason, setReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await moderateDeleteShout(shoutId, reason)

      if (!result.success) {
        toast({
          title: "Cannot delete shout",
          description: result.message || "Failed to delete",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Shout deleted",
        description: `Removed @${authorUsername}'s shout.`,
      })
      setReason("")
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      console.error("Delete shout error:", error)
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
          <AlertDialogTitle>Delete shout</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes @{authorUsername}&apos;s shout. You must have at least 10,000 SHOT
            staked and more stake than the author. Provide a clear reason for the deletion.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor={`delete-reason-${shoutId}`}>Reason for deletion</Label>
          <Textarea
            id={`delete-reason-${shoutId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this shout is being removed…"
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
              "Delete shout"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
