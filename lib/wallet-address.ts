import { ethers } from "ethers"

/** Validates and returns a checksummed address; throws on invalid input. */
export function requireChecksumAddress(address: string): string {
  return ethers.getAddress(address)
}
