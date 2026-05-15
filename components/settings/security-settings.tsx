"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteAccount } from "@/app/actions/settings-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface SecuritySettingsProps {
  username: string
}

export function SecuritySettings({ username }: SecuritySettingsProps) {
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDeleteAccount = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    setError("")
    try {
      const result = await deleteAccount(deleteConfirmUsername)

      if (result.success) {
        toast({
          title: "Account deleted",
          description: "Your account has been deleted successfully.",
        })
        setDialogOpen(false)
        router.push("/login")
        router.refresh()
      } else {
        setError(result.message || "Failed to delete account")
      }
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Shoutr uses wallet (SIWE) sign-in only. There is no password to manage.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription>
            Actions in this section can lead to permanent data loss. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-medium">Delete Account</h3>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. All of your data will be permanently removed.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from
                  our servers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <p className="text-sm font-medium">
                  Type your username <span className="font-mono text-purple-700">{username}</span> to confirm:
                </p>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="Your username"
                  value={deleteConfirmUsername}
                  onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmUsername.trim() !== username || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  )
}
