"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MessageItem } from "@/components/message-item"
import { MessageInput } from "@/components/message-input"
import { getMessages, type Message } from "@/app/actions/message-actions"
import { Loader2 } from "lucide-react"

interface ConversationThreadProps {
  conversationId: number
  currentUserId: number
}

export function ConversationThread({ conversationId, currentUserId }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(
    async (markRead: boolean) => {
      const data = await getMessages(conversationId, { markRead })
      setMessages(data)
    },
    [conversationId],
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      try {
        const data = await getMessages(conversationId, { markRead: true })
        if (!cancelled) setMessages(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    const interval = setInterval(() => {
      loadMessages(false)
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [conversationId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleMessageSent = async () => {
    await loadMessages(false)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} isCurrentUser={message.sender_id === currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <MessageInput conversationId={conversationId} onMessageSent={handleMessageSent} />
    </div>
  )
}
