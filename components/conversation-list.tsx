"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { getConversations } from "@/app/actions/message-actions"
import type { Conversation } from "@/app/actions/message-actions"
import { Skeleton } from "@/components/ui/skeleton"

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await getConversations()
        setConversations(data)
      } catch (error) {
        console.error("Error loading conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()

    // Refresh conversations every 30 seconds
    const interval = setInterval(loadConversations, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border-b">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
        <p className="text-muted-foreground">Start a conversation with someone to see it here.</p>
      </div>
    )
  }

  return (
    <div>
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants[0]
        const lastMessage = conversation.last_message
        const formattedDate = lastMessage
          ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })
          : ""

        return (
          <Link key={conversation.id} href={`/messages/${conversation.id}`}>
            <div
              className={`flex items-center gap-3 p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                conversation.unread_count > 0 ? "bg-purple-50 dark:bg-purple-900/10" : ""
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={otherParticipant.avatar_url || "/placeholder.svg?height=48&width=48"}
                  alt={otherParticipant.username}
                />
                <AvatarFallback>{otherParticipant.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold truncate">{otherParticipant.username}</h3>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formattedDate}</span>
                  )}
                </div>
                {lastMessage ? (
                  <p className="text-sm text-muted-foreground truncate">{lastMessage.content}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No messages yet</p>
                )}
              </div>
              {conversation.unread_count > 0 && (
                <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-700 text-xs font-medium text-white">
                  {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
