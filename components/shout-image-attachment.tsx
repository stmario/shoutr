"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export type ShoutImageAttachmentState = {
  imageUrl: string | null
  imagePreview: string | null
  hasImage: boolean
}

export function useShoutImageAttachment() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState("")
  const [showPanel, setShowPanel] = useState(false)
  const { toast } = useToast()

  const removeImage = () => {
    setImageUrl(null)
    setImagePreview(null)
    setUrlDraft("")
  }

  const applyImageUrl = () => {
    const trimmed = urlDraft.trim()
    if (!trimmed) {
      toast({ title: "Enter an image URL", variant: "destructive" })
      return
    }
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("invalid protocol")
      }
      setImageUrl(parsed.toString())
      setImagePreview(parsed.toString())
      toast({ title: "Image added", description: "Image URL attached to your shout." })
    } catch {
      toast({
        title: "Invalid URL",
        description: "Use a direct image link starting with http:// or https://",
        variant: "destructive",
      })
    }
  }

  return {
    imageUrl,
    imagePreview,
    hasImage: Boolean(imageUrl && imagePreview),
    urlDraft,
    setUrlDraft,
    showPanel,
    setShowPanel,
    removeImage,
    applyImageUrl,
    resetAttachment: () => {
      removeImage()
      setShowPanel(false)
    },
  }
}

export function ShoutImageAttachmentPanel({
  attachment,
  disabled,
}: {
  attachment: ReturnType<typeof useShoutImageAttachment>
  disabled?: boolean
}) {
  const { imagePreview, urlDraft, setUrlDraft, showPanel, removeImage, applyImageUrl } = attachment

  if (!showPanel && !imagePreview) return null

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border p-3 bg-muted/20">
      {imagePreview && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <div className="relative w-full max-h-80">
            <Image
              src={imagePreview}
              alt="Attached image preview"
              width={800}
              height={450}
              className="w-full h-auto max-h-80 object-contain"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={removeImage}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showPanel && (
        <div className="space-y-2">
          <Label htmlFor="shout-image-url">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="shout-image-url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://example.com/image.png"
              type="url"
              disabled={disabled}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  applyImageUrl()
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={applyImageUrl} disabled={disabled}>
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste a direct link to an image (http or https). You can also embed inline with{" "}
            <code className="text-[11px]">![alt](url)</code> in the text.
          </p>
        </div>
      )}
    </div>
  )
}
