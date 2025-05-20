"use server"

import { db } from "@/lib/db"
import { votes, shouts, notifications } from "@/lib/schema"
import { eq, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

// Vote on a shout (upvote or downvote)
export async function voteOnShout(shoutId: number, voteType: 1 | -1) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to vote" }
    }

    // Check if user has already voted
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.user_id, currentUser.id), eq(votes.shout_id, shoutId)))
      .limit(1)

    // Get the shout to find the owner
    const shoutResult = await db.select({ user_id: shouts.user_id }).from(shouts).where(eq(shouts.id, shoutId)).limit(1)

    if (shoutResult.length === 0) {
      return { success: false, message: "Shout not found" }
    }

    const shoutOwnerId = shoutResult[0].user_id

    // Transaction to handle vote and update shout vote count
    await db.transaction(async (tx) => {
      if (existingVote.length > 0) {
        const oldVoteType = existingVote[0].vote_type

        // If same vote type, remove the vote
        if (oldVoteType === voteType) {
          await tx.delete(votes).where(and(eq(votes.user_id, currentUser.id), eq(votes.shout_id, shoutId)))

          // Update shout vote count
          await tx
            .update(shouts)
            .set({
              vote_count: sql`${shouts.vote_count} - ${voteType}`,
              updated_at: new Date(),
            })
            .where(eq(shouts.id, shoutId))
        } else {
          // Change vote type
          await tx
            .update(votes)
            .set({
              vote_type: voteType,
              updated_at: new Date(),
            })
            .where(and(eq(votes.user_id, currentUser.id), eq(votes.shout_id, shoutId)))

          // Update shout vote count (subtract old vote, add new vote)
          await tx
            .update(shouts)
            .set({
              vote_count: sql`${shouts.vote_count} - ${oldVoteType} + ${voteType}`,
              updated_at: new Date(),
            })
            .where(eq(shouts.id, shoutId))
        }
      } else {
        // Insert new vote
        await tx.insert(votes).values({
          user_id: currentUser.id,
          shout_id: shoutId,
          vote_type: voteType,
        })

        // Update shout vote count
        await tx
          .update(shouts)
          .set({
            vote_count: sql`${shouts.vote_count} + ${voteType}`,
            updated_at: new Date(),
          })
          .where(eq(shouts.id, shoutId))

        // Create notification for the shout owner
        if (shoutOwnerId !== currentUser.id) {
          await tx.insert(notifications).values({
            user_id: shoutOwnerId,
            actor_id: currentUser.id,
            type: "vote",
            shout_id: shoutId,
            vote_type: voteType,
            is_read: false,
          })
        }
      }
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error voting on shout:", error)
    return { success: false, message: "Failed to vote on shout" }
  }
}

// Get user's vote on a shout
export async function getUserVote(shoutId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return 0 // No vote
    }

    const result = await db
      .select({ vote_type: votes.vote_type })
      .from(votes)
      .where(and(eq(votes.user_id, currentUser.id), eq(votes.shout_id, shoutId)))
      .limit(1)

    return result.length > 0 ? result[0].vote_type : 0
  } catch (error) {
    console.error("Error getting user vote:", error)
    return 0
  }
}

// Sync votes from blockchain to database
export async function syncVotesFromBlockchain(shoutId: number, voteCount: number) {
  try {
    await db.update(shouts).set({ vote_count: voteCount }).where(eq(shouts.id, shoutId))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error syncing votes:", error)
    return { success: false, message: "Failed to sync votes" }
  }
}
