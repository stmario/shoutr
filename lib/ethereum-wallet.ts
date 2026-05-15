import { ethers } from "ethers"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

type WalletRpcError = {
  code?: number
  message?: string
}

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null
  return (window as Window & { ethereum?: EthereumProvider }).ethereum ?? null
}

function parseWalletError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as WalletRpcError).message)
  }
  return "Wallet request failed"
}

function isUserRejected(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? Number((error as WalletRpcError).code)
      : NaN
  const msg = parseWalletError(error).toLowerCase()
  return code === 4001 || msg.includes("user rejected") || msg.includes("user denied")
}

/** Connected accounts without opening a prompt (may be empty). */
export async function getConnectedEthereumAddresses(): Promise<string[]> {
  const ethereum = getEthereumProvider()
  if (!ethereum) return []

  const accounts = (await ethereum.request({
    method: "eth_accounts",
  })) as string[]

  return (accounts ?? []).map((a) => ethers.getAddress(a))
}

/** Prompt the wallet and return the active account. */
export async function getSelectedEthereumAddress(): Promise<string> {
  const ethereum = getEthereumProvider()
  if (!ethereum) {
    throw new Error("No Ethereum wallet found")
  }

  const accounts = (await ethereum.request({
    method: "eth_requestAccounts",
  })) as string[]

  if (!accounts?.length) {
    throw new Error("No wallet account selected")
  }

  return ethers.getAddress(accounts[0])
}

/**
 * Open the wallet account picker when supported (MetaMask), then return the selected address.
 */
export async function pickEthereumAccount(): Promise<string> {
  const ethereum = getEthereumProvider()
  if (!ethereum) {
    throw new Error("No Ethereum wallet found")
  }

  try {
    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    })
  } catch (error) {
    if (isUserRejected(error)) {
      throw new Error("Wallet selection cancelled.")
    }
    // Wallet may not support requestPermissions — fall back to eth_requestAccounts below.
  }

  return getSelectedEthereumAddress()
}
