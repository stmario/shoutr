import { executeQuery } from "@/lib/db"
import { type EnsProfile, resolveEnsProfile } from "@/lib/ens-profile"
import { resolveEnsForwardAddress, usernameToEnsLookupName } from "@/lib/ens-username-guard"
import { getUsersTableColumns } from "@/lib/users-table-columns"
import { requireChecksumAddress } from "@/lib/wallet-address"

/** Normalize for comparison (lowercase; strip optional .eth suffix). */
function normalizeEnsUsername(value: string): string {
  const lower = value.trim().toLowerCase()
  return lower.endsWith(".eth") ? lower.slice(0, -4) : lower
}

/**
 * True when the Shoutr username matches reverse ENS on this wallet.
 * Accepts either the ENS label (e.g. `shoutr`) or the full name (`shoutr.eth`).
 */
export function usernameMatchesEnsProfile(username: string, ens: EnsProfile): boolean {
  const normalized = normalizeEnsUsername(username)
  const ensLabel = normalizeEnsUsername(ens.username)
  const ensFull = normalizeEnsUsername(ens.ensName)

  if (!normalized || normalized.length < 3) return false

  return normalized === ensLabel || normalized === ensFull
}

/**
 * True when the username matches this wallet via ENS.
 * 1. Reverse: primary ENS name on the wallet matches the username.
 * 2. Forward: username resolves to an ENS name owned by this wallet (same rule as the squat guard).
 */
export async function isUsernameEnsVerified(username: string, walletAddress: string | null): Promise<boolean> {
  if (!walletAddress?.trim()) return false

  let checksum: string
  try {
    checksum = requireChecksumAddress(walletAddress)
  } catch {
    return false
  }

  const ens = await resolveEnsProfile(checksum).catch(() => null)
  if (ens && usernameMatchesEnsProfile(username, ens)) return true

  const ensName = usernameToEnsLookupName(username)
  if (!ensName) return false

  const owner = await resolveEnsForwardAddress(ensName).catch(() => null)
  return owner === checksum
}

/** Persist ENS verification flag after login, signup, or username change. */
export async function refreshUserEnsVerified(
  userId: number,
  username: string,
  walletAddress: string,
): Promise<boolean> {
  const verified = await isUsernameEnsVerified(username, walletAddress)

  const columns = await getUsersTableColumns()
  if (columns.has("is_verified")) {
    await executeQuery(`UPDATE users SET is_verified = $1 WHERE id = $2`, [verified, userId])
  }

  return verified
}
