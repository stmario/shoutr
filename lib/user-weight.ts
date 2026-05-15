import { db } from "@/lib/db"
import { likes, shouts, users } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { getStakedBalance } from "@/lib/staking-read"
import { stakeAmountToWeightWei } from "@/lib/like-weight"

/** Recompute shout like_count as the sum of likers' current users.weight (staked SHOT in wei). */
export async function recalculateShoutLikeTotal(shoutId: number) {
  const [row] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${users.weight}::numeric), 0)::text`,
    })
    .from(likes)
    .innerJoin(users, eq(likes.user_id, users.id))
    .where(eq(likes.shout_id, shoutId))

  const total = row?.total ?? "0"

  // like_count must be numeric(78,0) in Postgres — integer overflows wei totals.
  await db.execute(sql`
    UPDATE shouts
    SET like_count = ${total}::numeric,
        updated_at = NOW()
    WHERE id = ${shoutId}
  `)

  return total
}

/** Read staked SHOT from chain and persist on users.weight; refresh totals on liked shouts. */
export async function syncUserStakeWeight(userId: number, walletAddress: string) {
  const staked = await getStakedBalance(walletAddress)
  const weightWei = stakeAmountToWeightWei(staked.amount)

  await db
    .update(users)
    .set({ weight: weightWei, updated_at: new Date() })
    .where(eq(users.id, userId))

  const likedShouts = await db
    .select({ shout_id: likes.shout_id })
    .from(likes)
    .where(eq(likes.user_id, userId))

  for (const { shout_id } of likedShouts) {
    await recalculateShoutLikeTotal(shout_id)
  }

  return { weightWei, decimals: staked.decimals, symbol: staked.symbol }
}
