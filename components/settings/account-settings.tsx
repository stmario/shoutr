"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { updateAccountSettings } from "@/app/actions/settings-actions"
import { useToast } from "@/hooks/use-toast"

interface AccountSettingsProps {
  user: {
    id: number
    username: string
    wallet_address?: string | null
  }
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [formData, setFormData] = useState({
    username: user.username || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const result = await updateAccountSettings(formData)

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Account updated",
          description: "Your account has been updated successfully.",
        })
      } else {
        setError(result.message || "Failed to update account")
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
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your account details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <AlertDescription>Your account has been updated successfully.</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Linked wallet</Label>
              <p className="text-sm font-mono break-all">{user.wallet_address ?? "No wallet linked"}</p>
              <p className="text-sm text-muted-foreground">
                To use a different address,{" "}
                <Link href="/login" className="text-primary underline">
                  log out and sign in
                </Link>{" "}
                with Switch wallet on the login page.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
              <p className="text-sm text-muted-foreground">
                This is your public username that appears in your profile URL. Names already registered on ENS to
                another wallet cannot be used. A verified badge appears when your username matches your wallet&apos;s
                primary ENS name.
              </p>
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
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
