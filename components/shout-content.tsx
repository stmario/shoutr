import type { ReactNode } from "react"
import Link from "next/link"
import { ShoutEmbeddedImage } from "@/components/shout-embedded-image"

const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g
const HASHTAG_RE = /(#\w+)/g

type ShoutContentProps = {
  content: string
  className?: string
}

/** Text body with hashtag links and inline markdown images `![alt](url)`. */
export function ShoutContent({ content, className }: ShoutContentProps) {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of content.matchAll(MARKDOWN_IMAGE_RE)) {
    const index = match.index ?? 0
    const before = content.slice(lastIndex, index)
    if (before) {
      parts.push(...renderTextWithHashtags(before, key))
      key += before.length
    }

    const alt = match[1] || "Embedded image"
    const url = match[2]
    parts.push(<ShoutEmbeddedImage key={`img-${key++}`} src={url} alt={alt} className="my-2" />)

    lastIndex = index + match[0].length
  }

  const tail = content.slice(lastIndex)
  if (tail) {
    parts.push(...renderTextWithHashtags(tail, key))
  }

  if (parts.length === 0) {
    return <p className={className}>{content}</p>
  }

  return <div className={className}>{parts}</div>
}

function renderTextWithHashtags(text: string, keyStart: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let k = keyStart

  for (const match of text.matchAll(HASHTAG_RE)) {
    const index = match.index ?? 0
    if (index > last) {
      nodes.push(<span key={`t-${k++}`}>{text.slice(last, index)}</span>)
    }
    const tag = match[1]
    nodes.push(
      <Link key={`h-${k++}`} href={`/hashtag/${tag.substring(1)}`} className="text-purple-700 hover:underline">
        {tag}
      </Link>,
    )
    last = index + tag.length
  }

  if (last < text.length) {
    nodes.push(<span key={`t-${k++}`}>{text.slice(last)}</span>)
  }

  return nodes
}
