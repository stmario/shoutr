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
          CASE
            WHEN $2::integer IS NULL THEN false
            ELSE EXISTS(
              SELECT 1 FROM follows
              WHERE follower_id = $2 AND following_id = u.id
            )
          END
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
        u.wallet_address,
        s.like_count as vote_count,
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

export type FollowListUser = {
  id: number
  username: string
  bio: string | null
  avatar_url: string | null
  is_following: boolean
}

async function getProfileUserId(username: string): Promise<number | null> {
  const rows = await executeQuery(`SELECT id FROM users WHERE username = $1`, [username])
  return rows[0]?.id ?? null
}

export async function getFollowers(username: string, limit = 30, offset = 0): Promise<FollowListUser[]> {
  try {
    const profileId = await getProfileUserId(username)
    if (!profileId) return []

    const currentUser = await getCurrentUser()
    const viewerId = currentUser?.id ?? null

    const result = await executeQuery(
      `
      SELECT
        u.id,
        u.username,
        u.bio,
        u.avatar_url,
        CASE
          WHEN $4::integer IS NULL THEN false
          ELSE EXISTS(
            SELECT 1 FROM follows
            WHERE follower_id = $4 AND following_id = u.id
          )
        END AS is_following
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [profileId, limit, offset, viewerId],
    )

    return result as FollowListUser[]
  } catch (error) {
    console.error("Error fetching followers:", error)
    return []
  }
}

export async function getFollowing(username: string, limit = 30, offset = 0): Promise<FollowListUser[]> {
  try {
    const profileId = await getProfileUserId(username)
    if (!profileId) return []

    const currentUser = await getCurrentUser()
    const viewerId = currentUser?.id ?? null

    const result = await executeQuery(
      `
      SELECT
        u.id,
        u.username,
        u.bio,
        u.avatar_url,
        CASE
          WHEN $4::integer IS NULL THEN false
          ELSE EXISTS(
            SELECT 1 FROM follows
            WHERE follower_id = $4 AND following_id = u.id
          )
        END AS is_following
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [profileId, limit, offset, viewerId],
    )

    return result as FollowListUser[]
  } catch (error) {
    console.error("Error fetching following:", error)
    return []
  }
}
