"use client"

import { ShoutEmbed } from "@/components/shout-embed"
import { ShoutEmbeddedImage } from "@/components/shout-embedded-image"
import { LinkPreviewCard } from "@/components/link-preview-card"
import { collectEmbedsFromText, collectPlainLinkPreviewUrls } from "@/lib/embed-url"
import { collectMarkdownInlineImages } from "@/lib/shout-markdown"

type ShoutDraftRichPreviewProps = {
  content: string
}

/** Embeds, link previews, and markdown images for the compose box (no duplicate body text). */
export function ShoutDraftRichPreview({ content }: ShoutDraftRichPreviewProps) {
  const embeds = collectEmbedsFromText(content)
  const linkUrls = collectPlainLinkPreviewUrls(content, 4)
  const mdImages = collectMarkdownInlineImages(content)

  if (embeds.length === 0 && linkUrls.length === 0 && mdImages.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/25 px-3 py-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
      <div className="space-y-2">
        {mdImages.map((img, i) => (
          <ShoutEmbeddedImage key={`md-${i}-${img.url}`} src={img.url} alt={img.alt} className="my-0" />
        ))}
        {embeds.map((embed) => (
          <ShoutEmbed key={`${embed.provider}-${embed.id}`} embed={embed} />
        ))}
        {linkUrls.map((url) => (
          <LinkPreviewCard key={url} url={url} className="mt-0" />
        ))}
      </div>
    </div>
  )
}
