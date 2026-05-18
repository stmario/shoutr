"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { blockUser, unblockUser } from "@/app/actions/block-actions"
import { useToast } from "@/hooks/use-toast"

interface BlockUserButtonProps {
  targetUserId: number
  initialBlocked: boolean
  size?: "default" | "sm"
}

export function BlockUserButton({ targetUserId, initialBlocked, size = "default" }: BlockUserButtonProps) {
  const [blocked, setBlocked] = useState(initialBlocked)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const result = blocked ? await unblockUser(targetUserId) : await blockUser(targetUserId)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message ?? "Something went wrong",
          variant: "destructive",
        })
        return
      }
      const nowBlocked = !blocked
      setBlocked(nowBlocked)
      toast({
        title: nowBlocked ? "Blocked" : "Unblocked",
        description: nowBlocked
          ? "You will no longer see this user's content, and they will not see yours."
          : "You can follow and message this user again.",
      })
      router.refresh()
    } catch (e) {
      console.error(e)
      toast({
        title: "Error",
        description: "Could not update block status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={blocked ? "" : "text-destructive hover:text-destructive"}
      onClick={handleClick}
      disabled={loading}
    >
      {blocked ? (
        <>
          <UserCheck className="mr-2 h-4 w-4" />
          {loading ? "…" : "Unblock"}
        </>
      ) : (
        <>
          <Ban className="mr-2 h-4 w-4" />
          {loading ? "…" : "Block"}
        </>
      )}
    </Button>
  )
}
