import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { weightWeiToBigInt } from "@/lib/like-weight"

function toWeiString(weight: string | number | bigint): string {
  return weightWeiToBigInt(weight).toString()
}

/** Add stored like weight to the shout total. */
export async function incrementShoutLikeTotal(
  shoutId: number,
  weightWei: string | number | bigint,
): Promise<string> {
  const delta = toWeiString(weightWei)

  const result = await db.execute<{ like_count: string }>(sql`
    UPDATE shouts
    SET like_count = COALESCE(like_count, 0) + ${delta}::numeric,
        updated_at = NOW()
    WHERE id = ${shoutId}
    RETURNING like_count::text AS like_count
  `)

  const rows = Array.isArray(result) ? result : (result as { rows?: { like_count: string }[] }).rows
  return rows?.[0]?.like_count ?? delta
}

/** Remove a liker's stored weight from the shout total (on unlike). */
export async function decrementShoutLikeTotal(
  shoutId: number,
  weightWei: string | number | bigint,
): Promise<string> {
  const delta = toWeiString(weightWei)

  const result = await db.execute<{ like_count: string }>(sql`
    UPDATE shouts
    SET like_count = GREATEST(0, COALESCE(like_count, 0) - ${delta}::numeric),
        updated_at = NOW()
    WHERE id = ${shoutId}
    RETURNING like_count::text AS like_count
  `)

  const rows = Array.isArray(result) ? result : (result as { rows?: { like_count: string }[] }).rows
  return rows?.[0]?.like_count ?? "0"
}

/** Recompute shout like_count from stored per-like weights (repair / migration). */
export async function recalculateShoutLikeTotal(shoutId: number): Promise<string> {
  const result = await db.execute<{ like_count: string }>(sql`
    UPDATE shouts s
    SET like_count = (
      SELECT COALESCE(SUM(l.weight_wei::numeric), 0)
      FROM likes l
      WHERE l.shout_id = s.id
    ),
    updated_at = NOW()
    WHERE s.id = ${shoutId}
    RETURNING s.like_count::text AS like_count
  `)

  const rows = Array.isArray(result) ? result : (result as { rows?: { like_count: string }[] }).rows
  return rows?.[0]?.like_count ?? "0"
}

/** @deprecated Use incrementShoutLikeTotal / decrementShoutLikeTotal. */
export async function applyLikeWeightChange(shoutId: number, deltaWei: bigint): Promise<string> {
  if (deltaWei >= 0n) return incrementShoutLikeTotal(shoutId, deltaWei)
  return decrementShoutLikeTotal(shoutId, -deltaWei)
}
