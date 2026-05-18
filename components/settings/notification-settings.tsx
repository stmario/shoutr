"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { updateNotificationSettings } from "@/app/actions/settings-actions"
import { useToast } from "@/hooks/use-toast"

interface NotificationSettingsProps {
  initialSettings: {
    push_notifications?: boolean
    mention_notifications?: boolean
    follow_notifications?: boolean
    like_notifications?: boolean
    reshout_notifications?: boolean
    comment_notifications?: boolean
    message_notifications?: boolean
  } | null
}

export function NotificationSettings({ initialSettings }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    push_notifications: initialSettings?.push_notifications ?? true,
    mention_notifications: initialSettings?.mention_notifications ?? true,
    follow_notifications: initialSettings?.follow_notifications ?? true,
    like_notifications: initialSettings?.like_notifications ?? true,
    reshout_notifications: initialSettings?.reshout_notifications ?? true,
    comment_notifications: initialSettings?.comment_notifications ?? true,
    message_notifications: initialSettings?.message_notifications ?? true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleToggle = (name: string) => {
    setSettings((prev) => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const result = await updateNotificationSettings(settings)

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Notification settings updated",
          description: "Your notification preferences have been updated successfully.",
        })
      } else {
        setError(result.message || "Failed to update notification settings")
      }
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Control what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <AlertDescription>Your notification preferences have been updated successfully.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Delivery Methods</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push_notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                </div>
                <Switch
                  id="push_notifications"
                  checked={settings.push_notifications}
                  onCheckedChange={() => handleToggle("push_notifications")}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notification Types</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mention_notifications">Mentions</Label>
                  <p className="text-sm text-muted-foreground">When someone @mentions you in a shout or comment</p>
                </div>
                <Switch
                  id="mention_notifications"
                  checked={settings.mention_notifications}
                  onCheckedChange={() => handleToggle("mention_notifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="follow_notifications">Follows</Label>
                  <p className="text-sm text-muted-foreground">When someone follows you</p>
                </div>
                <Switch
                  id="follow_notifications"
                  checked={settings.follow_notifications}
                  onCheckedChange={() => handleToggle("follow_notifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="like_notifications">Likes</Label>
                  <p className="text-sm text-muted-foreground">When someone likes your shout</p>
                </div>
                <Switch
                  id="like_notifications"
                  checked={settings.like_notifications}
                  onCheckedChange={() => handleToggle("like_notifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reshout_notifications">Reshouts</Label>
                  <p className="text-sm text-muted-foreground">When someone reshouts your shout</p>
                </div>
                <Switch
                  id="reshout_notifications"
                  checked={settings.reshout_notifications}
                  onCheckedChange={() => handleToggle("reshout_notifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comment_notifications">Comments</Label>
                  <p className="text-sm text-muted-foreground">When someone comments on your shout</p>
                </div>
                <Switch
                  id="comment_notifications"
                  checked={settings.comment_notifications}
                  onCheckedChange={() => handleToggle("comment_notifications")}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="message_notifications">Messages</Label>
                  <p className="text-sm text-muted-foreground">When someone sends you a message</p>
                </div>
                <Switch
                  id="message_notifications"
                  checked={settings.message_notifications}
                  onCheckedChange={() => handleToggle("message_notifications")}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="bg-purple-700 hover:bg-purple-800" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
