/** SHOT tokenomics (fixed allocation; ICO rate matches on-chain tokensPerETH). */

export const SHOT_TOTAL_SUPPLY = 1_000_000_000
export const SHOT_DEV_ALLOCATION_PERCENT = 10
export const SHOT_DEV_ALLOCATION = (SHOT_TOTAL_SUPPLY * SHOT_DEV_ALLOCATION_PERCENT) / 100
export const SHOT_SALE_ALLOCATION = SHOT_TOTAL_SUPPLY - SHOT_DEV_ALLOCATION
export const SHOT_PER_ETH = 10_000

/** Max ETH raise if the full public sale allocation sells out at SHOT_PER_ETH. */
export const ICO_HARD_CAP_ETH = SHOT_SALE_ALLOCATION / SHOT_PER_ETH

export function formatShotCount(value: number): string {
  return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(value)
}
