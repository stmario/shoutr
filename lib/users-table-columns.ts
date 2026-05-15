import { executeQuery } from "./db"

let usersColumnCache: Set<string> | null = null

/** Cached column names for `public.users` (Neon schema may lag behind Drizzle). */
export async function getUsersTableColumns(): Promise<Set<string>> {
  if (usersColumnCache) return usersColumnCache

  const rows = (await executeQuery(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`,
  )) as { column_name: string }[]

  usersColumnCache = new Set(rows.map((r) => r.column_name))
  return usersColumnCache
}

export function pickExistingColumns(columns: Set<string>, names: string[]): string[] {
  return names.filter((name) => columns.has(name))
}
