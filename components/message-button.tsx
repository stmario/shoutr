"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startConversation } from "@/app/actions/message-actions"
import { useToast } from "@/hooks/use-toast"

interface MessageButtonProps {
  userId: number
  variant?: "default" | "outline"
  size?: "default" | "sm"
}

export function MessageButton({ userId, variant = "outline", size = "default" }: MessageButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const result = await startConversation(userId)
      if (!result.success || !result.conversationId) {
        toast({
          title: "Error",
          description: result.message || "Could not open conversation",
          variant: "destructive",
        })
        return
      }
      router.push(`/messages/${result.conversationId}`)
    } catch (error) {
      console.error("Error starting conversation:", error)
      toast({
        title: "Error",
        description: "Could not open conversation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleClick} disabled={loading}>
      <Mail className="mr-2 h-4 w-4" />
      {loading ? "Opening…" : "Message"}
    </Button>
  )
}
