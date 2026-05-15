"use server"

import { executeQuery } from "@/lib/db"
import { getCurrentUser } from "./auth"

export type ProfileUser = {
  id: number
  username: string
  bio: string | null
  avatar_url: string | null
  created_at: string
  followers_count: number
  following_count: number
  shouts_count: number
  is_following: boolean
}

export async function getUserProfile(username: string): Promise<ProfileUser | null> {
  try {
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || null

    const result = await executeQuery(
      `
      SELECT 
        u.id, 
        u.username, 
        u.bio, 
        u.avatar_url, 
        u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM shouts WHERE user_id = u.id) as shouts_count,
        (
          SELECT EXISTS(
            SELECT 1 FROM follows 
            WHERE follower_id = $2 AND following_id = u.id
          )
        ) as is_following
      FROM users u
      WHERE u.username = $1
    `,
      [username, currentUserId],
    )

    if (result.length === 0) {
      return null
    }

    return result[0] as ProfileUser
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function getUserShouts(userId: number, limit = 10, offset = 0) {
  try {
    const result = await executeQuery(
      `
      SELECT 
        s.id, 
        s.content, 
        s.created_at, 
        s.image_url,
        s.user_id,
        u.username,
        u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE shout_id = s.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE shout_id = s.id) as comments_count,
        (SELECT COUNT(*) FROM reshouts WHERE shout_id = s.id) as reshouts_count
      FROM shouts s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [userId, limit, offset],
    )

    return result
  } catch (error) {
    console.error("Error fetching user shouts:", error)
    return []
  }
}

export async function followUser(followingId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { error: "You must be logged in to follow users" }
    }

    await executeQuery(
      `
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT (follower_id, following_id) DO NOTHING
    `,
      [currentUser.id, followingId],
    )

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { error: "Failed to follow user" }
  }
}

export async function unfollowUser(followingId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { error: "You must be logged in to unfollow users" }
    }

    await executeQuery(
      `
      DELETE FROM follows
      WHERE follower_id = $1 AND following_id = $2
    `,
      [currentUser.id, followingId],
    )

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { error: "Failed to unfollow user" }
  }
}
