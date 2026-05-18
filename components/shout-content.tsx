import type { ReactNode } from "react"
import Link from "next/link"
import { ShoutEmbeddedImage } from "@/components/shout-embedded-image"
import { ShoutEmbed } from "@/components/shout-embed"
import {
  collectEmbedsFromText,
  collectPlainLinkPreviewUrls,
  isEmbeddableUrl,
  normalizeUrlToken,
  URL_IN_TEXT_RE,
} from "@/lib/embed-url"
import { MARKDOWN_IMAGE_RE } from "@/lib/shout-markdown"
import { HASHTAG_OR_MENTION_RE } from "@/lib/mentions"
import { LinkPreviewCard } from "@/components/link-preview-card"

type ShoutContentProps = {
  content: string
  className?: string
}

/** Text body with @mentions, hashtags, links, inline images, and video embeds (YouTube, Vimeo). */
export function ShoutContent({ content, className }: ShoutContentProps) {
  const embeds = collectEmbedsFromText(content)
  const linkPreviewUrls = collectPlainLinkPreviewUrls(content, 4)
  const parts: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of content.matchAll(MARKDOWN_IMAGE_RE)) {
    const index = match.index ?? 0
    const before = content.slice(lastIndex, index)
    if (before) {
      parts.push(...renderTextSegment(before, key))
      key += before.length
    }

    const alt = match[1] || "Embedded image"
    const url = match[2]
    parts.push(<ShoutEmbeddedImage key={`img-${key++}`} src={url} alt={alt} className="my-2" />)

    lastIndex = index + match[0].length
  }

  const tail = content.slice(lastIndex)
  if (tail) {
    parts.push(...renderTextSegment(tail, key))
  }

  if (parts.length === 0 && embeds.length === 0 && linkPreviewUrls.length === 0) {
    return <p className={className}>{content}</p>
  }

  return (
    <div className={className}>
      {parts.length > 0 ? <div className="whitespace-pre-wrap">{parts}</div> : null}
      {embeds.map((embed) => (
        <ShoutEmbed key={`${embed.provider}-${embed.id}`} embed={embed} />
      ))}
      {linkPreviewUrls.map((url) => (
        <LinkPreviewCard key={url} url={url} />
      ))}
    </div>
  )
}

function renderTextSegment(text: string, keyStart: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let k = keyStart

  const re = new RegExp(URL_IN_TEXT_RE.source, URL_IN_TEXT_RE.flags)
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0
    const rawUrl = match[0]

    if (index > last) {
      nodes.push(...renderTextWithEntities(text.slice(last, index), k))
      k += index - last
    }

    const url = normalizeUrlToken(rawUrl)
    if (!isEmbeddableUrl(url)) {
      nodes.push(
        <a
          key={`u-${k++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-700 hover:underline break-all"
        >
          {url}
        </a>,
      )
    }

    last = index + rawUrl.length
  }

  if (last < text.length) {
    nodes.push(...renderTextWithEntities(text.slice(last), k))
  }

  return nodes
}

function renderTextWithEntities(text: string, keyStart: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let k = keyStart

  const re = new RegExp(HASHTAG_OR_MENTION_RE.source, HASHTAG_OR_MENTION_RE.flags)
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0
    if (index > last) {
      nodes.push(<span key={`t-${k++}`}>{text.slice(last, index)}</span>)
    }
    const token = match[0]
    if (token.startsWith("#")) {
      nodes.push(
        <Link key={`h-${k++}`} href={`/hashtag/${token.substring(1)}`} className="text-purple-700 hover:underline">
          {token}
        </Link>,
      )
    } else {
      const username = token.slice(1)
      nodes.push(
        <Link
          key={`m-${k++}`}
          href={`/profile/${username}`}
          className="text-purple-700 hover:underline font-medium"
        >
          {token}
        </Link>,
      )
    }
    last = index + token.length
  }

  if (last < text.length) {
    nodes.push(<span key={`t-${k++}`}>{text.slice(last)}</span>)
  }

  return nodes
}
