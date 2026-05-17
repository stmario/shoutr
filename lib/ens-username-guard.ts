import { ethers } from "ethers"
import { collectEnsRpcUrls, isAutoHolderUsername } from "@/lib/ens-profile"
import { createStaticJsonRpcProvider } from "@/lib/ethers-read-provider"
import { requireChecksumAddress } from "@/lib/wallet-address"

const ENS_LOOKUP_TIMEOUT_MS = 12_000
const ENS_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ENS lookup timed out")), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

/** Map a Shoutr username to an ENS name for forward resolution (e.g. `shoutr` → `shoutr.eth`). */
export function usernameToEnsLookupName(username: string): string | null {
  const raw = username.trim().toLowerCase()
  if (!raw) return null

  if (raw.includes(".")) {
    if (!raw.endsWith(".eth")) return null
    const labels = raw.slice(0, -4).split(".")
    if (labels.length === 0 || labels.some((label) => !ENS_LABEL_RE.test(label))) return null
    return raw
  }

  const label = raw.split(".")[0].replace(/_/g, "-")
  if (!ENS_LABEL_RE.test(label) || label.length < 3) return null
  return `${label}.eth`
}

async function resolveForwardOnProvider(
  provider: ethers.JsonRpcProvider,
  ensName: string,
): Promise<string | null> {
  const resolved = await provider.resolveName(ensName)
  if (!resolved) return null
  return ethers.getAddress(resolved)
}

/** Forward ENS resolve: returns owner address if the name is registered, else null. */
export async function resolveEnsForwardAddress(ensName: string): Promise<string | null> {
  const normalized = ensName.trim().toLowerCase()

  for (const rpc of collectEnsRpcUrls()) {
    try {
      const provider = createStaticJsonRpcProvider(rpc)
      const address = await withTimeout(resolveForwardOnProvider(provider, normalized), ENS_LOOKUP_TIMEOUT_MS)
      if (address) return address
    } catch {
      // Try next RPC.
    }
  }

  return null
}

export type UsernameEnsValidation =
  | { ok: true }
  | { ok: false; message: string; ensName?: string }

/**
 * Block usernames that forward-resolve on ENS to an address other than the user's wallet.
 * Unregistered names are allowed; names owned by the wallet are allowed.
 */
export async function validateUsernameForWallet(
  username: string,
  walletAddress: string,
): Promise<UsernameEnsValidation> {
  let wallet: string
  try {
    wallet = requireChecksumAddress(walletAddress)
  } catch {
    return { ok: false, message: "Invalid wallet address." }
  }

  if (isAutoHolderUsername(username, wallet)) {
    return { ok: true }
  }

  const ensName = usernameToEnsLookupName(username)
  if (!ensName) {
    return { ok: true }
  }

  const owner = await resolveEnsForwardAddress(ensName)
  if (!owner) {
    return { ok: true }
  }

  if (owner === wallet) {
    return { ok: true }
  }

  return {
    ok: false,
    ensName,
    message: `${ensName} is registered on ENS to a different address. Choose another username or use the ENS name linked to your wallet.`,
  }
}
