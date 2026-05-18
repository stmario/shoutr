import { NextResponse } from "next/server"
import { assertSafeLinkPreviewUrl } from "@/lib/link-preview-url"
import { extractLinkPreviewMeta } from "@/lib/link-preview-meta"

const MAX_BYTES = 600_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get("url")
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  let target: URL
  try {
    target = assertSafeLinkPreviewUrl(raw)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid URL"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(target.href, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "ShoutrLinkPreview/1.0",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed (${res.status})`, url: target.href },
        { status: 502 },
      )
    }

    const ct = res.headers.get("content-type") || ""
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      return NextResponse.json({
        url: target.href,
        title: null,
        description: null,
        image: null,
        siteName: target.hostname.replace(/^www\./, ""),
      })
    }

    const buf = await res.arrayBuffer()
    const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf
    const html = new TextDecoder("utf-8", { fatal: false }).decode(slice)

    const meta = extractLinkPreviewMeta(html, res.url || target.href)
    return NextResponse.json(meta)
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError"
    return NextResponse.json(
      { error: aborted ? "Request timed out" : "Preview failed", url: target.href },
      { status: 504 },
    )
  } finally {
    clearTimeout(timeout)
  }
}
