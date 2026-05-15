"use client"

import type React from "react"
import { useState, useRef, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { sendMessage } from "@/app/actions/message-actions"
import { useToast } from "@/hooks/use-toast"

interface MessageInputProps {
  conversationId: number
  onMessageSent?: () => void
}

export function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await sendMessage(conversationId, message.trim())

      if (result.success) {
        setMessage("")
        await onMessageSent?.()
      } else {
        toast({
          title: "Could not send",
          description: result.message || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 shrink-0 bg-background">
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="min-h-[52px] max-h-32 resize-none flex-1"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          className="bg-purple-700 hover:bg-purple-800 h-10 w-10 rounded-full p-0 shrink-0"
          disabled={!message.trim() || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </form>
  )
}
