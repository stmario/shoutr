"use client"

import { useEffect, useState } from "react"
import { getUnreadNotificationCount } from "@/app/actions/notification-actions"
import { UnreadDot } from "@/components/unread-dot"

interface NotificationBadgeProps {
  initialCount?: number
}

export function NotificationBadge({ initialCount = 0 }: NotificationBadgeProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const interval = setInterval(async () => {
      const { count: newCount } = await getUnreadNotificationCount()
      setCount(newCount)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (count === 0) {
    return null
  }

  return <UnreadDot />
}
