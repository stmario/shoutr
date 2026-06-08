/** Ethereum mainnet (production). */
export const ETHEREUM_MAINNET_CHAIN_ID = 1

/** Public mainnet RPCs (drpc listed last — free tier limits JSON batch size). */
export const MAINNET_DEFAULT_RPCS = [
  "https://ethereum-rpc.publicnode.com",
  "https://1rpc.io/eth",
  "https://cloudflare-eth.com",
  "https://eth.drpc.org",
] as const

export function getConfiguredChainId(): number {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.ETHEREUM_CHAIN_ID || String(ETHEREUM_MAINNET_CHAIN_ID)
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : ETHEREUM_MAINNET_CHAIN_ID
}

export function getChainDisplayName(chainId: number = getConfiguredChainId()): string {
  if (chainId === ETHEREUM_MAINNET_CHAIN_ID) return "Ethereum"
  if (chainId === 11155111) return "Sepolia"
  if (chainId === 17000) return "Holesky"
  return `chain ${chainId}`
}

export function getExplorerTxUrl(txHash: string, chainId: number = getConfiguredChainId()): string {
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${txHash}`
  return `https://etherscan.io/tx/${txHash}`
}

export function getExplorerBaseUrl(chainId: number = getConfiguredChainId()): string {
  if (chainId === 11155111) return "https://sepolia.etherscan.io"
  return "https://etherscan.io"
}

export function getExplorerAddressUrl(address: string, chainId: number = getConfiguredChainId()): string {
  return `${getExplorerBaseUrl(chainId)}/address/${address}`
}

/** Infer chain from RPC hostname/path so static Network matches the node. */
export function chainIdForRpcUrl(rpcUrl: string): number {
  if (/sepolia/i.test(rpcUrl)) return 11155111
  if (/holesky/i.test(rpcUrl)) return 17000
  if (
    /mainnet/i.test(rpcUrl) ||
    /cloudflare-eth/i.test(rpcUrl) ||
    /\/eth(?:\/|$)/i.test(rpcUrl) ||
    /ethereum-rpc\./i.test(rpcUrl)
  ) {
    return ETHEREUM_MAINNET_CHAIN_ID
  }
  return getConfiguredChainId()
}

export function shouldAppendDefaultRpcFallbacks(userUrls: string[]): boolean {
  if (process.env.ETHEREUM_RPC_NO_DEFAULT_FALLBACKS === "1") return false
  const chainId = getConfiguredChainId()
  if (chainId === ETHEREUM_MAINNET_CHAIN_ID) return true
  if (chainId === 11155111) return true
  return userUrls.some((u) => /sepolia/i.test(u))
}

export function defaultRpcFailureHint(userUrls: string[]): string {
  if (shouldAppendDefaultRpcFallbacks(userUrls)) {
    return ` Set NEXT_PUBLIC_CHAIN_ID=${ETHEREUM_MAINNET_CHAIN_ID} and a mainnet RPC (comma-separated for fallbacks). Public fallbacks are appended after your URL unless ETHEREUM_RPC_NO_DEFAULT_FALLBACKS=1.`
  }
  return " Set ETHEREUM_RPC_URL or NEXT_PUBLIC_ETHEREUM_PROVIDER_URL to a reliable JSON-RPC endpoint for your chain (comma-separated for fallbacks)."
}
