import { ethers } from "ethers"

export const LIKE_CURRENCY = "SHOT"

/** Store like weight as wei string in the database. */
export function stakeAmountToWeightWei(amount: bigint): string {
  if (amount <= 0n) return "0"
  return amount.toString()
}

export function weightWeiToBigInt(weight: string | number | bigint | null | undefined): bigint {
  if (weight === null || weight === undefined) return 0n
  try {
    return BigInt(weight)
  } catch {
    return 0n
  }
}

export function formatLikeWeight(weightWei: string | number | bigint, decimals = 18, maxFraction = 2): string {
  const value = weightWeiToBigInt(weightWei)
  if (value === 0n) return "0"
  const formatted = ethers.formatUnits(value, decimals)
  const n = Number.parseFloat(formatted)
  if (!Number.isFinite(n)) return formatted
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })
}

export function formatLikeWeightCompact(weightWei: string | number | bigint, decimals = 18): string {
  const value = weightWeiToBigInt(weightWei)
  if (value === 0n) return "0"
  return ethers.formatUnits(value, decimals)
}

/** Human-readable like amount with currency label (e.g. "2.5 SHOT"). */
export function formatLikeWeightShot(
  weightWei: string | number | bigint,
  decimals = 18,
  maxFraction = 2,
  currency = LIKE_CURRENCY,
): string {
  const amount = formatLikeWeight(weightWei, decimals, maxFraction)
  return `${amount} ${currency}`
}

/** Format wei as ETH for display (e.g. treasury / gas context). */
export function formatEthFromWei(weightWei: string | number | bigint, maxFraction = 4): string {
  const value = weightWeiToBigInt(weightWei)
  if (value === 0n) return "0 ETH"
  const eth = ethers.formatEther(value)
  const n = Number.parseFloat(eth)
  if (!Number.isFinite(n)) return `${eth} ETH`
  return `${n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })} ETH`
}
