import { ethers, Network } from "ethers"
import {
  chainIdForRpcUrl,
  getConfiguredChainId,
  MAINNET_DEFAULT_RPCS,
  shouldAppendDefaultRpcFallbacks,
} from "@/lib/ethereum-network"

export {
  chainIdForRpcUrl,
  defaultRpcFailureHint,
  getConfiguredChainId,
  MAINNET_DEFAULT_RPCS,
  shouldAppendDefaultRpcFallbacks,
} from "@/lib/ethereum-network"

/** @deprecated Use MAINNET_DEFAULT_RPCS */
export const SEPOLIA_DEFAULT_RPCS = MAINNET_DEFAULT_RPCS

/** @deprecated Use shouldAppendDefaultRpcFallbacks */
export const shouldAppendSepoliaFallbacks = shouldAppendDefaultRpcFallbacks

export function parseUserRpcUrls(): string[] {
  const raw = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_ETHEREUM_PROVIDER_URL || ""
  return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
}

/** Read-only HTTP provider without eth_chainId polling (avoids flaky RPC startup loops). */
export function createStaticJsonRpcProvider(rpcUrl: string) {
  const chainId = chainIdForRpcUrl(rpcUrl)
  const network = Network.from(chainId)
  return new ethers.JsonRpcProvider(rpcUrl, network, {
    staticNetwork: true,
    /** drpc.org free tier rejects batches >3; disable batching for all RPCs. */
    batchMaxCount: 1,
  })
}

export function collectRpcUrls(userUrls: string[]): string[] {
  const defaults = shouldAppendDefaultRpcFallbacks(userUrls) ? [...MAINNET_DEFAULT_RPCS] : []
  const merged = [...userUrls, ...defaults]

  const seen = new Set<string>()
  return merged.filter((u) => {
    if (seen.has(u)) return false
    seen.add(u)
    return true
  })
}
