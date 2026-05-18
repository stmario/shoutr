"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MentionAutocompleteTextarea } from "@/components/mention-autocomplete-textarea"
import { ImageIcon, Loader2 } from "lucide-react"
import { createShout } from "@/app/actions/shout-actions"
import { useToast } from "@/hooks/use-toast"
import { ShoutImageAttachmentPanel, useShoutImageAttachment } from "@/components/shout-image-attachment"
import { ShoutDraftRichPreview } from "@/components/shout-draft-rich-preview"

interface NewShoutFormProps {
  user: {
    id: number
    username: string
    avatar_url?: string
  }
}

export function NewShoutForm({ user }: NewShoutFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const attachment = useShoutImageAttachment()
  const { toast } = useToast()
  const router = useRouter()

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setCharacterCount(newContent.length)
  }

  const canPost = (content.trim().length > 0 || attachment.hasImage) && characterCount <= 280

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canPost) return

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append("content", content.trim())
      if (attachment.imageUrl) {
        formData.append("imageUrl", attachment.imageUrl)
      }

      const result = await createShout(formData)

      if (result.success) {
        setContent("")
        attachment.resetAttachment()
        setCharacterCount(0)
        toast({ title: "Shout posted!", description: "Your shout has been posted successfully." })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to post your shout. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error posting shout:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting

  return (
    <Card className="border-b border-x-0 rounded-none md:border md:rounded-lg mb-4">
      <form onSubmit={handleSubmit}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || "/placeholder.svg?height=40&width=40"} alt={`@${user.username}`} />
              <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <MentionAutocompleteTextarea
                name="content"
                placeholder="What's happening? Use @username to mention someone."
                className="border-0 focus-visible:ring-0 resize-none text-lg min-h-[100px]"
                value={content}
                onChange={handleContentChange}
                disabled={busy}
              />
              <ShoutImageAttachmentPanel attachment={attachment} disabled={busy} />
              <ShoutDraftRichPreview content={content} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-3 flex justify-between items-center border-t mt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`text-purple-700 rounded-full h-8 w-8 ${attachment.showPanel ? "bg-purple-100 dark:bg-purple-900/30" : ""}`}
              onClick={() => attachment.setShowPanel((v) => !v)}
              disabled={busy}
              title="Add image"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-sm ${characterCount > 280 ? "text-red-500" : "text-muted-foreground"}`}>
              {characterCount}/280
            </div>
            <Button
              type="submit"
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-full"
              disabled={!canPost || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Shout"
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
