"use server"

import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// Follow a user
export async function followUser(currentUserId: number, userId: number) {
  try {
    await db.execute(sql`
      INSERT INTO follows (follower_id, following_id)
      VALUES (${currentUserId}, ${userId})
      ON CONFLICT (follower_id, following_id) DO NOTHING
    `)

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { error: "Failed to follow user" }
  }
}

// Unfollow a user
export async function unfollowUser(currentUserId: number, userId: number) {
  try {
    await db.execute(sql`
      DELETE FROM follows
      WHERE follower_id = ${currentUserId} AND following_id = ${userId}
    `)

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { error: "Failed to unfollow user" }
  }
}
