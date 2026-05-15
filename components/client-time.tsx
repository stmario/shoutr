"use client"

import { useEffect, useMemo, useState } from "react"
import {
  formatAbsoluteTimestamp,
  formatChatTimestamp,
  parseDbDate,
} from "@/lib/format-time"

interface ClientTimeProps {
  value: string | Date
  className?: string
}

/** Relative-friendly time that hydrates without mismatch (absolute first, then updates on client). */
export function ClientTime({ value, className }: ClientTimeProps) {
  const parsed = useMemo(
    () => (value instanceof Date ? value : parseDbDate(value)),
    [value],
  )

  const iso = Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
  const staticLabel = useMemo(() => formatAbsoluteTimestamp(parsed), [parsed])

  const [label, setLabel] = useState(staticLabel)

  useEffect(() => {
    setLabel(formatChatTimestamp(parsed))
    const interval = setInterval(() => {
      setLabel(formatChatTimestamp(parsed))
    }, 30_000)
    return () => clearInterval(interval)
  }, [parsed])

  return (
    <time
      dateTime={iso}
      className={className}
      suppressHydrationWarning
      title={iso ? new Date(iso).toLocaleString() : undefined}
    >
      {label}
    </time>
  )
}
