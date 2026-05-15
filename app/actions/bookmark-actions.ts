"use server"

import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

export type BookmarkedShout = {
  id: number
  content: string
  created_at: string
  image_url: string | null
  user_id: number
  username: string
  avatar_url: string | null
  wallet_address: string | null
  vote_count: string
  comments_count: number
  reshouts_count: number
  bookmarked_at: string
}

function normalizeBookmarkedRow(row: Record<string, unknown>): BookmarkedShout {
  return {
    id: Number(row.id),
    content: String(row.content ?? ""),
    created_at: String(row.created_at),
    image_url: row.image_url != null ? String(row.image_url) : null,
    user_id: Number(row.user_id),
    username: String(row.username),
    avatar_url: row.avatar_url != null ? String(row.avatar_url) : null,
    wallet_address: row.wallet_address != null ? String(row.wallet_address) : null,
    vote_count: String(row.vote_count ?? "0"),
    comments_count: Number(row.comments_count ?? 0),
    reshouts_count: Number(row.reshouts_count ?? 0),
    bookmarked_at: String(row.bookmarked_at),
  }
}

function revalidateBookmarkPaths() {
  revalidatePath("/bookmarks")
  revalidatePath("/")
}

export async function addBookmark(shoutId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to bookmark shouts" }
    }

    const shout = await executeQuery(`SELECT id FROM shouts WHERE id = $1`, [shoutId])
    if (shout.length === 0) {
      return { success: false, message: "Shout not found" }
    }

    await executeQuery(
      `
      INSERT INTO bookmarks (user_id, shout_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, shout_id) DO NOTHING
      `,
      [currentUser.id, shoutId],
    )

    revalidateBookmarkPaths()
    return { success: true }
  } catch (error) {
    console.error("Error adding bookmark:", error)
    return { success: false, message: "Failed to bookmark shout" }
  }
}

export async function removeBookmark(shoutId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to remove bookmarks" }
    }

    await executeQuery(
      `DELETE FROM bookmarks WHERE user_id = $1 AND shout_id = $2`,
      [currentUser.id, shoutId],
    )

    revalidateBookmarkPaths()
    return { success: true }
  } catch (error) {
    console.error("Error removing bookmark:", error)
    return { success: false, message: "Failed to remove bookmark" }
  }
}

export async function isBookmarked(shoutId: number): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return false
    }

    const result = await executeQuery(
      `SELECT 1 FROM bookmarks WHERE user_id = $1 AND shout_id = $2 LIMIT 1`,
      [currentUser.id, shoutId],
    )

    return result.length > 0
  } catch (error) {
    console.error("Error checking bookmark status:", error)
    return false
  }
}

export async function getBookmarkedShouts(limit = 20, offset = 0): Promise<BookmarkedShout[]> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return []
    }

    const result = await executeQuery(
      `
      SELECT
        s.id,
        s.content,
        s.created_at,
        s.image_url,
        s.user_id,
        s.like_count::text AS vote_count,
        u.username,
        u.avatar_url,
        u.wallet_address,
        b.created_at AS bookmarked_at,
        (SELECT COUNT(*)::int FROM comments WHERE shout_id = s.id) AS comments_count,
        (SELECT COUNT(*)::int FROM reshouts WHERE shout_id = s.id) AS reshouts_count
      FROM bookmarks b
      INNER JOIN shouts s ON b.shout_id = s.id
      INNER JOIN users u ON s.user_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [currentUser.id, limit, offset],
    )

    return result.map((row) => normalizeBookmarkedRow(row as Record<string, unknown>))
  } catch (error) {
    console.error("Error fetching bookmarked shouts:", error)
    return []
  }
}

export async function getBookmarkCount(): Promise<number> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return 0

    const result = await executeQuery(
      `SELECT COUNT(*)::int AS count FROM bookmarks WHERE user_id = $1`,
      [currentUser.id],
    )
    return Number(result[0]?.count ?? 0)
  } catch {
    return 0
  }
}
