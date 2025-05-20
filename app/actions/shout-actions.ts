"use server"

import { db } from "@/lib/db"
import { shouts, hashtags, shoutHashtags, votes, reshouts, comments } from "@/lib/schema"
import { eq, and, desc, sql, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "./notification-actions"

export async function createShout(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to create a shout" }
    }

    const content = formData.get("content") as string
    const imageUrl = (formData.get("imageUrl") as string) || null

    if (!content || content.trim().length === 0) {
      return { success: false, message: "Shout content cannot be empty" }
    }

    if (content.length > 280) {
      return { success: false, message: "Shout content cannot exceed 280 characters" }
    }

    // Insert the shout
    const [newShout] = await db
      .insert(shouts)
      .values({
        user_id: currentUser.id,
        content: content,
        image_url: imageUrl,
        vote_count: 0,
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
      success: true,
      shout: {
        id: shoutId,
        content: newShout.content,
        image_url: newShout.image_url,
        created_at: newShout.created_at,
      },
    }
  } catch (error) {
    console.error("Error creating shout:", error)
    return { success: false, message: "Failed to create shout" }
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
        vote_count: 0,
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
      display_name: sql<string>`users.display_name`,
      avatar_url: sql<string>`users.avatar_url`,
      vote_count: shouts.vote_count,
      comment_count: count(comments.shout_id).as("comment_count"),
      reshout_count: count(reshouts.shout_id).as("reshout_count"),
    })
    .from(shouts)
    .innerJoin("users", eq(shouts.user_id, sql`users.id`))
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
      sql`users.display_name`,
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
      display_name: sql<string>`users.display_name`,
      avatar_url: sql<string>`users.avatar_url`,
      vote_count: shouts.vote_count,
      comments_count: count(comments.shout_id).as("comments_count"),
      reshouts_count: count(reshouts.shout_id).as("reshouts_count"),
    })
    .from(shouts)
    .innerJoin("users", eq(shouts.user_id, sql`users.id`))
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
      sql`users.display_name`,
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
      display_name: sql<string>`users.display_name`,
      avatar_url: sql<string>`users.avatar_url`,
      vote_count: shouts.vote_count,
      comments_count: count(comments.shout_id).as("comments_count"),
      reshouts_count: count(reshouts.shout_id).as("reshouts_count"),
    })
    .from(shouts)
    .innerJoin("users", eq(shouts.user_id, sql`users.id`))
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
      sql`users.display_name`,
      sql`users.avatar_url`,
    )
    .orderBy(desc(shouts.created_at))
    .limit(limit)
    .offset(offset)
}

// Updated to use votes instead of likes
export async function likeShout(userId: number, shoutId: number) {
  try {
    // Insert vote as upvote
    await db
      .insert(votes)
      .values({
        user_id: userId,
        shout_id: shoutId,
        vote_type: 1, // 1 for upvote
      })
      .onConflictDoUpdate({
        target: [votes.user_id, votes.shout_id],
        set: { vote_type: 1 },
      })

    // Update shout vote count
    await db
      .update(shouts)
      .set({
        vote_count: sql`CASE 
          WHEN EXISTS (SELECT 1 FROM votes WHERE user_id = ${userId} AND shout_id = ${shoutId} AND vote_type = -1) 
          THEN vote_count + 2 
          ELSE vote_count + 1 
        END`,
      })
      .where(eq(shouts.id, shoutId))

    // Get shout owner to create notification
    const shoutResult = await db.select({ user_id: shouts.user_id }).from(shouts).where(eq(shouts.id, shoutId))

    if (shoutResult.length > 0) {
      const shoutOwnerId = shoutResult[0].user_id

      // Create notification
      await createNotification({
        userId: shoutOwnerId,
        actorId: userId,
        type: "vote",
        shoutId,
        vote_type: 1,
      })
    }

    revalidatePath("/")
    return true
  } catch (error) {
    console.error("Error upvoting shout:", error)
    return false
  }
}

// Updated to use votes instead of likes
export async function unlikeShout(userId: number, shoutId: number) {
  try {
    // Get current vote type
    const currentVote = await db
      .select({ vote_type: votes.vote_type })
      .from(votes)
      .where(and(eq(votes.user_id, userId), eq(votes.shout_id, shoutId)))
      .limit(1)

    if (currentVote.length > 0) {
      const voteType = currentVote[0].vote_type

      // Delete the vote
      await db.delete(votes).where(and(eq(votes.user_id, userId), eq(votes.shout_id, shoutId)))

      // Update the shout vote count
      await db
        .update(shouts)
        .set({
          vote_count: sql`vote_count - ${voteType}`,
        })
        .where(eq(shouts.id, shoutId))
    }

    revalidatePath("/")
    return true
  } catch (error) {
    console.error("Error removing vote:", error)
    return false
  }
}

export async function reshout(userId: number, shoutId: number) {
  try {
    // Insert reshout
    await db.insert(reshouts).values({ user_id: userId, shout_id: shoutId })

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
      display_name: sql<string>`users.display_name`,
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

// Updated to use votes instead of likes
export async function getUserLikedShouts(userId: number, limit = 10, offset = 0) {
  try {
    // Use votes table instead of likes, filtering for upvotes (vote_type = 1)
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
        vote_count: shouts.vote_count,
        comments_count: count(comments.shout_id).as("comments_count"),
        reshouts_count: count(reshouts.shout_id).as("reshouts_count"),
      })
      .from(shouts)
      .innerJoin("users", eq(shouts.user_id, sql`users.id`))
      .innerJoin(votes, eq(shouts.id, votes.shout_id))
      .leftJoin(comments, eq(shouts.id, comments.shout_id))
      .leftJoin(reshouts, eq(shouts.id, reshouts.shout_id))
      .where(and(eq(votes.user_id, userId), eq(votes.vote_type, 1))) // Only upvotes
      .groupBy(
        shouts.id,
        shouts.content,
        shouts.created_at,
        shouts.image_url,
        shouts.user_id,
        shouts.vote_count,
        sql`users.username`,
        sql`users.display_name`,
        sql`users.avatar_url`,
      )
      .orderBy(desc(votes.created_at))
      .limit(limit)
      .offset(offset)

    return result
  } catch (error) {
    console.error("Error fetching liked shouts:", error)
    return []
  }
}
