"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markNotificationsAsRead } from "@/app/actions/notification-actions"
import { useToast } from "@/hooks/use-toast"

export function MarkAllNotificationsRead() {
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = async () => {
    if (pending) return
    setPending(true)
    try {
      const result = await markNotificationsAsRead()
      if (!result.success) {
        toast({
          title: "Could not update",
          description: "Try again in a moment.",
          variant: "destructive",
        })
        return
      }
      router.refresh()
    } catch (error) {
      console.error("Mark all read failed:", error)
      toast({
        title: "Could not update",
        description: "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating…
        </>
      ) : (
        "Mark all as read"
      )}
    </Button>
  )
}
