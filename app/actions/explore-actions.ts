"use server"

import { db } from "@/lib/db"
import { users, shouts, hashtags, shoutHashtags, follows, comments, reshouts } from "@/lib/schema"
import { normalizeHashtagName } from "@/lib/mentions"
import { eq, and, desc, count, sql, ilike, ne } from "drizzle-orm"
import { getCurrentUser } from "@/lib/auth"

export type SearchResult = {
  type: "user" | "shout" | "hashtag"
  id: number
  content?: string
  username?: string
  avatar_url?: string | null
  hashtag_name?: string
  created_at: string
  usage_count?: number
}

// Search for users, shouts, and hashtags
export async function search(
  query: string,
  limit = 20,
  offset = 0,
  type?: "user" | "shout" | "hashtag",
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  try {
    const normalizedQuery = query.trim().replace(/^@+/, "")
    if (!normalizedQuery) return []

    const searchTerm = `%${normalizedQuery}%`
    const prefixTerm = `${normalizedQuery}%`
    const currentUser = await getCurrentUser()
    let results: SearchResult[] = []

    // If type is specified, only search that type
    if (type === "user" || !type) {
      const usernameMatch = ilike(users.username, searchTerm)
      const blockUser = currentUser
        ? sql`NOT EXISTS (
            SELECT 1 FROM user_blocks ub
            WHERE (ub.blocker_id = ${currentUser.id} AND ub.blocked_id = ${users.id})
               OR (ub.blocker_id = ${users.id} AND ub.blocked_id = ${currentUser.id})
          )`
        : sql`true`
      const userWhere = currentUser
        ? and(usernameMatch, ne(users.id, currentUser.id), blockUser)
        : usernameMatch

      const userResults = await db
        .select({
          type: sql<"user">`'user'`,
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
          created_at: users.created_at,
        })
        .from(users)
        .where(userWhere)
        .orderBy(
          sql`CASE 
            WHEN LOWER(${users.username}) = LOWER(${normalizedQuery}) THEN 0
            WHEN ${users.username} ILIKE ${prefixTerm} THEN 1
            ELSE 2
          END`,
          users.username,
        )
        .limit(limit)
        .offset(offset)

      results = [...results, ...userResults]

      // Wallet prefix/exact match (e.g. holder_* usernames or 0x… lookup)
      if (/^0x[a-fA-F0-9]{4,}$/i.test(normalizedQuery)) {
        const walletMatch = ilike(users.wallet_address, `${normalizedQuery}%`)
        const walletWhere = currentUser
          ? and(walletMatch, ne(users.id, currentUser.id), blockUser)
          : walletMatch

        const walletUsers = await db
          .select({
            type: sql<"user">`'user'`,
            id: users.id,
            username: users.username,
            avatar_url: users.avatar_url,
            created_at: users.created_at,
          })
          .from(users)
          .where(walletWhere)
          .limit(limit)

        const seen = new Set(results.map((r) => r.id))
        for (const row of walletUsers) {
          if (!seen.has(row.id)) {
            results.push(row)
            seen.add(row.id)
          }
        }
      }
    }

    if (type === "shout" || !type) {
      const blockShoutAuthor = currentUser
        ? sql`NOT EXISTS (
            SELECT 1 FROM user_blocks ub
            WHERE (ub.blocker_id = ${currentUser.id} AND ub.blocked_id = ${users.id})
               OR (ub.blocker_id = ${users.id} AND ub.blocked_id = ${currentUser.id})
          )`
        : sql`true`
      const shoutResults = await db
        .select({
          type: sql<"shout">`'shout'`,
          id: shouts.id,
          content: shouts.content,
          created_at: shouts.created_at,
          username: users.username,
          avatar_url: users.avatar_url,
        })
        .from(shouts)
        .innerJoin(users, eq(shouts.user_id, users.id))
        .where(and(ilike(shouts.content, searchTerm), blockShoutAuthor))
        .orderBy(desc(shouts.created_at))
        .limit(limit)
        .offset(offset)

      results = [...results, ...shoutResults]
    }

    if (type === "hashtag" || !type) {
      // Search hashtags
      const hashtagResults = await db
        .select({
          type: sql<"hashtag">`'hashtag'`,
          id: hashtags.id,
          hashtag_name: hashtags.name,
          created_at: hashtags.created_at,
          usage_count: count(shoutHashtags.hashtag_id).as("usage_count"),
        })
        .from(hashtags)
        .leftJoin(shoutHashtags, eq(hashtags.id, shoutHashtags.hashtag_id))
        .where(ilike(hashtags.name, searchTerm))
        .groupBy(hashtags.id, hashtags.name, hashtags.created_at)
        .orderBy(
          sql`CASE 
            WHEN LOWER(${hashtags.name}) = LOWER(${query.trim().toLowerCase()}) THEN 0
            WHEN LOWER(${hashtags.name}) LIKE LOWER(${query.trim().toLowerCase() + "%"}) THEN 1
            ELSE 2
          END`,
          desc(sql`usage_count`),
        )
        .limit(limit)
        .offset(offset)

      results = [...results, ...hashtagResults]
    }

    // If searching all types, sort by relevance and recency
    if (!type) {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return results
  } catch (error) {
    console.error("Error searching:", error)
    return []
  }
}

// Get trending hashtags
export async function getTrendingHashtags(limit = 10) {
  try {
    const result = await db
      .select({
        id: hashtags.id,
        name: hashtags.name,
        usage_count: count(shoutHashtags.shout_id).as("usage_count"),
      })
      .from(hashtags)
      .innerJoin(shoutHashtags, eq(hashtags.id, shoutHashtags.hashtag_id))
      .innerJoin(shouts, eq(shoutHashtags.shout_id, shouts.id))
      .where(sql`${shouts.created_at} > NOW() - INTERVAL '7 days'`)
      .groupBy(hashtags.id, hashtags.name)
      .orderBy(desc(sql`usage_count`))
      .limit(limit)

    return result
  } catch (error) {
    console.error("Error fetching trending hashtags:", error)
    return []
  }
}

// Get shouts by hashtag with pagination
export async function getShoutsByHashtag(hashtagName: string, limit = 20, offset = 0) {
  try {
    const normalized = normalizeHashtagName(hashtagName)
    if (!normalized) return []

    const currentUser = await getCurrentUser()
    const blockAuthor = currentUser
      ? sql`NOT EXISTS (
          SELECT 1 FROM user_blocks ub
          WHERE (ub.blocker_id = ${currentUser.id} AND ub.blocked_id = ${shouts.user_id})
             OR (ub.blocker_id = ${shouts.user_id} AND ub.blocked_id = ${currentUser.id})
        )`
      : sql`true`

    const result = await db
      .select({
        id: shouts.id,
        content: shouts.content,
        created_at: shouts.created_at,
        image_url: shouts.image_url,
        user_id: shouts.user_id,
        username: users.username,
        avatar_url: users.avatar_url,
        vote_count: shouts.vote_count,
        comments_count: count(comments.shout_id).as("comments_count"),
        reshouts_count: count(reshouts.shout_id).as("reshouts_count"),
      })
      .from(shouts)
      .innerJoin(users, eq(shouts.user_id, users.id))
      .innerJoin(shoutHashtags, eq(shouts.id, shoutHashtags.shout_id))
      .innerJoin(hashtags, eq(shoutHashtags.hashtag_id, hashtags.id))
      .where(and(sql`LOWER(${hashtags.name}) = ${normalized}`, blockAuthor))
      .leftJoin(comments, eq(shouts.id, comments.shout_id))
      .leftJoin(reshouts, eq(shouts.id, reshouts.shout_id))
      .groupBy(
        shouts.id,
        shouts.content,
        shouts.created_at,
        shouts.image_url,
        shouts.user_id,
        shouts.vote_count,
        users.username,
        users.avatar_url,
      )
      .orderBy(desc(shouts.created_at))
      .limit(limit)
      .offset(offset)

    return result
  } catch (error) {
    console.error("Error fetching shouts by hashtag:", error)
    return []
  }
}

// Get suggested users to follow
export async function getSuggestedUsers(limit = 5) {
  try {
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || 0

    // Get users with most followers who the current user is not following
    const blockSuggested = currentUserId
      ? sql`NOT EXISTS (
          SELECT 1 FROM user_blocks ub
          WHERE (ub.blocker_id = ${currentUserId} AND ub.blocked_id = ${users.id})
             OR (ub.blocker_id = ${users.id} AND ub.blocked_id = ${currentUserId})
        )`
      : sql`true`

    const result = await db
      .select({
        id: users.id,
        username: users.username,
        avatar_url: users.avatar_url,
        is_verified: users.is_verified,
        followers_count: count(follows.follower_id).as("followers_count"),
      })
      .from(users)
      .leftJoin(follows, eq(users.id, follows.following_id))
      .where(
        and(
          sql`${users.id} != ${currentUserId}`,
          sql`NOT EXISTS (
            SELECT 1 FROM follows 
            WHERE follower_id = ${currentUserId} AND following_id = ${users.id}
          )`,
          blockSuggested,
        ),
      )
      .groupBy(users.id, users.username, users.avatar_url, users.is_verified)
      .orderBy(desc(sql`followers_count`))
      .limit(limit)

    return result
  } catch (error) {
    console.error("Error fetching suggested users:", error)
    return []
  }
}

// Get recent shouts with popular hashtags
export async function getRecentPopularShouts(limit = 10) {
  try {
    const result = await db
      .select({
        id: shouts.id,
        content: shouts.content,
        created_at: shouts.created_at,
        image_url: shouts.image_url,
        user_id: shouts.user_id,
        username: users.username,
        avatar_url: users.avatar_url,
        vote_count: shouts.vote_count,
        comments_count: count(comments.shout_id).as("comments_count"),
        reshouts_count: count(reshouts.shout_id).as("reshouts_count"),
      })
      .from(shouts)
      .innerJoin(users, eq(shouts.user_id, users.id))
      .innerJoin(shoutHashtags, eq(shouts.id, shoutHashtags.shout_id))
      .innerJoin(
        sql`(
          SELECT hashtag_id, COUNT(*) as tag_count
          FROM shout_hashtags
          GROUP BY hashtag_id
          ORDER BY tag_count DESC
          LIMIT 10
        ) popular_tags`,
        eq(shoutHashtags.hashtag_id, sql`popular_tags.hashtag_id`),
      )
      .leftJoin(comments, eq(shouts.id, comments.shout_id))
      .leftJoin(reshouts, eq(shouts.id, reshouts.shout_id))
      .groupBy(
        shouts.id,
        shouts.content,
        shouts.created_at,
        shouts.image_url,
        shouts.user_id,
        shouts.vote_count,
        users.username,
        users.avatar_url,
      )
      .orderBy(desc(shouts.created_at))
      .limit(limit)

    return result
  } catch (error) {
    console.error("Error fetching recent popular shouts:", error)
    return []
  }
}
