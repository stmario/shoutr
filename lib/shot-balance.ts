import { ethers } from "ethers"
import icoAbi from "./ICOABI.json"
import { createStaticJsonRpcProvider, getConfiguredChainId } from "./ethers-read-provider"

const erc20BalanceAbi = ["function balanceOf(address account) view returns (uint256)"]

/** Public read-only Sepolia RPCs appended when URL or chain indicates Sepolia (unless `ETHEREUM_RPC_NO_DEFAULT_FALLBACKS=1`). */
const SEPOLIA_DEFAULT_RPCS = [
  "https://ethereum-sepolia.publicnode.com",
  "https://1rpc.io/sepolia",
] as const

function shouldAppendSepoliaFallbacks(userUrls: string[]): boolean {
  if (process.env.ETHEREUM_RPC_NO_DEFAULT_FALLBACKS === "1") return false
  if (getConfiguredChainId() === 11155111) return true
  return userUrls.some((u) => /sepolia/i.test(u))
}

function parseUserRpcUrls(): string[] {
  const raw = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_ETHEREUM_PROVIDER_URL || ""
  return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
}

function collectRpcUrls(userUrls: string[]): string[] {
  const defaults = shouldAppendSepoliaFallbacks(userUrls) ? [...SEPOLIA_DEFAULT_RPCS] : []
  const merged = [...userUrls, ...defaults]

  const seen = new Set<string>()
  return merged.filter((u) => {
    if (seen.has(u)) return false
    seen.add(u)
    return true
  })
}

export async function getShotBalance(walletAddress: string): Promise<bigint> {
  const userUrls = parseUserRpcUrls()
  const urls = collectRpcUrls(userUrls)
  const icoAddress = process.env.NEXT_PUBLIC_ICO_CONTRACT_ADDRESS
  if (urls.length === 0 || !icoAddress) {
    throw new Error(
      "Missing RPC URL(s). Set ETHEREUM_RPC_URL or NEXT_PUBLIC_ETHEREUM_PROVIDER_URL (comma-separated for fallbacks), and NEXT_PUBLIC_ICO_CONTRACT_ADDRESS.",
    )
  }

  let lastError: unknown
  for (const rpc of urls) {
    try {
      const provider = createStaticJsonRpcProvider(rpc)
      const ico = new ethers.Contract(icoAddress, icoAbi, provider)
      const tokenAddress: string = await ico.tokenAddress()
      const token = new ethers.Contract(tokenAddress, erc20BalanceAbi, provider)
      const balance: bigint = await token.balanceOf(walletAddress)
      return balance
    } catch (err) {
      lastError = err
    }
  }

  const hint = shouldAppendSepoliaFallbacks(userUrls)
    ? " For Sepolia, set NEXT_PUBLIC_CHAIN_ID=11155111 and/or use a healthy RPC (comma-separated fallbacks). Public fallbacks are appended after your URL unless ETHEREUM_RPC_NO_DEFAULT_FALLBACKS=1."
    : " Set ETHEREUM_RPC_URL to a reliable JSON-RPC endpoint for your chain (comma-separated for fallbacks)."

  throw new Error(
    `All RPC endpoints failed after ${urls.length} attempt(s). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}.${hint}`,
  )
}

export async function walletHoldsShot(walletAddress: string): Promise<boolean> {
  const balance = await getShotBalance(walletAddress)
  return balance > 0n
}
