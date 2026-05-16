import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq, inArray } from "drizzle-orm"
import { getStakedBalance, type StakedBalance } from "@/lib/staking-read"

/** Live staked SHOT (wei) for a wallet from the staking contract. */
export async function getWalletStakedWei(walletAddress: string): Promise<bigint> {
  const staked = await getStakedBalance(walletAddress)
  return staked.amount
}

export async function getWalletStakedBalance(walletAddress: string): Promise<StakedBalance> {
  return getStakedBalance(walletAddress)
}

async function readWalletStake(walletAddress: string | null): Promise<bigint> {
  if (!walletAddress) return 0n
  try {
    return await getWalletStakedWei(walletAddress)
  } catch (error) {
    console.error("Staking contract read failed:", error)
    return 0n
  }
}

/** Live stake for a user id (loads wallet, then queries chain). */
export async function getUserStakedWei(userId: number): Promise<bigint> {
  const [row] = await db
    .select({ wallet_address: users.wallet_address })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return readWalletStake(row?.wallet_address ?? null)
}

export async function getUsersStakedWei(userIds: number[]): Promise<Map<number, bigint>> {
  const map = new Map<number, bigint>()
  if (userIds.length === 0) return map

  const rows = await db
    .select({ id: users.id, wallet_address: users.wallet_address })
    .from(users)
    .where(inArray(users.id, userIds))

  await Promise.all(
    rows.map(async (row) => {
      const amount = await readWalletStake(row.wallet_address)
      map.set(row.id, amount)
    }),
  )

  for (const id of userIds) {
    if (!map.has(id)) map.set(id, 0n)
  }

  return map
}

/** Resolve two user ids to live on-chain stake in parallel. */
export async function getStakeWeiForUsers(
  userIdA: number,
  userIdB: number,
): Promise<{ a: bigint; b: bigint }> {
  const map = await getUsersStakedWei([userIdA, userIdB])
  return { a: map.get(userIdA) ?? 0n, b: map.get(userIdB) ?? 0n }
}
