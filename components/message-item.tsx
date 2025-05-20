"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "@/app/actions/message-actions"

interface MessageItemProps {
  message: Message
  isCurrentUser: boolean
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const formattedDate = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })

  if (isCurrentUser) {
    return (
      <div className="flex flex-col items-end mb-4">
        <div className="flex items-end gap-2">
          <div className="max-w-[75%] bg-purple-700 text-white p-3 rounded-lg rounded-br-none">
            <p>{message.content}</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={message.sender_avatar_url || "/placeholder.svg?height=32&width=32"}
              alt={message.sender_display_name || ""}
            />
            <AvatarFallback>{message.sender_display_name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
        </div>
        <span className="text-xs text-muted-foreground mt-1 mr-10">{formattedDate}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start mb-4">
      <div className="flex items-end gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={message.sender_avatar_url || "/placeholder.svg?height=32&width=32"}
            alt={message.sender_display_name || ""}
          />
          <AvatarFallback>{message.sender_display_name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <div className="max-w-[75%] bg-gray-200 dark:bg-gray-800 p-3 rounded-lg rounded-bl-none">
          <p>{message.content}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1 ml-10">{formattedDate}</span>
    </div>
  )
}
