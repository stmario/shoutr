"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MentionAutocompleteTextarea } from "@/components/mention-autocomplete-textarea"
import { postComment } from "@/app/actions/comment-actions"
import { useToast } from "@/hooks/use-toast"
import type { Comment } from "@/app/actions/comment-actions"

interface CommentFormProps {
  shoutId: number
  onPosted: (comment: Comment) => void
}

export function CommentForm({ shoutId, onPosted }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await postComment(shoutId, content)

      if (!result.success || !result.comment) {
        toast({
          title: "Could not post comment",
          description: result.message || "Try again",
          variant: "destructive",
        })
        return
      }

      setContent("")
      onPosted(result.comment)
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t pt-4">
      <MentionAutocompleteTextarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment… Use @username to mention someone."
        className="min-h-[80px] resize-none mb-2"
        maxLength={500}
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/500</span>
        <Button
          type="submit"
          size="sm"
          className="bg-purple-700 hover:bg-purple-800"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Comment
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
