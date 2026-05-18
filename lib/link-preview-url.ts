/** Basic SSRF guard for server-side link preview fetches. */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "metadata",
])

export function isBlockedLinkPreviewHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "")
  if (BLOCKED_HOSTNAMES.has(h)) return true
  if (h.endsWith(".localhost")) return true
  if (h === "169.254.169.254" || h.startsWith("169.254.")) return true
  if (h.startsWith("10.")) return true
  if (h.startsWith("192.168.")) return true
  const m = /^172\.(\d+)\./.exec(h)
  if (m) {
    const n = Number(m[1])
    if (n >= 16 && n <= 31) return true
  }
  if (h.startsWith("127.")) return true
  if (h.startsWith("0.")) return true
  if (h.startsWith("100.64.") || h.startsWith("100.65.") || h.startsWith("100.66.")) return true
  if (/^100\.(12[89]|1[3-9]\d|2\d\d)\./.test(h)) return true
  return false
}

export function assertSafeLinkPreviewUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new Error("Invalid URL")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed")
  }
  if (isBlockedLinkPreviewHost(url.hostname)) {
    throw new Error("URL not allowed")
  }
  if (url.username || url.password) {
    throw new Error("URL must not include credentials")
  }
  return url
}
