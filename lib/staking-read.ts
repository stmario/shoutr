import { ethers } from "ethers"
import StakingABI from "./StakingABI.json"
import { defaultRpcFailureHint } from "./ethereum-network"
import {
  collectRpcUrls,
  createStaticJsonRpcProvider,
  parseUserRpcUrls,
} from "./ethers-read-provider"

export type StakedBalance = {
  amount: bigint
  decimals: number
  symbol: string
}

function getRpcUrls(): string[] {
  const urls = collectRpcUrls(parseUserRpcUrls())
  if (urls.length === 0) {
    throw new Error("NEXT_PUBLIC_ETHEREUM_PROVIDER_URL is not set")
  }
  return urls
}

function rpcFailureMessage(urlCount: number, lastError: unknown): string {
  const detail = lastError instanceof Error ? lastError.message : String(lastError)
  return `All ${urlCount} RPC endpoint(s) failed. ${detail}.${defaultRpcFailureHint(parseUserRpcUrls())}`
}

async function readStakedBalance(provider: ethers.Provider, walletAddress: string): Promise<StakedBalance> {
  const stakingAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS
  if (!stakingAddress) {
    throw new Error("Staking contract address not configured")
  }

  const code = await provider.getCode(stakingAddress)
  if (code === "0x") {
    throw new Error("Staking contract not found on the configured network")
  }

  const staking = new ethers.Contract(stakingAddress, StakingABI, provider)
  const tokenAddress: string = await staking.stakingToken()
  if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
    throw new Error("Invalid staking token address")
  }

  const token = new ethers.Contract(
    tokenAddress,
    ["function decimals() view returns (uint8)", "function symbol() view returns (string)"],
    provider,
  )

  const [stake, decimals, symbol] = await Promise.all([
    staking.stakes(walletAddress),
    token.decimals(),
    token.symbol(),
  ])

  return {
    amount: stake.amount as bigint,
    decimals: Number(decimals),
    symbol: symbol as string,
  }
}

/** Currently staked SHOT (wei) for a wallet — server-side with RPC fallbacks. */
export async function getStakedBalance(walletAddress: string): Promise<StakedBalance> {
  const normalized = ethers.getAddress(walletAddress)
  const urls = getRpcUrls()
  let lastError: unknown

  for (const rpc of urls) {
    try {
      const provider = createStaticJsonRpcProvider(rpc)
      return await readStakedBalance(provider, normalized)
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(rpcFailureMessage(urls.length, lastError))
}
