import { executeQuery } from "./db"
import { filterSafePgIdentifiers, isSafePgIdentifier } from "./sql-identifiers"

let usersColumnCache: Set<string> | null = null

/** Cached column names for `public.users` (Neon schema may lag behind Drizzle). */
export async function getUsersTableColumns(): Promise<Set<string>> {
  if (usersColumnCache) return usersColumnCache

  const rows = (await executeQuery(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`,
  )) as { column_name: string }[]

  const safe = filterSafePgIdentifiers(rows.map((r) => r.column_name))
  usersColumnCache = new Set(safe)
  return usersColumnCache
}

export function pickExistingColumns(columns: Set<string>, names: string[]): string[] {
  for (const name of names) {
    if (!isSafePgIdentifier(name)) {
      throw new Error("pickExistingColumns: invalid column name in allowlist")
    }
  }
  return names.filter((name) => columns.has(name))
}
