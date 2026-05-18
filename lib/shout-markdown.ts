/** Inline markdown images in shout text: `![alt](https://...)`. */
export const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g

export function collectMarkdownInlineImages(text: string): { alt: string; url: string }[] {
  const out: { alt: string; url: string }[] = []
  const re = new RegExp(MARKDOWN_IMAGE_RE.source, MARKDOWN_IMAGE_RE.flags)
  for (const m of text.matchAll(re)) {
    out.push({
      alt: (m[1] || "Embedded image").trim() || "Embedded image",
      url: m[2],
    })
  }
  return out
}
