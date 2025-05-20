"use client"

import { useEffect, useState } from "react"
import { getUnreadNotificationCount } from "@/app/actions/notification-actions"

interface NotificationBadgeProps {
  initialCount?: number
}

export function NotificationBadge({ initialCount = 0 }: NotificationBadgeProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    // Update count every minute
    const interval = setInterval(async () => {
      const newCount = await getUnreadNotificationCount()
      setCount(newCount)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (count === 0) {
    return null
  }

  return (
    <div className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
      {count > 99 ? "99+" : count}
    </div>
  )
}
