export type ActiveMention = {
  /** Handle without @ */
  query: string
  /** Start index of @ in the full text */
  start: number
  /** End index (caret) */
  end: number
}

/** Mention being typed at the caret: `@` followed by optional word chars. */
export function getActiveMention(text: string, caret: number): ActiveMention | null {
  const before = text.slice(0, caret)
  const match = before.match(/@(\w*)$/)
  if (!match || match.index === undefined) return null
  return {
    query: match[1],
    start: match.index,
    end: caret,
  }
}

export function insertMention(
  text: string,
  mention: ActiveMention,
  username: string,
): { text: string; caret: number } {
  const before = text.slice(0, mention.start)
  const after = text.slice(mention.end)
  const token = `@${username} `
  const next = before + token + after
  return { text: next, caret: before.length + token.length }
}
