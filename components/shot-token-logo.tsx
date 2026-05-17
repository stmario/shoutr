import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SHOT_COINMARKETCAP_URL, SHOT_TOKEN_LOGO_PATH } from "@/lib/shot-branding"

type ShotTokenLogoProps = {
  className?: string
  /** Display size in CSS pixels. */
  size?: number
  imageClassName?: string
  priority?: boolean
  /** When false, render the logo without linking to CoinMarketCap. */
  linkToCoinMarketCap?: boolean
}

export function ShotTokenLogo({
  className,
  size = 32,
  imageClassName,
  priority = false,
  linkToCoinMarketCap = true,
}: ShotTokenLogoProps) {
  const image = (
    <Image
      src={SHOT_TOKEN_LOGO_PATH}
      alt="SHOT token"
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", imageClassName)}
      style={imageClassName ? undefined : { width: size, height: size }}
      priority={priority}
      sizes={`${size}px`}
    />
  )

  if (!linkToCoinMarketCap) {
    return <span className={cn("inline-flex shrink-0", className)}>{image}</span>
  }

  return (
    <Link
      href={SHOT_COINMARKETCAP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex shrink-0 rounded-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      title="View SHOT on CoinMarketCap"
    >
      {image}
    </Link>
  )
}
