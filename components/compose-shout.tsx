"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Loader2 } from "lucide-react"
import { createShout } from "@/app/actions/shout-actions"
import { useToast } from "@/hooks/use-toast"
import { ShoutImageAttachmentPanel, useShoutImageAttachment } from "@/components/shout-image-attachment"
import { ShoutDraftRichPreview } from "@/components/shout-draft-rich-preview"
import { timelineRowClass } from "@/lib/timeline-styles"
import { cn } from "@/lib/utils"

interface ComposeShoutProps {
  username: string
  avatarUrl?: string | null
  onShoutCreated?: () => void
  variant?: "card" | "timeline"
}

export function ComposeShout({ username, avatarUrl, onShoutCreated, variant = "card" }: ComposeShoutProps) {
  const showName = username?.trim() || "User"
  const showHandle = username?.trim() || "user"

  const [shoutContent, setShoutContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const attachment = useShoutImageAttachment()
  const { toast } = useToast()

  const handleShoutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setShoutContent(newContent)
    setCharacterCount(newContent.length)
  }

  const canPost = (shoutContent.trim().length > 0 || attachment.hasImage) && characterCount <= 280

  const handleShoutSubmit = async () => {
    if (!canPost) return

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append("content", shoutContent.trim())
      if (attachment.imageUrl) {
        formData.append("imageUrl", attachment.imageUrl)
      }

      const result = await createShout(formData)

      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "Failed to post your shout. Please try again.",
          variant: "destructive",
        })
        return
      }

      setShoutContent("")
      attachment.resetAttachment()
      setCharacterCount(0)

      onShoutCreated?.()

      toast({
        title: "Shout posted!",
        description: "Your shout has been posted successfully.",
      })
    } catch (error) {
      console.error("Error posting shout:", error)
      toast({
        title: "Error",
        description: "Failed to post your shout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting

  return (
    <Card
      className={cn(
        variant === "timeline"
          ? timelineRowClass
          : "mb-4 rounded-none border-x-0 border-b md:rounded-lg md:border",
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || "/placeholder.svg?height=40&width=40"} alt={`@${showHandle}`} />
            <AvatarFallback>{showName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's happening?"
              className="border-0 focus-visible:ring-0 resize-none text-lg"
              value={shoutContent}
              onChange={handleShoutChange}
              disabled={busy}
            />

            <ShoutImageAttachmentPanel attachment={attachment} disabled={busy} />
            <ShoutDraftRichPreview content={shoutContent} />
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
            className="bg-purple-700 hover:bg-purple-800 text-white rounded-full"
            disabled={!canPost || isSubmitting}
            onClick={handleShoutSubmit}
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
    </Card>
  )
}
