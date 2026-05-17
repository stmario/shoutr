import Link from "next/link"
import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type UsernameDisplayProps = {
  username: string
  verified?: boolean
  className?: string
  nameClassName?: string
  showAt?: boolean
  asLink?: boolean
}

export function UsernameDisplay({
  username,
  verified = false,
  className,
  nameClassName,
  showAt = true,
  asLink = true,
}: UsernameDisplayProps) {
  const label = showAt ? `@${username}` : username

  const content = (
    <>
      <span className={cn("truncate", nameClassName)}>{label}</span>
      {verified ? (
        <BadgeCheck
          className="h-4 w-4 shrink-0 fill-sky-500 text-background"
          aria-label="ENS verified"
        />
      ) : null}
    </>
  )

  if (asLink) {
    return (
      <Link
        href={`/profile/${username}`}
        className={cn("inline-flex max-w-full items-center gap-0.5 hover:underline", className)}
      >
        {content}
      </Link>
    )
  }

  return <span className={cn("inline-flex items-center gap-0.5", className)}>{content}</span>
}
