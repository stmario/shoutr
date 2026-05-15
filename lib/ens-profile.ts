import { ethers } from "ethers"
import { collectRpcUrls, createStaticJsonRpcProvider, parseUserRpcUrls } from "./ethers-read-provider"

/** Public Ethereum mainnet RPCs for ENS reverse resolution. */
export const MAINNET_DEFAULT_RPCS = [
  "https://ethereum-rpc.publicnode.com",
  "https://1rpc.io/eth",
  "https://cloudflare-eth.com",
] as const

export type EnsProfile = {
  /** Full ENS name (e.g. vitalik.eth). */
  ensName: string
  /** Shoutr username derived from the ENS label. */
  username: string
  avatarUrl: string | null
}

const ENS_LOOKUP_TIMEOUT_MS = 12_000

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

export function collectEnsRpcUrls(): string[] {
  const explicit = process.env.ENS_RPC_URL || process.env.ETHEREUM_MAINNET_RPC_URL
  const userMainnet = explicit
    ? explicit.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
    : []

  const merged = [...userMainnet, ...MAINNET_DEFAULT_RPCS]
  const seen = new Set<string>()
  return merged.filter((u) => {
    if (seen.has(u)) return false
    seen.add(u)
    return true
  })
}

/** Map an ENS name to a unique-friendly Shoutr username (label before first dot). */
export function ensNameToUsername(ensName: string): string | null {
  const normalized = ensName.trim().toLowerCase()
  const label = normalized.split(".")[0]
  if (!label) return null

  let username = label.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
  if (username.length < 3) return null
  if (username.length > 32) username = username.slice(0, 32)
  return username
}

export function isAutoHolderUsername(username: string, checksumAddress: string): boolean {
  const base = `holder_${checksumAddress.slice(2, 10).toLowerCase()}`
  return username === base || username.startsWith(`${base}_`)
}

async function resolveEnsProfileOnProvider(
  provider: ethers.JsonRpcProvider,
  checksumAddress: string,
): Promise<EnsProfile | null> {
  const ensName = await provider.lookupAddress(checksumAddress)
  if (!ensName) return null

  const username = ensNameToUsername(ensName)
  if (!username) return null

  let avatarUrl: string | null = null
  try {
    const resolver = await provider.getResolver(ensName)
    if (resolver) {
      const avatar = await resolver.getAvatar()
      if (avatar && typeof avatar === "string") {
        avatarUrl = avatar
      }
    }
  } catch {
    // Avatar is optional; name is enough for username.
  }

  return { ensName, username, avatarUrl }
}

/**
 * Reverse ENS lookup: primary name + avatar for a wallet (mainnet, then app RPCs as fallback).
 */
export async function resolveEnsProfile(walletAddress: string): Promise<EnsProfile | null> {
  let checksum: string
  try {
    checksum = ethers.getAddress(walletAddress)
  } catch {
    return null
  }

  const rpcLists = [collectEnsRpcUrls(), collectRpcUrls(parseUserRpcUrls())]

  for (const urls of rpcLists) {
    for (const rpc of urls) {
      try {
        const provider = createStaticJsonRpcProvider(rpc)
        const profile = await withTimeout(resolveEnsProfileOnProvider(provider, checksum), ENS_LOOKUP_TIMEOUT_MS)
        if (profile) return profile
      } catch {
        // Try next RPC.
      }
    }
  }

  return null
}
