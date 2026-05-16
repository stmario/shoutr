"use server"

import { db, executeQuery } from "@/lib/db"
import { shouts, users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import {
  canModerateDeleteByStake,
  formatModeratorShotThreshold,
  MIN_MODERATOR_SHOT_WEI,
  validateDeleteReason,
} from "@/lib/moderation-shot"
import { formatLikeWeightShot, weightWeiToBigInt } from "@/lib/like-weight"
import { getStakeWeiForUsers } from "@/lib/staked-shot"
import { createNotification } from "@/app/actions/notification-actions"

export type ShoutDeleteEligibility = {
  canDelete: boolean
  message?: string
  deleterStakeShot?: string
  authorStakeShot?: string
}

function revalidateShoutPaths(shoutId: number, authorUsername?: string) {
  revalidatePath("/")
  revalidatePath(`/shout/${shoutId}`)
  revalidatePath("/explore")
  revalidatePath("/search")
  revalidatePath("/bookmarks")
  if (authorUsername) {
    revalidatePath(`/profile/${authorUsername}`)
  }
}

export async function getShoutModerationDeleteEligibility(
  shoutId: number,
): Promise<ShoutDeleteEligibility> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { canDelete: false, message: "Sign in to moderate shouts" }
  }

  if (!currentUser.wallet_address) {
    return { canDelete: false, message: "Link a wallet to read your staked SHOT" }
  }

  const shoutRows = await db
    .select({
      id: shouts.id,
      user_id: shouts.user_id,
    })
    .from(shouts)
    .where(eq(shouts.id, shoutId))
    .limit(1)

  if (shoutRows.length === 0) {
    return { canDelete: false, message: "Shout not found" }
  }

  const shout = shoutRows[0]

  if (shout.user_id === currentUser.id) {
    return { canDelete: false, message: "Moderation only applies to other users' shouts" }
  }

  const authorRows = await db
    .select({ wallet_address: users.wallet_address })
    .from(users)
    .where(eq(users.id, shout.user_id))
    .limit(1)

  const authorWallet = authorRows[0]?.wallet_address
  if (!authorWallet) {
    return { canDelete: false, message: "Author has no linked wallet; cannot verify stake" }
  }

  let deleterWei = 0n
  let authorWei = 0n
  try {
    const stakes = await getStakeWeiForUsers(currentUser.id, shout.user_id)
    deleterWei = stakes.a
    authorWei = stakes.b
  } catch (error) {
    console.error("Stake read for moderation:", error)
    return { canDelete: false, message: "Could not read staked SHOT from chain" }
  }

  const deleterStakeShot = formatLikeWeightShot(deleterWei)
  const authorStakeShot = formatLikeWeightShot(authorWei)

  if (!canModerateDeleteByStake(deleterWei, authorWei)) {
    if (deleterWei < MIN_MODERATOR_SHOT_WEI) {
      return {
        canDelete: false,
        message: `You need at least ${formatModeratorShotThreshold()} staked to delete shouts.`,
        deleterStakeShot,
        authorStakeShot,
      }
    }
    return {
      canDelete: false,
      message: `You can only delete shouts from users with less staked SHOT than you (${deleterStakeShot} vs ${authorStakeShot}).`,
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

export async function moderateDeleteShout(
  shoutId: number,
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

    const eligibility = await getShoutModerationDeleteEligibility(shoutId)
    if (!eligibility.canDelete) {
      return { success: false, message: eligibility.message || "You cannot delete this shout" }
    }

    const shoutRows = await executeQuery<{
      id: number
      content: string
      image_url: string | null
      user_id: number
      username: string
    }>(
      `
      SELECT s.id, s.content, s.image_url, s.user_id, u.username
      FROM shouts s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
      `,
      [shoutId],
    )

    if (shoutRows.length === 0) {
      return { success: false, message: "Shout not found" }
    }

    const shout = shoutRows[0]
    const stakes = await getStakeWeiForUsers(currentUser.id, shout.user_id)

    const deletionRows = await executeQuery<{ id: number }>(
      `
      INSERT INTO shout_deletions (
        shout_id,
        author_id,
        deleted_by_id,
        content,
        image_url,
        author_weight_at_deletion,
        deleter_weight_at_deletion,
        reason
      )
      VALUES ($1, $2, $3, $4, $5, $6::numeric, $7::numeric, $8)
      RETURNING id
      `,
      [
        shout.id,
        shout.user_id,
        currentUser.id,
        shout.content ?? "",
        shout.image_url,
        stakes.b.toString(),
        stakes.a.toString(),
        reasonCheck.value,
      ],
    )

    const deletionId = deletionRows[0]?.id
    if (deletionId) {
      await createNotification({
        userId: shout.user_id,
        actorId: currentUser.id,
        type: "shout_deleted",
        shoutDeletionId: deletionId,
      })
    }

    await executeQuery(`DELETE FROM shouts WHERE id = $1`, [shoutId])

    revalidateShoutPaths(shoutId, shout.username)

    return { success: true }
  } catch (error) {
    console.error("Error moderating shout deletion:", error)
    const message = error instanceof Error ? error.message : ""
    if (message.includes("shout_deletions") && message.includes("does not exist")) {
      return {
        success: false,
        message: "Moderation table missing. Run: psql $DATABASE_URL -f db/shout-deletions.sql",
      }
    }
    return { success: false, message: "Failed to delete shout" }
  }
}
