"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type ShoutEmbeddedImageProps = {
  src: string
  alt?: string
  className?: string
}

/** Renders an image embedded in a shout (attachment or inline). */
export function ShoutEmbeddedImage({ src, alt = "Shout image", className }: ShoutEmbeddedImageProps) {
  if (!src) return null

  return (
    <div className={cn("mt-3 rounded-lg overflow-hidden border border-border bg-muted/30", className)}>
      <div className="relative w-full max-h-96 min-h-[120px]">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={675}
          className="w-full h-auto max-h-96 object-contain"
          unoptimized
        />
      </div>
    </div>
  )
}

