import { ethers } from "ethers"
import icoAbi from "./ICOABI.json"
import {
  collectRpcUrls,
  createStaticJsonRpcProvider,
  parseUserRpcUrls,
  shouldAppendSepoliaFallbacks,
} from "./ethers-read-provider"

const erc20BalanceAbi = ["function balanceOf(address account) view returns (uint256)"]

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
    ? " For Sepolia, set NEXT_PUBLIC_CHAIN_ID=11155111 and/or use a healthy RPC (comma-separated for fallbacks). Public fallbacks are appended after your URL unless ETHEREUM_RPC_NO_DEFAULT_FALLBACKS=1."
    : " Set ETHEREUM_RPC_URL to a reliable JSON-RPC endpoint for your chain (comma-separated for fallbacks)."

  throw new Error(
    `All RPC endpoints failed after ${urls.length} attempt(s). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}.${hint}`,
  )
}

export async function walletHoldsShot(walletAddress: string): Promise<boolean> {
  const balance = await getShotBalance(walletAddress)
  return balance > 0n
}
