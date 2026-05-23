/** @username tokens in shout/comment text (same word chars as hashtags). */
export const MENTION_TOKEN_RE = /@(\w+)/g

/** #hashtag tokens in shout/comment text. */
export const HASHTAG_TOKEN_RE = /#(\w+)/g

/** Canonical hashtag name for storage and URLs (lowercase, no leading #). */
export function normalizeHashtagName(raw: string): string {
  return raw.trim().replace(/^#+/, "").toLowerCase()
}

/** Extract unique hashtag names (normalized) from text. */
export function extractHashtagNames(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const re = new RegExp(HASHTAG_TOKEN_RE.source, HASHTAG_TOKEN_RE.flags)
  for (const match of text.matchAll(re)) {
    const name = normalizeHashtagName(match[1] ?? "")
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

/** Extract unique mention handles (without @), lowercased for lookup. */
export function extractMentionUsernames(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const re = new RegExp(MENTION_TOKEN_RE.source, MENTION_TOKEN_RE.flags)
  for (const match of text.matchAll(re)) {
    const name = (match[1] ?? "").toLowerCase()
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

/** Hashtags and @mentions in plain text segments (not inside markdown image syntax). */
export const HASHTAG_OR_MENTION_RE = /(#\w+|@\w+)/g
