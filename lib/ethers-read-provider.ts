import { ethers, Network } from "ethers"

/** Public Sepolia RPCs used when chain is Sepolia (unless ETHEREUM_RPC_NO_DEFAULT_FALLBACKS=1). */
export const SEPOLIA_DEFAULT_RPCS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://1rpc.io/sepolia",
  "https://sepolia.drpc.org",
] as const

export function getConfiguredChainId(): number {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.ETHEREUM_CHAIN_ID || "1"
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : 1
}

/** Infer chain from RPC hostname/path so static Network matches the node. */
export function chainIdForRpcUrl(rpcUrl: string): number {
  if (/sepolia/i.test(rpcUrl)) return 11155111
  if (/holesky/i.test(rpcUrl)) return 17000
  return getConfiguredChainId()
}

/** Read-only HTTP provider without eth_chainId polling (avoids flaky RPC startup loops). */
export function createStaticJsonRpcProvider(rpcUrl: string) {
  const chainId = chainIdForRpcUrl(rpcUrl)
  const network = Network.from(chainId)
  return new ethers.JsonRpcProvider(rpcUrl, network, { staticNetwork: true })
}

export function shouldAppendSepoliaFallbacks(userUrls: string[]): boolean {
  if (process.env.ETHEREUM_RPC_NO_DEFAULT_FALLBACKS === "1") return false
  if (getConfiguredChainId() === 11155111) return true
  return userUrls.some((u) => /sepolia/i.test(u))
}

export function parseUserRpcUrls(): string[] {
  const raw = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_ETHEREUM_PROVIDER_URL || ""
  return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
}

export function collectRpcUrls(userUrls: string[]): string[] {
  const defaults = shouldAppendSepoliaFallbacks(userUrls) ? [...SEPOLIA_DEFAULT_RPCS] : []
  const merged = [...userUrls, ...defaults]

  const seen = new Set<string>()
  return merged.filter((u) => {
    if (seen.has(u)) return false
    seen.add(u)
    return true
  })
}
