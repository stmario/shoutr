"use server"

import { db } from "@/lib/db"
import { likes, shouts, notifications, users } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { formatLikeWeightShot, weightWeiToBigInt } from "@/lib/like-weight"
import { recalculateShoutLikeTotal, syncUserStakeWeight } from "@/lib/user-weight"

export type LikeStatus = {
  liked: boolean
  userWeightWei: string
  totalWeightWei: string
}

async function getUserWeightWei(userId: number): Promise<string> {
  const [row] = await db.select({ weight: users.weight }).from(users).where(eq(users.id, userId)).limit(1)
  return row?.weight?.toString() ?? "0"
}

export async function getShoutLikeStatus(shoutId: number): Promise<LikeStatus> {
  const currentUser = await getCurrentUser()
  const shoutRows = await db
    .select({ vote_count: shouts.vote_count })
    .from(shouts)
    .where(eq(shouts.id, shoutId))
    .limit(1)

  const totalWeightWei = shoutRows[0]?.vote_count?.toString() ?? "0"

  if (!currentUser) {
    return { liked: false, userWeightWei: "0", totalWeightWei }
  }

  const existing = await db
    .select({ user_id: likes.user_id })
    .from(likes)
    .where(and(eq(likes.user_id, currentUser.id), eq(likes.shout_id, shoutId)))
    .limit(1)

  const liked = existing.length > 0
  const userWeightWei = await getUserWeightWei(currentUser.id)

  return { liked, userWeightWei, totalWeightWei }
}

/** Sync users.weight from chain (for the logged-in user). */
export async function refreshMyLikePower() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.wallet_address) {
    return { success: false, message: "No wallet linked" }
  }

  try {
    const synced = await syncUserStakeWeight(currentUser.id, currentUser.wallet_address)
    return {
      success: true,
      amountWei: synced.weightWei,
      formatted: formatLikeWeightShot(synced.weightWei, synced.decimals),
      symbol: synced.symbol,
    }
  } catch (err) {
    console.error(err)
    return { success: false, message: "Could not sync staked balance" }
  }
}

/** Toggle like. Shout total = sum of likers' users.weight (current stake). */
export async function toggleLikeShout(shoutId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to like" }
    }

    if (!currentUser.wallet_address) {
      return { success: false, message: "Link a wallet to your account to like shouts" }
    }

    let synced
    try {
      synced = await syncUserStakeWeight(currentUser.id, currentUser.wallet_address)
    } catch (err) {
      console.error("Staking read error:", err)
      return {
        success: false,
        message: "Could not read your staked SHOT. Check staking contract and RPC configuration.",
      }
    }

    const weightWei = synced.weightWei
    if (weightWeiToBigInt(weightWei) <= 0n) {
      return {
        success: false,
        message: `Stake ${synced.symbol} to like shouts. Your staked balance is 0.`,
      }
    }

    const weightLabel = formatLikeWeightShot(weightWei, synced.decimals)

    const shoutResult = await db
      .select({ user_id: shouts.user_id })
      .from(shouts)
      .where(eq(shouts.id, shoutId))
      .limit(1)

    if (shoutResult.length === 0) {
      return { success: false, message: "Shout not found" }
    }

    const shoutOwnerId = shoutResult[0].user_id

    const existingLike = await db
      .select({ user_id: likes.user_id })
      .from(likes)
      .where(and(eq(likes.user_id, currentUser.id), eq(likes.shout_id, shoutId)))
      .limit(1)

    if (existingLike.length > 0) {
      await db.delete(likes).where(and(eq(likes.user_id, currentUser.id), eq(likes.shout_id, shoutId)))
      const totalWeightWei = await recalculateShoutLikeTotal(shoutId)

      revalidatePath("/")
      return {
        success: true,
        liked: false,
        totalWeightWei,
        userWeightWei: weightWei,
      }
    }

    await db.insert(likes).values({
      user_id: currentUser.id,
      shout_id: shoutId,
    })

    if (shoutOwnerId !== currentUser.id) {
      await db.insert(notifications).values({
        user_id: shoutOwnerId,
        actor_id: currentUser.id,
        type: "like",
        shout_id: shoutId,
        is_read: false,
      })
    }

    const totalWeightWei = await recalculateShoutLikeTotal(shoutId)

    revalidatePath("/")
    return {
      success: true,
      liked: true,
      totalWeightWei,
      userWeightWei: weightWei,
      weightLabel,
      message: `Liked with ${weightLabel} staked`,
    }
  } catch (error) {
    console.error("Error liking shout:", error)
    return { success: false, message: "Failed to like shout" }
  }
}

/** @deprecated Use toggleLikeShout */
export async function voteOnShout(shoutId: number, voteType: 1 | -1) {
  if (voteType === -1) {
    return { success: false, message: "Downvotes are disabled. Like with your staked SHOT instead." }
  }
  return toggleLikeShout(shoutId)
}

/** @deprecated Use getShoutLikeStatus */
export async function getUserVote(shoutId: number) {
  const status = await getShoutLikeStatus(shoutId)
  return status.liked ? 1 : 0
}

export async function getUserStakedLikePower() {
  return refreshMyLikePower()
}

export async function syncVotesFromBlockchain(shoutId: number, voteCount: number) {
  try {
    await db
      .update(shouts)
      .set({ vote_count: weightWeiToBigInt(voteCount).toString() })
      .where(eq(shouts.id, shoutId))

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error syncing like totals:", error)
    return { success: false, message: "Failed to sync likes" }
  }
}
