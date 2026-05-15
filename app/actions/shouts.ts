"use server"

import { db, executeQuery } from "@/lib/db"
import { normalizeImageUrl } from "@/lib/media-url"
import { shouts, hashtags, shoutHashtags, reshouts, comments, users } from "@/lib/schema"
import { eq, and, desc, sql, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./auth"
import { createNotification } from "./notification-actions"

export type Shout = {
  id: number
  content: string
  created_at: string
  image_url: string | null
  user_id: number
  username: string
  avatar_url: string | null
  wallet_address: string | null
  vote_count: number | string
  comments_count: number
  reshouts_count: number
}

export async function getShouts(limit = 10, offset = 0): Promise<Shout[]> {
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
        s.like_count::text as vote_count,
        (SELECT COUNT(*) FROM comments WHERE shout_id = s.id) as comments_count,
        (SELECT COUNT(*) FROM reshouts WHERE shout_id = s.id) as reshouts_count
      FROM shouts s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset],
    )

    return result as Shout[]
  } catch (error) {
    console.error("Error fetching shouts:", error)
    return []
  }
}

export async function createShout(content: string, imageUrl?: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { error: "You must be logged in to create a shout" }
    }

    const trimmedContent = content.trim()
    const imageParsed =
      imageUrl === undefined || imageUrl === null || String(imageUrl).trim() === ""
        ? { ok: true as const, value: null }
        : normalizeImageUrl(String(imageUrl))

    if (!imageParsed.ok) {
      return { error: imageParsed.message }
    }

    if (!trimmedContent && !imageParsed.value) {
      return { error: "Add text or an image to your shout" }
    }

    const result = await executeQuery(
      `
      INSERT INTO shouts (user_id, content, image_url)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
      [currentUser.id, trimmedContent || "", imageParsed.value],
    )

    // Extract hashtags from content
    const hashtags = trimmedContent.match(/#(\w+)/g) || []

    if (hashtags.length > 0 && result[0]?.id) {
      const shoutId = result[0].id

      // Process each hashtag
      for (const tag of hashtags) {
        const hashtagName = tag.substring(1) // Remove the # symbol

        // Insert or get hashtag
        const hashtagResult = await executeQuery(
          `
          INSERT INTO hashtags (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = $1
          RETURNING id
        `,
          [hashtagName],
        )

        const hashtagId = hashtagResult[0]?.id

        // Create relationship between shout and hashtag
        await executeQuery(
          `
          INSERT INTO shout_hashtags (shout_id, hashtag_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
          [shoutId, hashtagId],
        )
      }
    }

    return { success: true, shoutId: result[0]?.id }
  } catch (error) {
    console.error("Error creating shout:", error)
    return { error: "Failed to create shout" }
  }
}

// For backward compatibility
export async function createShoutLegacy(userId: number, content: string, imageUrl?: string) {
  try {
    if (!content || content.trim().length === 0) {
      throw new Error("Shout content cannot be empty")
    }

    if (content.length > 280) {
      throw new Error("Shout content cannot exceed 280 characters")
    }

    // Insert the shout
    const [newShout] = await db
      .insert(shouts)
      .values({
        user_id: userId,
        content: content,
        image_url: imageUrl || null,
        vote_count: "0",
      })
      .returning()

    const shoutId = newShout.id

    // Extract hashtags from content
    const hashtagMatches = content.match(/#(\w+)/g) || []

    // Insert hashtags and create relationships
    if (hashtagMatches.length > 0) {
      for (const tag of hashtagMatches) {
        const hashtagName = tag.substring(1) // Remove the # symbol

        // Insert hashtag if it doesn't exist
        const [hashtagResult] = await db
          .insert(hashtags)
          .values({ name: hashtagName })
          .onConflictDoUpdate({
            target: hashtags.name,
            set: { name: hashtagName },
          })
          .returning()

        const hashtagId = hashtagResult.id

        // Create relationship between shout and hashtag
        await db
          .insert(shoutHashtags)
          .values({
            shout_id: shoutId,
            hashtag_id: hashtagId,
          })
          .onConflictDoNothing()
      }
    }

    revalidatePath("/")
    return {
      id: shoutId,
      content: newShout.content,
      image_url: newShout.image_url,
      created_at: newShout.created_at,
    }
  } catch (error) {
    console.error("Error creating shout:", error)
    throw error
  }
}

export async function getShoutById(id: number) {
  const result = await db
    .select({
      id: shouts.id,
      content: shouts.content,
      created_at: shouts.created_at,
      image_url: shouts.image_url,
      user_id: shouts.user_id,
      username: sql<string>`users.username`,
      avatar_url: sql<string>`users.avatar_url`,
      vote_count: shouts.vote_count,
      comment_count: count(comments.shout_id).as("comment_count"),
      reshout_count: count(reshouts.shout_id).as("reshout_count"),
    })
    .from(shouts)
    .innerJoin(users, eq(shouts.user_id, sql`users.id`))
    .leftJoin(comments, eq(shouts.id, comments.shout_id))
    .leftJoin(reshouts, eq(shouts.id, reshouts.shout_id))
    .where(eq(shouts.id, id))
    .groupBy(
      shouts.id,
      shouts.content,
      shouts.created_at,
      shouts.image_url,
      shouts.user_id,
      shouts.vote_count,
      sql`users.username`,
      sql`users.avatar_url`,
    )

  return result[0] || null
}

export async function getFeedShouts(userId?: number, limit = 20, offset = 0) {
  let query = db
    .select({
      id: shouts.id,
      content: shouts.content,
      created_at: shouts.created_at,
      image_url: shouts.image_url,
      user_id: shouts.user_id,
      username: sql<string>`users.username`,
      avatar_url: sql<string>`users.avatar_url`,
      vote_count: shouts.vote_count,
      comments_count: count(comments.shout_id).as("comments_count"),
      reshouts_count: count(reshouts.shout_id).as("reshouts_count"),
    })
    .from(shouts)
    .innerJoin(users, eq(shouts.user_id, sql`users.id`))
    .leftJoin(comments, eq(shouts.id, comments.shout_id))
    .leftJoin(reshouts, eq(shouts.id, reshouts.shout_id))
    .groupBy(
      shouts.id,
      shouts.content,
      shouts.created_at,
      shouts.image_url,
      shouts.user_id,
      shouts.vote_count,
      sql`users.username`,
      sql`users.avatar_url`,
    )
    .orderBy(desc(shouts.created_at))
    .limit(limit)
    .offset(offset)

  if (userId) {
    // This is a simplified version - in a real app, you'd use a subquery to get following IDs
    query = query.where(
      sql`${shouts.user_id} IN (
        SELECT following_id FROM follows WHERE follower_id = ${userId}
        UNION
        SELECT ${userId}
      )`,
    )
  }

  return query
}

export async function getUserShouts(userId: number, limit = 20, offset = 0) {
  return db
    .select({
      id: shouts.id,
      content: shouts.content,
      created_at: shouts.created_at,
      image_url: shouts.image_url,
      user_id: shouts.user_id,
      username: sql<string>`users.username`,
      avatar_url: sql<string>`users.avatar_url`,
      vote_count: shouts.vote_count,
      comments_count: count(comments.shout_id).as("comments_count"),
      reshouts_count: count(reshouts.shout_id).as("reshouts_count"),
    })
    .from(shouts)
    .innerJoin(users, eq(shouts.user_id, sql`users.id`))
    .leftJoin(comments, eq(shouts.id, comments.shout_id))
    .leftJoin(reshouts, eq(shouts.id, reshouts.shout_id))
    .where(eq(shouts.user_id, userId))
    .groupBy(
      shouts.id,
      shouts.content,
      shouts.created_at,
      shouts.image_url,
      shouts.user_id,
      shouts.vote_count,
      sql`users.username`,
      sql`users.avatar_url`,
    )
    .orderBy(desc(shouts.created_at))
    .limit(limit)
    .offset(offset)
}

export async function likeShout(userId: number, shoutId: number) {
  try {
    await executeQuery(
      `
      INSERT INTO likes (user_id, shout_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, shout_id) DO NOTHING
    `,
      [userId, shoutId],
    )

    await executeQuery(
      `
      UPDATE shouts s
      SET like_count = (
        SELECT COALESCE(SUM(u.weight::numeric), 0)
        FROM likes l
        INNER JOIN users u ON l.user_id = u.id
        WHERE l.shout_id = s.id
      )
      WHERE s.id = $2
    `,
      [userId, shoutId],
    )

    return true
  } catch (error) {
    console.error("Error liking shout:", error)
    return false
  }
}

export async function unlikeShout(userId: number, shoutId: number) {
  try {
    // Get current vote type
    const voteResult = await executeQuery(
      `
      SELECT 1 FROM likes
      WHERE user_id = $1 AND shout_id = $2
    `,
      [userId, shoutId],
    )

    if (voteResult.length > 0) {
      await executeQuery(
        `
        DELETE FROM likes
        WHERE user_id = $1 AND shout_id = $2
      `,
        [userId, shoutId],
      )

      await executeQuery(
        `
        UPDATE shouts s
        SET like_count = (
          SELECT COALESCE(SUM(u.weight::numeric), 0)
          FROM likes l
          INNER JOIN users u ON l.user_id = u.id
          WHERE l.shout_id = s.id
        )
        WHERE s.id = $2
      `,
        [userId, shoutId],
      )
    }

    return true
  } catch (error) {
    console.error("Error unliking shout:", error)
    return false
  }
}

// Keep reshout functionality
export async function reshout(userId: number, shoutId: number) {
  try {
    await executeQuery(
      `
      INSERT INTO reshouts (user_id, shout_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, shout_id) DO NOTHING
    `,
      [userId, shoutId],
    )

    // Get shout owner to create notification
    const shoutResult = await db.select({ user_id: shouts.user_id }).from(shouts).where(eq(shouts.id, shoutId))

    if (shoutResult.length > 0) {
      const shoutOwnerId = shoutResult[0].user_id

      // Create notification
      await createNotification({
        userId: shoutOwnerId,
        actorId: userId,
        type: "reshout",
        shoutId,
      })
    }

    revalidatePath("/")
    return true
  } catch (error) {
    console.error("Error reshouting:", error)
    return false
  }
}

export async function unreshout(userId: number, shoutId: number) {
  const result = await db.delete(reshouts).where(and(eq(reshouts.user_id, userId), eq(reshouts.shout_id, shoutId)))

  revalidatePath("/")
  return result.rowCount > 0
}

export async function addComment(userId: number, shoutId: number, content: string) {
  try {
    // Insert comment
    const [newComment] = await db
      .insert(comments)
      .values({
        user_id: userId,
        shout_id: shoutId,
        content: content,
      })
      .returning()

    const commentId = newComment.id

    // Get shout owner to create notification
    const shoutResult = await db.select({ user_id: shouts.user_id }).from(shouts).where(eq(shouts.id, shoutId))

    if (shoutResult.length > 0) {
      const shoutOwnerId = shoutResult[0].user_id

      // Create notification
      await createNotification({
        userId: shoutOwnerId,
        actorId: userId,
        type: "comment",
        shoutId,
        commentId,
      })
    }

    revalidatePath("/")
    return newComment
  } catch (error) {
    console.error("Error adding comment:", error)
    return null
  }
}

export async function getCommentsByShoutId(shoutId: number) {
  return db
    .select({
      id: comments.id,
      content: comments.content,
      created_at: comments.created_at,
      user_id: comments.user_id,
      username: sql<string>`users.username`,
      avatar_url: sql<string>`users.avatar_url`,
    })
    .from(comments)
    .innerJoin("users", eq(comments.user_id, sql`users.id`))
    .where(eq(comments.shout_id, shoutId))
    .orderBy(comments.created_at)
}

export async function getTrendingHashtags(limit = 5) {
  return db
    .select({
      name: hashtags.name,
      usage_count: count(shoutHashtags.hashtag_id).as("usage_count"),
    })
    .from(hashtags)
    .innerJoin(shoutHashtags, eq(hashtags.id, shoutHashtags.hashtag_id))
    .innerJoin(shouts, eq(shoutHashtags.shout_id, shouts.id))
    .where(sql`${shouts.created_at} > NOW() - INTERVAL '24 hours'`)
    .groupBy(hashtags.name)
    .orderBy(desc(sql`usage_count`))
    .limit(limit)
}

export async function getUserLikedShouts(userId: number, limit = 10, offset = 0) {
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
        s.like_count::text as vote_count,
        (SELECT COUNT(*) FROM comments WHERE shout_id = s.id) as comments_count,
        (SELECT COUNT(*) FROM reshouts WHERE shout_id = s.id) as reshouts_count
      FROM shouts s
      JOIN users u ON s.user_id = u.id
      JOIN likes l ON s.id = l.shout_id
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
