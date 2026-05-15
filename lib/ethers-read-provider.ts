import { ethers, Network } from "ethers"

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
