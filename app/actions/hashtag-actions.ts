"use server"

import { db } from "@/lib/db"
import { hashtags, shoutHashtags } from "@/lib/schema"
import { eq, ilike, desc, sql, count } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"
import { normalizeHashtagName } from "@/lib/mentions"

export type HashtagOption = {
  name: string
  usage_count: number
}

/** Hashtag search for # autocomplete (trending when query is empty). */
export async function searchHashtags(query: string, limit = 8): Promise<HashtagOption[]> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return []

    const q = normalizeHashtagName(query)
    const capped = Math.min(Math.max(limit, 1), 12)

    if (!q) {
      const rows = await db
        .select({
          name: hashtags.name,
          usage_count: count(shoutHashtags.shout_id).as("usage_count"),
        })
        .from(hashtags)
        .innerJoin(shoutHashtags, eq(hashtags.id, shoutHashtags.hashtag_id))
        .groupBy(hashtags.id, hashtags.name)
        .orderBy(desc(sql`usage_count`), hashtags.name)
        .limit(capped)

      return rows.map((row) => ({
        name: row.name,
        usage_count: Number(row.usage_count ?? 0),
      }))
    }

    const prefix = `${q}%`
    const rows = await db
      .select({
        name: hashtags.name,
        usage_count: count(shoutHashtags.hashtag_id).as("usage_count"),
      })
      .from(hashtags)
      .leftJoin(shoutHashtags, eq(hashtags.id, shoutHashtags.hashtag_id))
      .where(ilike(hashtags.name, prefix))
      .groupBy(hashtags.id, hashtags.name)
      .orderBy(
        sql`CASE
          WHEN LOWER(${hashtags.name}) = LOWER(${q}) THEN 0
          WHEN LOWER(${hashtags.name}) LIKE LOWER(${prefix}) THEN 1
          ELSE 2
        END`,
        desc(sql`usage_count`),
        hashtags.name,
      )
      .limit(capped)

    return rows.map((row) => ({
      name: row.name,
      usage_count: Number(row.usage_count ?? 0),
    }))
  } catch (error) {
    console.error("searchHashtags:", error)
    return []
  }
}

/** Resolve a hashtag by name (case-insensitive). */
export async function getHashtagByName(name: string) {
  try {
    const normalized = normalizeHashtagName(name)
    if (!normalized) return null

    const [row] = await db
      .select({
        id: hashtags.id,
        name: hashtags.name,
      })
      .from(hashtags)
      .where(sql`LOWER(${hashtags.name}) = ${normalized}`)
      .limit(1)

    return row ?? null
  } catch (error) {
    console.error("getHashtagByName:", error)
    return null
  }
}
