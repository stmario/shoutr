/** Extract Open Graph / basic HTML metadata for link previews (server-side). */

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
}

function metaContent(html: string, propertyOrName: string): string | null {
  const esc = propertyOrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`,
      "i",
    ),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return decodeHtmlEntities(m[1].trim())
  }
  return null
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{1,500})<\/title>/i)
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : null
}

export type LinkPreviewMeta = {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

export function extractLinkPreviewMeta(html: string, pageUrl: string): LinkPreviewMeta {
  const title =
    metaContent(html, "og:title") ||
    metaContent(html, "twitter:title") ||
    titleTag(html)

  const description =
    metaContent(html, "og:description") ||
    metaContent(html, "description") ||
    metaContent(html, "twitter:description")

  let image =
    metaContent(html, "og:image") ||
    metaContent(html, "og:image:url") ||
    metaContent(html, "twitter:image") ||
    metaContent(html, "twitter:image:src")

  if (image) {
    try {
      image = new URL(image, pageUrl).href
    } catch {
      image = null
    }
  }

  const siteName = metaContent(html, "og:site_name")

  return {
    url: pageUrl,
    title: title || null,
    description: description || null,
    image,
    siteName: siteName || null,
  }
}
