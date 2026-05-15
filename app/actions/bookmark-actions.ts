"use server"

import { db, executeQuery } from "@/lib/db"
import { bookmarks, shouts } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

// Add a shout to bookmarks
export async function addBookmark(shoutId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to bookmark shouts" }
    }

    await db.insert(bookmarks).values({ user_id: currentUser.id, shout_id: shoutId }).onConflictDoNothing()

    revalidatePath("/bookmarks")
    return { success: true }
  } catch (error) {
    console.error("Error adding bookmark:", error)
    return { success: false, message: "Failed to bookmark shout" }
  }
}

// Remove a shout from bookmarks
export async function removeBookmark(shoutId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to remove bookmarks" }
    }

    await db.delete(bookmarks).where(and(eq(bookmarks.user_id, currentUser.id), eq(bookmarks.shout_id, shoutId)))

    revalidatePath("/bookmarks")
    return { success: true }
  } catch (error) {
    console.error("Error removing bookmark:", error)
    return { success: false, message: "Failed to remove bookmark" }
  }
}

// Check if a shout is bookmarked by the current user
export async function isBookmarked(shoutId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return false
    }

    const result = await db
      .select({ id: bookmarks.user_id })
      .from(bookmarks)
      .where(and(eq(bookmarks.user_id, currentUser.id), eq(bookmarks.shout_id, shoutId)))

    return result.length > 0
  } catch (error) {
    console.error("Error checking bookmark status:", error)
    return false
  }
}

// Get all bookmarked shouts for the current user
export async function getBookmarkedShouts(limit = 20, offset = 0) {
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
        s.like_count AS vote_count,
        u.username,
        u.avatar_url,
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

    return result
  } catch (error) {
    console.error("Error fetching bookmarked shouts:", error)
    return []
  }
}
