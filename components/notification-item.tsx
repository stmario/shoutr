"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, UserPlus, MessageCircle, Repeat2, ArrowUp, Mail } from "lucide-react"
import Link from "next/link"

interface NotificationItemProps {
  notification: {
    id: number
    type: string
    created_at: string
    is_read: boolean
    actor_id: number
    actor_username: string
    actor_avatar_url?: string
    shout_id?: number
    shout_content?: string
    comment_id?: number
    comment_content?: string
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const formattedDate = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  const renderIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "vote":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      case "reshout":
        return <Repeat2 className="h-4 w-4 text-green-500" />
      case "message":
        return <Mail className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const renderContent = () => {
    switch (notification.type) {
      case "like":
        return (
          <>
            <span className="font-semibold">{notification.actor_username}</span>
            <span className="text-muted-foreground"> liked your shout</span>
          </>
        )
      case "vote":
        return (
          <>
            <span className="font-semibold">{notification.actor_username}</span>
            <span className="text-muted-foreground"> voted on your shout</span>
          </>
        )
      case "follow":
        return (
          <>
            <span className="font-semibold">{notification.actor_username}</span>
            <span className="text-muted-foreground"> followed you</span>
          </>
        )
      case "comment":
        return (
          <>
            <span className="font-semibold">{notification.actor_username}</span>
            <span className="text-muted-foreground"> commented on your shout</span>
            {notification.comment_content && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">"{notification.comment_content}"</p>
            )}
          </>
        )
      case "reshout":
        return (
          <>
            <span className="font-semibold">{notification.actor_username}</span>
            <span className="text-muted-foreground"> reshouted your post</span>
          </>
        )
      case "message":
        return (
          <>
            <span className="font-semibold">{notification.actor_username}</span>
            <span className="text-muted-foreground"> sent you a message</span>
          </>
        )
      default:
        return null
    }
  }

  const getNotificationLink = () => {
    if (notification.type === "follow") {
      return `/profile/${notification.actor_username}`
    }
    if (notification.type === "message") {
      return `/messages/with/${notification.actor_username}`
    }
    if (notification.shout_id) {
      return `/shout/${notification.shout_id}`
    }
    return "#"
  }

  return (
    <Link
      href={getNotificationLink()}
      className={`flex items-start gap-3 p-4 hover:bg-muted transition-colors ${
        !notification.is_read ? "bg-muted/50 border-l-2 border-l-purple-600" : ""
      }`}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={notification.actor_avatar_url || "/placeholder.svg?height=40&width=40"}
          alt={notification.actor_username}
        />
        <AvatarFallback>{notification.actor_username.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2">
          {renderIcon()}
          <div className="text-sm">{renderContent()}</div>
        </div>
        <span className="text-xs text-muted-foreground mt-1">{formattedDate}</span>
      </div>
      {!notification.is_read && (
        <span
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-purple-600"
          aria-label="Unread notification"
        />
      )}
    </Link>
  )
}
