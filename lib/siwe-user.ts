import { randomUUID } from "crypto"
import { ethers } from "ethers"
import { eq } from "drizzle-orm"
import { db, executeQuery } from "./db"
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

let usersColumnCache: Set<string> | null = null

async function getUsersTableColumns(): Promise<Set<string>> {
  if (usersColumnCache) return usersColumnCache

  const rows = (await executeQuery(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`,
  )) as { column_name: string }[]

  usersColumnCache = new Set(rows.map((r) => r.column_name))
  return usersColumnCache
}

async function pickUsername(checksumAddress: string) {
  const base = `holder_${checksumAddress.slice(2, 10).toLowerCase()}`
  let candidate = base
  for (let n = 0; n < 50; n++) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, candidate)).limit(1)
    if (existing.length === 0) {
      return candidate
    }
    candidate = `${base}_${n + 1}`
  }
  return `${base}_${randomUUID().slice(0, 8)}`
}

async function insertWalletUser(username: string, walletAddress: string) {
  const columns = await getUsersTableColumns()
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
  add("wallet_address", walletAddress)
  add("is_verified", true)
  add("weight", "0")

  if (fields.length === 0) {
    throw new Error("users table has no compatible columns for wallet sign-up (need at least username or wallet_address)")
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

export async function findOrCreateSiweUser(walletAddress: string): Promise<SiweUserRow> {
  const address = ethers.getAddress(walletAddress)
  const email = emailClaimForWallet(address)

  const existingRows = await executeQuery(
    "SELECT id, username FROM users WHERE wallet_address = $1 LIMIT 1",
    [address],
  )
  if (existingRows.length > 0) {
    const row = existingRows[0] as { id: number; username: string }
    return { id: row.id, username: row.username, email }
  }

  const username = await pickUsername(address)

  try {
    const row = await insertWalletUser(username, address)
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
