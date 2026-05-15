import { cn } from "@/lib/utils"

interface UnreadDotProps {
  className?: string
  /** Dot color variant */
  variant?: "purple" | "red"
}

export function UnreadDot({ className, variant = "purple" }: UnreadDotProps) {
  return (
    <span
      className={cn(
        "absolute top-0 right-0 h-2 w-2 rounded-full ring-2 ring-background",
        variant === "red" ? "bg-red-500" : "bg-purple-600",
        className,
      )}
      aria-hidden
    />
  )
}
