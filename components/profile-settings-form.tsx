"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile } from "@/app/actions/profile-settings"
import { toast } from "@/components/ui/use-toast"

interface ProfileSettingsFormProps {
  user: {
    id: number
    username: string
    bio: string | null
    avatar_url: string | null
    location?: string | null
    website?: string | null
  }
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      const formData = new FormData(e.currentTarget)
      formData.set("avatar_url", avatarUrl)
      const response = await updateProfile(formData)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        })
        router.push(`/profile/${user.username}`)
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Avatar className="h-24 w-24 shrink-0">
          <AvatarImage src={avatarUrl || "/placeholder.svg?height=96&width=96"} alt={user.username} />
          <AvatarFallback className="text-2xl">{user.username.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 w-full">
          <Label htmlFor="avatar_url">Avatar URL</Label>
          <Input
            id="avatar_url"
            name="avatar_url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            type="url"
            autoComplete="off"
          />
          <p className="text-sm text-muted-foreground">
            Paste a direct link to an image (http or https). Leave empty for the default avatar.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={user.bio || ""}
            maxLength={160}
            className="resize-none h-24"
            placeholder="Tell us about yourself"
          />
          <p className="text-xs text-muted-foreground text-right">
            <span id="bio-count">0</span>/160
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={user.location || ""}
            maxLength={30}
            placeholder="Where are you based?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            defaultValue={user.website || ""}
            maxLength={100}
            placeholder="https://example.com"
            type="url"
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.push(`/profile/${user.username}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-purple-700 hover:bg-purple-800 text-white">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}
