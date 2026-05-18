"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type PreviewState =
  | { status: "idle" | "loading" }
  | {
      status: "ok"
      title: string | null
      description: string | null
      image: string | null
      siteName: string | null
      resolvedUrl: string
    }
  | { status: "error"; message: string }

type LinkPreviewCardProps = {
  url: string
  className?: string
}

export function LinkPreviewCard({ url, className }: LinkPreviewCardProps) {
  const [state, setState] = useState<PreviewState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })

    const run = async () => {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        const data = (await res.json()) as Record<string, unknown>
        if (cancelled) return
        if (!res.ok) {
          setState({
            status: "error",
            message: typeof data.error === "string" ? data.error : "Preview unavailable",
          })
          return
        }
        setState({
          status: "ok",
          title: typeof data.title === "string" ? data.title : null,
          description: typeof data.description === "string" ? data.description : null,
          image: typeof data.image === "string" ? data.image : null,
          siteName: typeof data.siteName === "string" ? data.siteName : null,
          resolvedUrl: typeof data.url === "string" ? data.url : url,
        })
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Preview unavailable" })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [url])

  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "")
    } catch {
      return url
    }
  })()

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div
        className={cn(
          "mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>Loading preview…</span>
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "mt-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm hover:bg-muted/50 transition-colors",
          className,
        )}
      >
        <span className="truncate text-purple-700">{url}</span>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    )
  }

  const title = state.title?.trim() || state.siteName?.trim() || host
  const subtitle = state.siteName && state.title?.trim() ? state.siteName : host

  return (
    <Link
      href={state.resolvedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-3 flex overflow-hidden rounded-lg border border-border bg-muted/20 text-left hover:bg-muted/40 transition-colors",
        className,
      )}
    >
      {state.image ? (
        <div className="relative h-24 w-28 shrink-0 border-r border-border bg-muted">
          <Image
            src={state.image}
            alt=""
            fill
            className="object-cover"
            sizes="112px"
            unoptimized
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p>
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        {state.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{state.description}</p>
        ) : null}
      </div>
    </Link>
  )
}
