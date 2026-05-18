"use server"

import { executeQuery } from "@/lib/db"
import { formatLikeWeightShot } from "@/lib/like-weight"
import { refreshUserEnsVerified } from "@/lib/ens-verified"
import { getStakedBalance } from "@/lib/staking-read"
import { getCurrentUser } from "./auth"
import { areUsersBlockedPair } from "./block-actions"
import { getUsersTableColumns } from "@/lib/users-table-columns"

export type ProfileUser = {
  id: number
  username: string
  bio: string | null
  location: string | null
  website: string | null
  avatar_url: string | null
  wallet_address: string | null
  created_at: string
  followers_count: number
  following_count: number
  shouts_count: number
  is_following: boolean
  is_verified: boolean
  /** Current viewer has blocked this profile user. */
  viewer_has_blocked: boolean
  /** This profile user has blocked the current viewer. */
  profile_blocked_viewer: boolean
}

/** ENS verified for display (DB flag or live reverse-ENS match). */
export async function resolveProfileEnsVerified(profile: ProfileUser): Promise<boolean> {
  if (profile.is_verified) return true
  if (!profile.wallet_address) return false
  const { isUsernameEnsVerified } = await import("@/lib/ens-verified")
  return isUsernameEnsVerified(profile.username, profile.wallet_address)
}

/** Re-check ENS on own profile and persist when the cached flag is stale. */
export async function syncProfileEnsVerified(
  profile: ProfileUser,
  viewerUserId: number | null,
): Promise<ProfileUser> {
  const verified = await resolveProfileEnsVerified(profile)

  if (viewerUserId === profile.id && profile.wallet_address && verified !== profile.is_verified) {
    await refreshUserEnsVerified(profile.id, profile.username, profile.wallet_address).catch(() => undefined)
  }

  return { ...profile, is_verified: verified }
}

/** Live staked SHOT for a profile wallet (e.g. "1,250 SHOT"). */
export async function getProfileStakedShot(walletAddress: string | null): Promise<string | null> {
  if (!walletAddress) return null

  try {
    const staked = await getStakedBalance(walletAddress)
    return formatLikeWeightShot(staked.amount, staked.decimals)
  } catch (error) {
    console.error("Profile staked balance read failed:", error)
    return null
  }
}

function optionalText(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s.length > 0 ? s : null
}

export async function getUserProfile(username: string): Promise<ProfileUser | null> {
  try {
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || null
    const columns = await getUsersTableColumns()
    const locationCol = columns.has("location") ? "u.location," : "NULL::text AS location,"
    const websiteCol = columns.has("website") ? "u.website," : "NULL::text AS website,"

    const result = await executeQuery(
      `
      SELECT 
        u.id, 
        u.username, 
        u.bio, 
        ${locationCol}
        ${websiteCol}
        u.avatar_url,
        u.wallet_address,
        COALESCE(u.is_verified, false) as is_verified,
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
        ) as is_following,
        (
          CASE
            WHEN $2::integer IS NULL THEN false
            ELSE EXISTS(
              SELECT 1 FROM user_blocks WHERE blocker_id = $2 AND blocked_id = u.id
            )
          END
        ) as viewer_has_blocked,
        (
          CASE
            WHEN $2::integer IS NULL THEN false
            ELSE EXISTS(
              SELECT 1 FROM user_blocks WHERE blocker_id = u.id AND blocked_id = $2
            )
          END
        ) as profile_blocked_viewer
      FROM users u
      WHERE u.username = $1
    `,
      [username, currentUserId],
    )

    if (result.length === 0) {
      return null
    }

    const row = result[0] as Record<string, unknown>
    const bool = (v: unknown) => v === true || v === "t" || v === "true"
    return {
      ...(row as ProfileUser),
      bio: optionalText(row.bio),
      location: optionalText(row.location),
      website: optionalText(row.website),
      is_verified: bool(row.is_verified),
      viewer_has_blocked: bool(row.viewer_has_blocked),
      profile_blocked_viewer: bool(row.profile_blocked_viewer),
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function getUserReshouts(
  userId: number,
  limit = 10,
  offset = 0,
  viewerUserId?: number | null,
) {
  try {
    if (viewerUserId != null && viewerUserId !== userId) {
      if (await areUsersBlockedPair(viewerUserId, userId)) {
        return []
      }
    }

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
        s.like_count::text as vote_count,
        (SELECT COUNT(*)::int FROM comments WHERE shout_id = s.id) as comments_count,
        (SELECT COUNT(*)::int FROM reshouts WHERE shout_id = s.id) as reshouts_count,
        r.created_at as reshouted_at
      FROM reshouts r
      JOIN shouts s ON r.shout_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [userId, limit, offset],
    )

    return result
  } catch (error) {
    console.error("Error fetching user reshouts:", error)
    return []
  }
}

export async function getUserShouts(
  userId: number,
  limit = 10,
  offset = 0,
  viewerUserId?: number | null,
) {
  try {
    if (viewerUserId != null && viewerUserId !== userId) {
      if (await areUsersBlockedPair(viewerUserId, userId)) {
        return []
      }
    }

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
        COALESCE(u.is_verified, false) as author_is_verified,
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

/** Shouts this user has liked (for profile Likes tab). */
export async function getUserLikedShouts(
  userId: number,
  limit = 10,
  offset = 0,
  viewerUserId?: number | null,
) {
  try {
    if (viewerUserId != null && viewerUserId !== userId) {
      if (await areUsersBlockedPair(viewerUserId, userId)) {
        return []
      }
    }

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
        COALESCE(u.is_verified, false) as author_is_verified,
        s.like_count::text as vote_count,
        (SELECT COUNT(*)::int FROM comments WHERE shout_id = s.id) as comments_count,
        (SELECT COUNT(*)::int FROM reshouts WHERE shout_id = s.id) as reshouts_count
      FROM likes l
      JOIN shouts s ON l.shout_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE l.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [userId, limit, offset],
    )

    return result
  } catch (error) {
    console.error("Error fetching liked shouts:", error)
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
