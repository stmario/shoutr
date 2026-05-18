"use server"

import { db, executeQuery } from "@/lib/db"
import { comments, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  canModerateDeleteByStake,
  formatModeratorShotThreshold,
  MIN_MODERATOR_SHOT_WEI,
  validateDeleteReason,
} from "@/lib/moderation-shot"
import { formatLikeWeightShot } from "@/lib/like-weight"
import { getStakeWeiForUsers } from "@/lib/staked-shot"
import { createNotification } from "@/app/actions/notification-actions"

export type CommentDeleteEligibility = {
  canDelete: boolean
  message?: string
  deleterStakeShot?: string
  authorStakeShot?: string
}

export async function getCommentModerationDeleteEligibility(
  commentId: number,
): Promise<CommentDeleteEligibility> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { canDelete: false, message: "Sign in to moderate comments" }
  }

  if (!currentUser.wallet_address) {
    return { canDelete: false, message: "Link a wallet to read your staked SHOT" }
  }

  const commentRows = await db
    .select({
      id: comments.id,
      user_id: comments.user_id,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1)

  if (commentRows.length === 0) {
    return { canDelete: false, message: "Comment not found" }
  }

  const comment = commentRows[0]

  if (comment.user_id === currentUser.id) {
    return { canDelete: false, message: "Use delete on your own comment" }
  }

  const authorRows = await db
    .select({ wallet_address: users.wallet_address })
    .from(users)
    .where(eq(users.id, comment.user_id))
    .limit(1)

  const authorWallet = authorRows[0]?.wallet_address ?? null
  if (!authorWallet) {
    return { canDelete: false, message: "Author has no linked wallet; cannot verify stake" }
  }

  let deleterWei = 0n
  let authorWei = 0n
  try {
    const stakes = await getStakeWeiForUsers(currentUser.id, comment.user_id)
    deleterWei = stakes.a
    authorWei = stakes.b
  } catch (error) {
    console.error("Stake read for comment moderation:", error)
    return { canDelete: false, message: "Could not read staked SHOT from chain" }
  }

  const deleterStakeShot = formatLikeWeightShot(deleterWei)
  const authorStakeShot = formatLikeWeightShot(authorWei)

  if (!canModerateDeleteByStake(deleterWei, authorWei)) {
    if (deleterWei < MIN_MODERATOR_SHOT_WEI) {
      return {
        canDelete: false,
        message: `You need at least ${formatModeratorShotThreshold()} staked to delete comments.`,
        deleterStakeShot,
        authorStakeShot,
      }
    }
    return {
      canDelete: false,
      message: `You can only delete comments from users with less staked SHOT than you (${deleterStakeShot} vs ${authorStakeShot}).`,
      deleterStakeShot,
      authorStakeShot,
    }
  }

  return {
    canDelete: true,
    deleterStakeShot,
    authorStakeShot,
  }
}

export async function moderateDeleteComment(
  commentId: number,
  reason: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in" }
    }

    const reasonCheck = validateDeleteReason(reason)
    if (!reasonCheck.ok) {
      return { success: false, message: reasonCheck.message }
    }

    const eligibility = await getCommentModerationDeleteEligibility(commentId)
    if (!eligibility.canDelete) {
      return { success: false, message: eligibility.message || "You cannot delete this comment" }
    }

    const commentRows = await executeQuery<{
      id: number
      content: string
      shout_id: number
      user_id: number
      username: string
    }>(
      `
      SELECT c.id, c.content, c.shout_id, c.user_id, u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
      `,
      [commentId],
    )

    if (commentRows.length === 0) {
      return { success: false, message: "Comment not found" }
    }

    const comment = commentRows[0]
    const stakes = await getStakeWeiForUsers(currentUser.id, comment.user_id)

    const deletionRows = await executeQuery<{ id: number }>(
      `
      INSERT INTO comment_deletions (
        comment_id,
        shout_id,
        author_id,
        deleted_by_id,
        content,
        author_weight_at_deletion,
        deleter_weight_at_deletion,
        reason
      )
      VALUES ($1, $2, $3, $4, $5, $6::numeric, $7::numeric, $8)
      RETURNING id
      `,
      [
        comment.id,
        comment.shout_id,
        comment.user_id,
        currentUser.id,
        comment.content ?? "",
        stakes.b.toString(),
        stakes.a.toString(),
        reasonCheck.value,
      ],
    )

    const deletionId = deletionRows[0]?.id
    if (deletionId) {
      await createNotification({
        userId: comment.user_id,
        actorId: currentUser.id,
        type: "comment_deleted",
        shoutId: comment.shout_id,
        commentDeletionId: deletionId,
      })
    }

    await executeQuery(`DELETE FROM comments WHERE id = $1`, [commentId])

    revalidatePath(`/shout/${comment.shout_id}`)
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error moderating comment deletion:", error)
    const message = error instanceof Error ? error.message : ""
    if (message.includes("comment_deletions") && message.includes("does not exist")) {
      return {
        success: false,
        message: "Moderation table missing. Run: psql $DATABASE_URL -f db/comment-deletions.sql",
      }
    }
    return { success: false, message: "Failed to delete comment" }
  }
}
