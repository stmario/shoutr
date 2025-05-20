"use server"

import { db } from "@/lib/db"
import { bookmarks, shouts } from "@/lib/schema"
import { eq, and, desc, sql } from "drizzle-orm"
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

    const result = await db
      .select({
        id: shouts.id,
        content: shouts.content,
        created_at: shouts.created_at,
        image_url: shouts.image_url,
        user_id: shouts.user_id,
        username: sql<string>`users.username`,
        display_name: sql<string>`users.display_name`,
        avatar_url: sql<string>`users.avatar_url`,
        bookmarked_at: bookmarks.created_at,
        likes_count: sql<number>`(SELECT COUNT(*) FROM likes WHERE shout_id = ${shouts.id})`,
        comments_count: sql<number>`(SELECT COUNT(*) FROM comments WHERE shout_id = ${shouts.id})`,
        reshouts_count: sql<number>`(SELECT COUNT(*) FROM reshouts WHERE shout_id = ${shouts.id})`,
      })
      .from(bookmarks)
      .innerJoin(shouts, eq(bookmarks.shout_id, shouts.id))
      .innerJoin("users", eq(shouts.user_id, sql`users.id`))
      .where(eq(bookmarks.user_id, currentUser.id))
      .orderBy(desc(bookmarks.created_at))
      .limit(limit)
      .offset(offset)

    return result
  } catch (error) {
    console.error("Error fetching bookmarked shouts:", error)
    return []
  }
}
