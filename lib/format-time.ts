import {
  differenceInMinutes,
  format,
  isToday,
  isYesterday,
} from "date-fns"

/**
 * Postgres / Neon often returns timestamps without a timezone suffix.
 * Treat those as UTC so the browser doesn't mis-parse them as local time.
 */
export function parseDbDate(value: string | Date): Date {
  if (value instanceof Date) return value

  const s = String(value).trim()
  if (!s) return new Date(NaN)

  if (/[zZ]$|[+-]\d{2}(:?\d{2})?$/.test(s)) {
    return new Date(s)
  }

  const isoLike = s.includes("T") ? s : s.replace(" ", "T")
  return new Date(isoLike.endsWith("Z") ? isoLike : `${isoLike}Z`)
}

export function serializeTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (value == null) return new Date(0).toISOString()
  const parsed = parseDbDate(String(value))
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return String(value)
}

/** Fixed calendar/clock label — safe for SSR and hydration (no "now"). */
export function formatAbsoluteTimestamp(value: string | Date): string {
  const date = value instanceof Date ? value : parseDbDate(value)
  if (Number.isNaN(date.getTime())) return ""
  return format(date, "MMM d, yyyy, h:mm a")
}

/** Chat-friendly time: clock time today, no vague "about X hours ago". */
export function formatChatTimestamp(value: string | Date): string {
  const date = value instanceof Date ? value : parseDbDate(value)
  if (Number.isNaN(date.getTime())) return ""

  const minutes = differenceInMinutes(new Date(), date)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`

  if (isToday(date)) return format(date, "h:mm a")
  if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`

  const now = new Date()
  if (now.getFullYear() === date.getFullYear()) {
    return format(date, "MMM d, h:mm a")
  }
  return format(date, "MMM d, yyyy, h:mm a")
}
