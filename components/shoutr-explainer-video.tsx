import { cn } from "@/lib/utils"

const EXPLAINER_YOUTUBE_ID = "KlZxvl0LXFc"
const EXPLAINER_WATCH_URL = `https://www.youtube.com/watch?v=${EXPLAINER_YOUTUBE_ID}`
const EXPLAINER_EMBED_URL = `https://www.youtube.com/embed/${EXPLAINER_YOUTUBE_ID}`

type ShoutrExplainerVideoProps = {
  className?: string
  title?: string
  description?: string
  /** Inside another card — no outer border or duplicate heading. */
  embedded?: boolean
}

export function ShoutrExplainerVideo({
  className,
  title = "How Shoutr works",
  description = "A quick overview of shouts, staking-weighted likes, and wallet sign-in.",
  embedded = false,
}: ShoutrExplainerVideoProps) {
  const video = (
    <div className="relative w-full aspect-video bg-black">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={EXPLAINER_EMBED_URL}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <p className="sr-only">
        <a href={EXPLAINER_WATCH_URL}>Watch the Shoutr explainer on YouTube</a>
      </p>
    </div>
  )

  if (embedded) {
    return (
      <div className={cn("overflow-hidden rounded-lg border bg-muted/30", className)}>
        {video}
      </div>
    )
  }

  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {video}
    </section>
  )
}
