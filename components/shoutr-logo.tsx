import Link from "next/link"
import { cn } from "@/lib/utils"
import { ShotTokenLogo } from "@/components/shot-token-logo"

type ShoutrLogoProps = {
  className?: string
  /** CSS display size in pixels for the token logo. */
  size?: number
  iconClassName?: string
  showWordmark?: boolean
  wordmarkClassName?: string
  priority?: boolean
}

export function ShoutrLogo({
  className,
  size = 32,
  iconClassName,
  showWordmark = true,
  wordmarkClassName = "text-xl font-bold",
  priority = false,
}: ShoutrLogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <ShotTokenLogo size={size} iconClassName={iconClassName} priority={priority} />
      {showWordmark && (
        <Link href="/" className={cn(wordmarkClassName, "hover:opacity-90")}>
          Shoutr
        </Link>
      )}
    </span>
  )
}
