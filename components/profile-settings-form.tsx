"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateProfile, updateProfileImage } from "@/app/actions/profile-settings"
import { toast } from "@/components/ui/use-toast"

interface ProfileSettingsFormProps {
  user: {
    id: number
    username: string
    display_name: string
    email: string
    bio: string | null
    avatar_url: string | null
    location?: string | null
    website?: string | null
  }
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(user.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Auto-upload the image
      const formData = new FormData()
      formData.append("avatar", file)
      handleImageUpload(formData)
    }
  }

  const handleImageUpload = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      const response = await updateProfileImage(formData)

      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        })
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      const formData = new FormData(e.currentTarget)
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
    } catch (error) {
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
      <div className="flex items-start gap-4">
        <div
          className="relative h-24 w-24 rounded-full overflow-hidden bg-muted cursor-pointer group"
          onClick={handleImageClick}
        >
          {imagePreview ? (
            <Image src={imagePreview || "/placeholder.svg"} alt={user.display_name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
              {user.display_name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>
        <div>
          <h2 className="text-lg font-medium">Profile Picture</h2>
          <p className="text-sm text-muted-foreground">Click to upload a new profile picture</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input id="display_name" name="display_name" defaultValue={user.display_name} maxLength={50} required />
        </div>

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
