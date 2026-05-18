/**
 * PostgreSQL identifier safety for dynamic SQL fragments (column lists, RETURNING, etc.).
 * Values must always use $1, $2, … placeholders — never interpolate user input into the query string.
 */

const PG_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** Max length for unquoted PostgreSQL identifiers. */
const MAX_IDENT_LEN = 63

export function isSafePgIdentifier(name: string): boolean {
  if (typeof name !== "string" || name.length === 0 || name.length > MAX_IDENT_LEN) return false
  return PG_IDENTIFIER_RE.test(name)
}

/** Throws if the name is not a safe unquoted PostgreSQL identifier. */
export function assertSafePgIdentifier(name: string, context?: string): string {
  if (!isSafePgIdentifier(name)) {
    const hint = context ? ` (${context})` : ""
    throw new Error(`Unsafe SQL identifier${hint}`)
  }
  return name
}

/** Join validated identifiers for RETURNING / column lists (comma-separated). */
export function joinSafePgIdentifiers(names: readonly string[]): string {
  if (names.length === 0) return ""
  return names.map((n) => assertSafePgIdentifier(n)).join(", ")
}

/** Filter to identifiers that are safe and optionally present in an allowlist. */
export function filterSafePgIdentifiers(
  names: readonly string[],
  allowlist?: ReadonlySet<string>,
): string[] {
  const out: string[] = []
  for (const name of names) {
    if (!isSafePgIdentifier(name)) continue
    if (allowlist && !allowlist.has(name)) continue
    out.push(name)
  }
  return out
}
