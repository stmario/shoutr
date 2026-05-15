import Image from "next/image"
import { cn } from "@/lib/utils"

export const LOGO_SIZES = [32, 48, 64, 96, 128, 192, 256, 512] as const
export type LogoSize = (typeof LOGO_SIZES)[number]

type ShoutrLogoProps = {
  className?: string
  /** CSS display size in pixels. Loads a sharper asset for retina when available. */
  size?: LogoSize
  iconClassName?: string
  showWordmark?: boolean
  wordmarkClassName?: string
  priority?: boolean
}

/** Pick the smallest generated asset that is >= target (keeps files sharp on retina). */
export function pickLogoAssetSize(displayPx: number, retina = true): LogoSize {
  const target = retina ? displayPx * 2 : displayPx
  return LOGO_SIZES.find((s) => s >= target) ?? 512
}

export function ShoutrLogo({
  className,
  size = 32,
  iconClassName,
  showWordmark = true,
  wordmarkClassName = "text-xl font-bold",
  priority = false,
}: ShoutrLogoProps) {
  const assetSize = pickLogoAssetSize(size)
  const png = `/logo/icon-${assetSize}.png`
  const webp = `/logo/icon-${assetSize}.webp`

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <picture>
        <source srcSet={webp} type="image/webp" />
        <Image
          src={png}
          alt="Shoutr"
          width={size}
          height={size}
          className={cn("shrink-0 object-contain", iconClassName)}
          style={iconClassName ? undefined : { width: size, height: size }}
          priority={priority}
          sizes={`${size}px`}
        />
      </picture>
      {showWordmark && <span className={wordmarkClassName}>Shoutr</span>}
    </span>
  )
}
