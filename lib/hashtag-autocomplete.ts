export type ActiveHashtag = {
  /** Tag without # */
  query: string
  /** Start index of # in the full text */
  start: number
  /** End index (caret) */
  end: number
}

/** Hashtag being typed at the caret: `#` followed by optional word chars. */
export function getActiveHashtag(text: string, caret: number): ActiveHashtag | null {
  const before = text.slice(0, caret)
  const match = before.match(/#(\w*)$/)
  if (!match || match.index === undefined) return null
  return {
    query: match[1],
    start: match.index,
    end: caret,
  }
}

export function insertHashtag(
  text: string,
  hashtag: ActiveHashtag,
  name: string,
): { text: string; caret: number } {
  const before = text.slice(0, hashtag.start)
  const after = text.slice(hashtag.end)
  const token = `#${name} `
  const next = before + token + after
  return { text: next, caret: before.length + token.length }
}
