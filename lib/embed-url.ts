export type EmbedProvider = "youtube" | "vimeo"

export type ParsedEmbed = {
  provider: EmbedProvider
  id: string
  embedUrl: string
  watchUrl: string
}

const TRAILING_URL_PUNCTUATION = /[.,;:!?)]+$/

/** Trim trailing punctuation often pasted with URLs. */
export function normalizeUrlToken(raw: string): string {
  return raw.replace(TRAILING_URL_PUNCTUATION, "")
}

export const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"')\]]+/gi

function parseYoutubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "")

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0]
    return id || null
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const path = url.pathname.replace(/\/$/, "") || "/"
    if (path === "/watch") {
      return url.searchParams.get("v")
    }
    const shorts = url.pathname.match(/^\/shorts\/([^/?#]+)/)
    if (shorts) return shorts[1]
    const embed = url.pathname.match(/^\/embed\/([^/?#]+)/)
    if (embed) return embed[1]
  }

  if (host === "youtube-nocookie.com") {
    const embed = url.pathname.match(/^\/embed\/([^/?#]+)/)
    if (embed) return embed[1]
  }

  return null
}

function parseVimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "")

  if (host === "vimeo.com") {
    const match = url.pathname.match(/^\/(\d+)/)
    return match?.[1] ?? null
  }

  if (host === "player.vimeo.com") {
    const match = url.pathname.match(/^\/video\/(\d+)/)
    return match?.[1] ?? null
  }

  return null
}

/** Map a public video URL to an embeddable player (YouTube, Vimeo). */
export function parseEmbedUrl(rawUrl: string): ParsedEmbed | null {
  const trimmed = normalizeUrlToken(rawUrl.trim())
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null

  const youtubeId = parseYoutubeId(url)
  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
    return {
      provider: "youtube",
      id: youtubeId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    }
  }

  const vimeoId = parseVimeoId(url)
  if (vimeoId && /^\d+$/.test(vimeoId)) {
    return {
      provider: "vimeo",
      id: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      watchUrl: `https://vimeo.com/${vimeoId}`,
    }
  }

  return null
}

/** Unique embeds found in text (first occurrence order). */
export function collectEmbedsFromText(text: string): ParsedEmbed[] {
  const seen = new Set<string>()
  const embeds: ParsedEmbed[] = []

  for (const match of text.matchAll(URL_IN_TEXT_RE)) {
    const parsed = parseEmbedUrl(match[0])
    if (!parsed) continue
    const key = `${parsed.provider}:${parsed.id}`
    if (seen.has(key)) continue
    seen.add(key)
    embeds.push(parsed)
  }

  return embeds
}

export function isEmbeddableUrl(rawUrl: string): boolean {
  return parseEmbedUrl(rawUrl) != null
}

/** Unique non-embed http(s) URLs for OG-style previews (max `max` URLs). */
export function collectPlainLinkPreviewUrls(text: string, max = 4): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const match of text.matchAll(URL_IN_TEXT_RE)) {
    const raw = match[0]
    const url = normalizeUrlToken(raw)
    if (isEmbeddableUrl(url)) continue

    let href: string
    try {
      const u = new URL(url)
      if (u.protocol !== "http:" && u.protocol !== "https:") continue
      href = u.href
    } catch {
      continue
    }

    if (seen.has(href)) continue
    seen.add(href)
    out.push(href)
    if (out.length >= max) break
  }

  return out
}
