import { ethers } from "ethers"
import icoAbi from "./ICOABI.json"
import { defaultRpcFailureHint } from "./ethereum-network"
import {
  collectRpcUrls,
  createStaticJsonRpcProvider,
  parseUserRpcUrls,
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
      const tokenAddress: string = await ico.token()
      const token = new ethers.Contract(tokenAddress, erc20BalanceAbi, provider)
      const balance: bigint = await token.balanceOf(walletAddress)
      return balance
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(
    `All RPC endpoints failed after ${urls.length} attempt(s). Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}.${defaultRpcFailureHint(userUrls)}`,
  )
}

export async function walletHoldsShot(walletAddress: string): Promise<boolean> {
  const balance = await getShotBalance(walletAddress)
  return balance > 0n
}
