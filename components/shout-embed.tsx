import Link from "next/link"
import type { ParsedEmbed } from "@/lib/embed-url"
import { cn } from "@/lib/utils"

type ShoutEmbedProps = {
  embed: ParsedEmbed
  className?: string
}

const PROVIDER_LABEL: Record<ParsedEmbed["provider"], string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
}

export function ShoutEmbed({ embed, className }: ShoutEmbedProps) {
  const label = PROVIDER_LABEL[embed.provider]
  const thumbUrl =
    embed.provider === "youtube"
      ? `https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg`
      : null

  return (
    <div className={cn("mt-3 rounded-lg overflow-hidden border border-border bg-muted/30", className)}>
      <div className="flex gap-3 border-b border-border bg-muted/40 px-3 py-2">
        {thumbUrl ? (
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded bg-black text-xs font-medium text-white">
            Vimeo
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <p className="text-sm font-medium text-foreground">{label} video</p>
          <Link
            href={embed.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs text-purple-700 hover:underline"
          >
            {embed.watchUrl}
          </Link>
        </div>
      </div>
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={embed.embedUrl}
          title={`${label} video`}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
        <Link
          href={embed.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          Open on {label}
        </Link>
      </div>
    </div>
  )
}
