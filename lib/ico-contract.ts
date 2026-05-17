"use client"

import { ethers } from "ethers"
import ICOABI from "./ICOABI.json"
import {
  collectRpcUrls,
  createStaticJsonRpcProvider,
  parseUserRpcUrls,
} from "./ethers-read-provider"

/** Default when END_DATE() is unavailable (16 May 2026 23:59:59 UTC). */
export const SHOUTR_ICO_END_TIMESTAMP = 1_778_975_999

export const ICO_SALE_ENDED_TITLE = "The SHOT sale has ended"

export function formatIcoEndDate(endsAt: Date): string {
  return endsAt.toLocaleDateString(undefined, { dateStyle: "long" })
}

export function getIcoSaleEndedMessage(endsAt: Date = new Date(SHOUTR_ICO_END_TIMESTAMP * 1000)): string {
  return `Thank you for your interest in SHOT. The public sale closed on ${formatIcoEndDate(endsAt)}. Purchases are no longer available here.`
}

export const ICO_SALE_PAUSED_TITLE = "Sale temporarily paused"

export function getIcoSalePausedMessage(): string {
  return "ICO purchases are paused right now. Please check back soon."
}

export function getIcoContractAddress(): string {
  const contractAddress = process.env.NEXT_PUBLIC_ICO_CONTRACT_ADDRESS
  if (!contractAddress) {
    throw new Error("ICO contract address not configured")
  }
  return contractAddress
}

export type IcoStats = {
  icoAddress: string
  tokensPerEth: bigint
  totalEthCollected: bigint
  totalTokensSold: bigint
  tokenAddress: string
  hardCapWei: bigint
  owner: string
  paused: boolean
  canBuyOnChain: boolean
  isActive: boolean
  endsAt: Date
  endTimestamp: number
}

function getRpcUrls(): string[] {
  const urls = collectRpcUrls(parseUserRpcUrls())
  if (urls.length === 0) {
    throw new Error("NEXT_PUBLIC_ETHEREUM_PROVIDER_URL is not set")
  }
  return urls
}

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  return createStaticJsonRpcProvider(getRpcUrls()[0])
}

export const getReadProvider = () => createStaticJsonRpcProvider(getRpcUrls()[0])

export const getICOContract = (providerOrSigner: ethers.ContractRunner) => {
  return new ethers.Contract(getIcoContractAddress(), ICOABI, providerOrSigner)
}

export function formatIcoError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message
    if (msg.includes("ICO ended") || msg.includes("ICO has ended")) {
      return getIcoSaleEndedMessage()
    }
    if (msg.includes("Hard cap reached")) return "The ICO hard cap (90,000 ETH) has been reached."
    if (msg.includes("Pausable: paused") || msg.includes("EnforcedPause")) {
      return "The ICO is paused. Try again later."
    }
    if (msg.includes("Send ETH") || msg.includes("send some ETH")) return "Send a positive ETH amount."
    if (msg.includes("Not enough tokens")) {
      return "Not enough SHOT left in the ICO contract. The owner must fund the contract address."
    }
    if (msg.includes("ETH amount too small")) return "ETH amount is too small for at least 1 wei of SHOT."
    if (msg.includes("user rejected")) return "Transaction rejected in your wallet."
    return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg
  }
  return "Transaction failed."
}

export function getExplorerTxUrl(txHash: string) {
  const chainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1", 10)
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${txHash}`
  if (chainId === 1) return `https://etherscan.io/tx/${txHash}`
  return `https://etherscan.io/tx/${txHash}`
}

/** Format wei as a human-readable ETH string (e.g. "1.25 ETH"). */
export function formatEthAmount(wei: bigint | string, maxFraction = 4): string {
  try {
    const value = typeof wei === "bigint" ? wei : BigInt(wei)
    const eth = ethers.formatEther(value)
    const n = Number.parseFloat(eth)
    if (!Number.isFinite(n)) return `${eth} ETH`
    return `${n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })} ETH`
  } catch {
    return "0 ETH"
  }
}

/** Format token amount in wei as SHOT (18 decimals). */
export function formatShotAmount(amountWei: bigint | string, maxFraction = 2): string {
  try {
    const value = typeof amountWei === "bigint" ? amountWei : BigInt(amountWei)
    const shot = ethers.formatUnits(value, 18)
    const n = Number.parseFloat(shot)
    if (!Number.isFinite(n)) return `${shot} SHOT`
    return `${n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })} SHOT`
  } catch {
    return "0 SHOT"
  }
}

/**
 * Current ShoutrICO: tokenAmount (wei) = ethWei * TOKENS_PER_ETH.
 * TOKENS_PER_ETH is the plain integer 10_000.
 */
export function estimateShotWeiFromEthWei(ethWei: bigint, tokensPerEth: bigint): bigint {
  if (ethWei <= 0n || tokensPerEth <= 0n) return 0n
  return ethWei * tokensPerEth
}

/** SHOT per 1 ETH (human-readable number). */
export function getShotPerEthRate(tokensPerEth: bigint): number {
  const n = Number(tokensPerEth)
  return Number.isFinite(n) ? n : 0
}

/** Estimated SHOT for an ETH amount (matches buyTokens()). */
export function estimateShotFromEth(ethAmount: string, tokensPerEth: bigint): string {
  try {
    const wei = ethers.parseEther(ethAmount || "0")
    const shotWei = estimateShotWeiFromEthWei(wei, tokensPerEth)
    return ethers.formatUnits(shotWei, 18)
  } catch {
    return "0"
  }
}

/** Locale-formatted SHOT estimate for UI copy. */
export function formatEstimateShotFromEth(
  ethAmount: string,
  tokensPerEth: bigint,
  maxFraction = 4,
): string {
  const raw = estimateShotFromEth(ethAmount, tokensPerEth)
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n) || n <= 0) return "0"
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })
}

/** ETH (wei) per 1 full SHOT token. */
export function ethPerShotWei(tokensPerEth: bigint): bigint {
  if (tokensPerEth <= 0n) return 0n
  return 10n ** 18n / tokensPerEth
}

/** Human-readable ETH price per SHOT (e.g. "0.0001 ETH"). */
export function formatEthPerShot(tokensPerEth: bigint, maxFraction = 8): string {
  const wei = ethPerShotWei(tokensPerEth)
  if (wei <= 0n) return "0 ETH"
  const eth = ethers.formatEther(wei)
  const n = Number.parseFloat(eth)
  if (!Number.isFinite(n)) return `${eth} ETH`
  return `${n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })} ETH`
}

function isSaleBlockedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return (
    msg.includes("ICO ended") ||
    msg.includes("ICO has ended") ||
    msg.includes("Hard cap reached") ||
    msg.includes("Pausable: paused") ||
    msg.includes("EnforcedPause")
  )
}

const PROBE_ETH = "0.0001"

/** Simulates a small buyTokens() — checks pause, end date, and hard cap. */
export async function probeIcoBuyOpen(provider: ethers.Provider): Promise<boolean> {
  const ico = getICOContract(provider)
  try {
    await ico.buyTokens.staticCall({ value: ethers.parseEther(PROBE_ETH) })
    return true
  } catch (error) {
    if (isSaleBlockedError(error)) return false
    return true
  }
}

async function readIcoStats(provider: ethers.Provider): Promise<IcoStats> {
  const ico = getICOContract(provider)
  const icoAddress = getIcoContractAddress()

  const [
    tokensPerEth,
    totalEthCollected,
    totalTokensSold,
    tokenAddress,
    hardCapWei,
    endTimestampBn,
    paused,
    owner,
    canBuyOnChain,
  ] = await Promise.all([
    ico.TOKENS_PER_ETH(),
    ico.totalETHCollected(),
    ico.totalTokensSold(),
    ico.token(),
    ico.HARD_CAP(),
    ico.END_DATE(),
    ico.paused(),
    ico.owner(),
    probeIcoBuyOpen(provider),
  ])

  const endTimestamp = Number(endTimestampBn) || SHOUTR_ICO_END_TIMESTAMP

  return {
    icoAddress,
    tokensPerEth,
    totalEthCollected,
    totalTokensSold,
    tokenAddress,
    hardCapWei,
    owner,
    paused,
    canBuyOnChain,
    isActive: canBuyOnChain && !paused,
    endsAt: new Date(endTimestamp * 1000),
    endTimestamp,
  }
}

export async function getIcoStats(): Promise<IcoStats> {
  const urls = getRpcUrls()
  let lastError: unknown
  for (const rpc of urls) {
    try {
      return await readIcoStats(createStaticJsonRpcProvider(rpc))
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

/** Payable buyTokens — sends ETH; SHOT is transferred from the ICO contract balance. */
export async function buyTokensWithEth(ethAmount: string) {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Connect a wallet to buy tokens")
    }

    const value = ethers.parseEther(ethAmount)
    if (value <= 0n) {
      return { success: false as const, error: new Error("Enter an ETH amount greater than zero") }
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const canBuy = await probeIcoBuyOpen(provider)
    if (!canBuy) {
      return {
        success: false as const,
        error: new Error("ICO purchases are not available (ended, paused, or hard cap reached)."),
      }
    }

    const signer = await provider.getSigner()
    const ico = getICOContract(signer)

    const tx = await ico.buyTokens({ value })
    await tx.wait()

    return { success: true as const, txHash: tx.hash as string }
  } catch (error) {
    console.error("Error buying tokens:", error)
    return { success: false as const, error }
  }
}

/** SHOT token address from the ICO contract. */
export async function getTokenAddress(): Promise<string | null> {
  try {
    const stats = await getIcoStats()
    return stats.tokenAddress
  } catch (error) {
    console.error("Error getting token address:", error)
    return null
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

export async function getWalletBalance(address: string) {
  try {
    const provider = getReadProvider()
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return "0"
  }
}

/** @deprecated Use getIcoStats().tokensPerEth */
export async function getTokenPriceFraction() {
  try {
    const stats = await getIcoStats()
    return Number(stats.tokensPerEth)
  } catch {
    return 0
  }
}
