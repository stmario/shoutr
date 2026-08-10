import type { Metadata } from "next"

export const SITE_URL = "https://www.shoutr.io"
export const SITE_NAME = "Shoutr"
export const DEFAULT_TITLE = "Shoutr — Self-governed crypto social"
export const DEFAULT_DESCRIPTION =
  "Wallet-native social on Ethereum. Sign in with your wallet, post shouts, and stake SHOT to weight likes and help the community govern the feed."

export function truncateText(text: string, maxLength: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength - 1).trim()}…`
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`
}

export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  imageUrl,
}: {
  title: string
  description: string
  path: string
  noIndex?: boolean
  imageUrl?: string | null
}): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = imageUrl?.startsWith("http") ? imageUrl : imageUrl ? `${SITE_URL}${imageUrl}` : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}
