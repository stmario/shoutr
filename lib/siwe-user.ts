import { randomUUID } from "crypto"
import { ethers } from "ethers"
import { eq } from "drizzle-orm"
import { db, executeQuery } from "./db"
import { resolveEnsProfile, isAutoHolderUsername, type EnsProfile } from "./ens-profile"
import { getUsersTableColumns } from "./users-table-columns"
import { requireChecksumAddress } from "./wallet-address"
import { users } from "./schema"

/** Placeholder email for SIWE-only users (unique per wallet; not used for login). */
function emailClaimForWallet(checksumAddress: string): string {
  return `${checksumAddress.toLowerCase()}@wallet.shoutr`
}

export type SiweUserRow = {
  id: number
  username: string
  email: string
}

async function isUsernameAvailable(username: string, excludeUserId?: number): Promise<boolean> {
  if (excludeUserId != null) {
    const rows = await executeQuery("SELECT id FROM users WHERE username = $1 AND id != $2 LIMIT 1", [
      username,
      excludeUserId,
    ])
    return rows.length === 0
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
  return existing.length === 0
}

async function pickUsername(checksumAddress: string, preferred?: string) {
  if (preferred) {
    let candidate = preferred
    for (let n = 0; n < 50; n++) {
      if (await isUsernameAvailable(candidate)) return candidate
      candidate = n === 0 ? `${preferred}_ens` : `${preferred}_ens_${n}`
    }
  }

  const base = `holder_${checksumAddress.slice(2, 10).toLowerCase()}`
  let candidate = base
  for (let n = 0; n < 50; n++) {
    if (await isUsernameAvailable(candidate)) return candidate
    candidate = `${base}_${n + 1}`
  }
  return `${base}_${randomUUID().slice(0, 8)}`
}

async function insertWalletUser(username: string, walletAddress: string, avatarUrl?: string | null) {
  const columns = await getUsersTableColumns()
  if (!columns.has("wallet_address")) {
    throw new Error("users.wallet_address column is required for wallet sign-up")
  }

  const checksum = requireChecksumAddress(walletAddress)
  const fields: string[] = []
  const values: unknown[] = []
  const placeholders: string[] = []

  const add = (name: string, value: unknown) => {
    if (!columns.has(name)) return
    fields.push(name)
    values.push(value)
    placeholders.push(`$${values.length}`)
  }

  add("username", username)
  add("wallet_address", checksum)
  add("avatar_url", avatarUrl ?? null)
  add("is_verified", true)

  if (!fields.includes("wallet_address")) {
    throw new Error("wallet_address must be set on sign-up")
  }

  if (fields.length === 0) {
    throw new Error("users table has no compatible columns for wallet sign-up")
  }

  const returning = fields.includes("username") ? "id, username" : "id"

  const inserted = await executeQuery(
    `INSERT INTO users (${fields.join(", ")})
     VALUES (${placeholders.join(", ")})
     RETURNING ${returning}`,
    values,
  )

  if (!inserted.length) {
    throw new Error("Failed to create wallet user")
  }

  const row = inserted[0] as { id: number; username?: string }
  return { id: row.id, username: row.username ?? username }
}

async function applyEnsProfileToUser(
  userId: number,
  currentUsername: string,
  checksumAddress: string,
  ens: EnsProfile,
): Promise<string> {
  const columns = await getUsersTableColumns()
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  let nextUsername = currentUsername
  if (isAutoHolderUsername(currentUsername, checksumAddress) && (await isUsernameAvailable(ens.username, userId))) {
    nextUsername = ens.username
    if (columns.has("username")) {
      updates.push(`username = $${paramIndex++}`)
      values.push(nextUsername)
    }
  }

  if (columns.has("avatar_url") && ens.avatarUrl) {
    const avatarRows = await executeQuery("SELECT avatar_url FROM users WHERE id = $1 LIMIT 1", [userId])
    const currentAvatar = (avatarRows[0] as { avatar_url?: string | null } | undefined)?.avatar_url
    if (!currentAvatar) {
      updates.push(`avatar_url = $${paramIndex++}`)
      values.push(ens.avatarUrl)
    }
  }

  if (updates.length === 0) return nextUsername

  if (columns.has("updated_at")) {
    updates.push("updated_at = CURRENT_TIMESTAMP")
  }

  values.push(userId)
  await executeQuery(`UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values)
  return nextUsername
}

async function syncEnsProfileForUser(
  userId: number,
  username: string,
  checksumAddress: string,
): Promise<string> {
  try {
    const ens = await resolveEnsProfile(checksumAddress)
    if (!ens) return username
    return await applyEnsProfileToUser(userId, username, checksumAddress, ens)
  } catch (err) {
    console.warn("ENS profile sync failed:", err instanceof Error ? err.message : err)
    return username
  }
}

/** Attach wallet to a legacy row created before wallet_address was set (holder_* usernames). */
async function linkOrphanWalletUser(checksumAddress: string): Promise<SiweUserRow | null> {
  const columns = await getUsersTableColumns()
  if (!columns.has("wallet_address") || !columns.has("username")) {
    return null
  }

  const holderBase = `holder_${checksumAddress.slice(2, 10).toLowerCase()}`
  const linked = await executeQuery(
    `UPDATE users
     SET wallet_address = $1
     WHERE wallet_address IS NULL
       AND (username = $2 OR username LIKE $3)
     RETURNING id, username`,
    [checksumAddress, holderBase, `${holderBase}_%`],
  )

  if (!linked.length) return null

  const row = linked[0] as { id: number; username: string }
  const username = await syncEnsProfileForUser(row.id, row.username, checksumAddress)
  return { id: row.id, username, email: emailClaimForWallet(checksumAddress) }
}

export async function findOrCreateSiweUser(walletAddress: string): Promise<SiweUserRow> {
  const address = requireChecksumAddress(walletAddress)
  const email = emailClaimForWallet(address)

  const existingRows = await executeQuery(
    "SELECT id, username FROM users WHERE wallet_address = $1 LIMIT 1",
    [address],
  )
  if (existingRows.length > 0) {
    const row = existingRows[0] as { id: number; username: string }
    const username = await syncEnsProfileForUser(row.id, row.username, address)
    return { id: row.id, username, email }
  }

  const linked = await linkOrphanWalletUser(address)
  if (linked) {
    return linked
  }

  const ens = await resolveEnsProfile(address).catch(() => null)
  const username = await pickUsername(address, ens?.username)
  const avatarUrl = ens?.avatarUrl ?? null

  try {
    const row = await insertWalletUser(username, address, avatarUrl)
    return { id: row.id, username: row.username, email }
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code: string }).code) : ""
    const message = err instanceof Error ? err.message : ""
    if (code === "23505" || message.includes("unique") || message.includes("duplicate")) {
      const retry = await executeQuery(
        "SELECT id, username FROM users WHERE wallet_address = $1 LIMIT 1",
        [address],
      )
      if (retry.length > 0) {
        const row = retry[0] as { id: number; username: string }
        return { id: row.id, username: row.username, email }
      }
    }
    throw err
  }
}
