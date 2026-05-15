"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Smile, MapPin, Calendar, X, Loader2 } from "lucide-react"
import { createShout } from "@/app/actions/shout-actions"
import { uploadImage } from "@/app/actions/upload-actions"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

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
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [characterCount, setCharacterCount] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setCharacterCount(newContent.length)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create a preview
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadImage(formData)

      if (result.success) {
        setImageUrl(result.url)
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully.",
        })
      } else {
        setImagePreview(null)
        toast({
          title: "Upload failed",
          description: result.message || "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      setImagePreview(null)
      toast({
        title: "Upload error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setImageUrl(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (formData: FormData) => {
    if (content.trim().length === 0) return

    try {
      setIsSubmitting(true)

      // Add the content and image URL to the form data
      formData.append("content", content)
      if (imageUrl) {
        formData.append("imageUrl", imageUrl)
      }

      const result = await createShout(formData)

      if (result.success) {
        setContent("")
        setImageUrl(null)
        setImagePreview(null)
        setCharacterCount(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        toast({
          title: "Shout posted!",
          description: "Your shout has been posted successfully.",
        })

        // Refresh the page to show the new shout
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

  return (
    <Card className="border-b border-x-0 rounded-none md:border md:rounded-lg mb-4">
      <form ref={formRef} action={handleSubmit}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || "/placeholder.svg?height=40&width=40"} alt={`@${user.username}`} />
              <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                name="content"
                placeholder="What's happening?"
                className="border-0 focus-visible:ring-0 resize-none text-lg min-h-[100px]"
                value={content}
                onChange={handleContentChange}
                disabled={isSubmitting}
              />

              {imagePreview && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-border">
                  <div className="relative aspect-video max-h-80 w-full">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Upload preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <input type="hidden" name="imageUrl" value={imageUrl || ""} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center border-t mt-2">
          <div className="flex gap-2">
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-purple-700 rounded-full h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isUploading}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting || isUploading}
              />
            </div>
            <Button variant="ghost" size="icon" className="text-purple-700 rounded-full h-8 w-8">
              <Smile className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-purple-700 rounded-full h-8 w-8">
              <MapPin className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-purple-700 rounded-full h-8 w-8">
              <Calendar className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-sm ${characterCount > 280 ? "text-red-500" : "text-muted-foreground"}`}>
              {characterCount}/280
            </div>
            <Button
              type="submit"
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-full"
              disabled={content.trim().length === 0 || characterCount > 280 || isSubmitting || isUploading}
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
