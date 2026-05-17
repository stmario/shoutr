"use client"

import { ethers } from "ethers"
import StakingABI from "./StakingABI.json"
import { getChainDisplayName } from "./ethereum-network"
import {
  collectRpcUrls,
  createStaticJsonRpcProvider,
  defaultRpcFailureHint,
  parseUserRpcUrls,
} from "./ethers-read-provider"

const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]

export type StakeInfo = {
  amount: bigint
  unlockTime: bigint
  unstakeDelay: bigint
  tokenAddress: string
  tokenSymbol: string
  tokenDecimals: number
  walletBalance: bigint
  allowance: bigint
}

function getRpcUrls(): string[] {
  const urls = collectRpcUrls(parseUserRpcUrls())
  if (urls.length === 0) {
    throw new Error(
      "NEXT_PUBLIC_ETHEREUM_PROVIDER_URL is not set. Use an Ethereum mainnet RPC (comma-separated for fallbacks).",
    )
  }
  return urls
}

function rpcFailureMessage(urlCount: number, lastError: unknown): string {
  const detail = lastError instanceof Error ? lastError.message : String(lastError)
  return `All ${urlCount} RPC endpoint(s) failed. ${detail}.${defaultRpcFailureHint(parseUserRpcUrls())}`
}

/** Read-only provider — first configured RPC (prefer collectRpcUrls + retry for reads). */
export const getReadProvider = () => createStaticJsonRpcProvider(getRpcUrls()[0])

/** Wallet provider for signing transactions (must be on the correct chain). */
export const getWalletProvider = () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Connect a wallet to send transactions")
  }
  return new ethers.BrowserProvider(window.ethereum)
}

export const getStakingContract = (providerOrSigner: ethers.ContractRunner) => {
  const contractAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error("Staking contract address not configured")
  }

  return new ethers.Contract(contractAddress, StakingABI, providerOrSigner)
}

export const getStakingContractAddress = () => process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS ?? null

const getTokenContract = (tokenAddress: string, providerOrSigner: ethers.ContractRunner) => {
  return new ethers.Contract(tokenAddress, erc20Abi, providerOrSigner)
}

async function assertStakingContractDeployed(provider: ethers.Provider) {
  const address = getStakingContractAddress()
  if (!address) {
    throw new Error("Staking contract address not configured")
  }
  const code = await provider.getCode(address)
  if (code === "0x") {
    throw new Error(
      `No staking contract at the configured address on this network. Verify NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS and NEXT_PUBLIC_ETHEREUM_PROVIDER_URL (${getChainDisplayName()}).`,
    )
  }
}

async function readStakeInfo(provider: ethers.Provider, userAddress: string): Promise<StakeInfo> {
  await assertStakingContractDeployed(provider)

  const stakingAddress = ethers.getAddress(getStakingContractAddress()!)
  const staking = getStakingContract(provider)
  const tokenAddress = await staking.stakingToken()
  if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
    throw new Error("Staking contract returned an invalid token address.")
  }
  const token = getTokenContract(tokenAddress, provider)

  const [stake, unstakeDelay, walletBalance, allowance, decimals, symbol] = await Promise.all([
    staking.stakes(userAddress),
    staking.unstakeDelay(),
    token.balanceOf(userAddress),
    token.allowance(userAddress, stakingAddress),
    token.decimals(),
    token.symbol(),
  ])

  return {
    amount: stake.amount,
    unlockTime: stake.unlockTime,
    unstakeDelay,
    tokenAddress,
    tokenSymbol: symbol,
    tokenDecimals: Number(decimals),
    walletBalance,
    allowance,
  }
}

export async function getStakeInfo(userAddress: string): Promise<StakeInfo> {
  const urls = getRpcUrls()
  let lastError: unknown

  for (const rpc of urls) {
    try {
      const provider = createStaticJsonRpcProvider(rpc)
      return await readStakeInfo(provider, userAddress)
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(rpcFailureMessage(urls.length, lastError))
}

async function getStakingTokenAddress(): Promise<string> {
  const urls = getRpcUrls()
  let lastError: unknown

  for (const rpc of urls) {
    try {
      const provider = createStaticJsonRpcProvider(rpc)
      await assertStakingContractDeployed(provider)
      const staking = getStakingContract(provider)
      const tokenAddress = await staking.stakingToken()
      if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
        throw new Error("Staking contract returned an invalid token address.")
      }
      return tokenAddress
    } catch (err) {
      lastError = err
    }
  }

  throw new Error(rpcFailureMessage(urls.length, lastError))
}

export async function approveStaking(amount: bigint, walletAddress: string) {
  try {
    const walletProvider = getWalletProvider()
    const signer = await walletProvider.getSigner(walletAddress)
    const tokenAddress = await getStakingTokenAddress()
    const token = getTokenContract(tokenAddress, signer)
    const stakingAddress = ethers.getAddress(getStakingContractAddress()!)

    const tx = await token.approve(stakingAddress, amount)
    await tx.wait()

    return { success: true as const, txHash: tx.hash as string }
  } catch (error) {
    console.error("Error approving staking token:", error)
    return { success: false as const, error }
  }
}

export async function stakeTokens(amount: bigint, walletAddress: string) {
  try {
    const walletProvider = getWalletProvider()
    const signer = await walletProvider.getSigner(walletAddress)
    const staking = getStakingContract(signer)

    const tx = await staking.stake(amount)
    await tx.wait()

    return { success: true as const, txHash: tx.hash as string }
  } catch (error) {
    console.error("Error staking tokens:", error)
    return { success: false as const, error }
  }
}

export async function unstakeTokens(walletAddress: string) {
  try {
    const walletProvider = getWalletProvider()
    const signer = await walletProvider.getSigner(walletAddress)
    const staking = getStakingContract(signer)

    const tx = await staking.unstake()
    await tx.wait()

    return { success: true as const, txHash: tx.hash as string }
  } catch (error) {
    console.error("Error unstaking tokens:", error)
    return { success: false as const, error }
  }
}

export async function connectWallet() {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send("eth_requestAccounts", [])

    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    return { success: true as const, address }
  } catch (error) {
    console.error("Error connecting wallet:", error)
    return { success: false as const, error }
  }
}

export async function getConnectedAddress(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      return null
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const accounts = await provider.listAccounts()
    if (accounts.length === 0) return null
    return accounts[0].address
  } catch {
    return null
  }
}

export function formatStakeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes("Tokens are locked")) return "Your stake is still locked. Wait until the unlock time."
    if (msg.includes("No staked tokens")) return "You have no staked tokens to withdraw."
    if (msg.includes("Amount must be greater than 0")) return "Enter an amount greater than zero."
    if (msg.includes("user rejected")) return "Transaction was rejected in your wallet."
    if (msg.includes("BAD_DATA") || msg.includes("could not decode")) {
      return `Could not read the staking contract. Check that your RPC and contract address are on ${getChainDisplayName()}.`
    }
    if (msg.includes("No staking contract")) return msg
    return msg.length > 180 ? `${msg.slice(0, 180)}…` : msg
  }
  return "Transaction failed. Please try again."
}
