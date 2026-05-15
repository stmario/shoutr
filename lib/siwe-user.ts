import { randomUUID } from "crypto"
import { ethers } from "ethers"
import bcrypt from "bcryptjs"
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

  const passwordHash = await bcrypt.hash(randomUUID(), 10)
  const username = await pickUsername(address)

  try {
    const inserted = await executeQuery(
      `INSERT INTO users (username, wallet_address, password_hash, is_verified)
       VALUES ($1, $2, $3, true)
       RETURNING id, username`,
      [username, address, passwordHash],
    )

    if (!inserted.length) {
      throw new Error("Failed to create wallet user")
    }

    const row = inserted[0] as { id: number; username: string }
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
