"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getEthereumProvider } from "@/lib/ethereum-wallet"

export function WalletSessionGuard() {
  const [mismatch, setMismatch] = useState<string | null>(null)

  useEffect(() => {
    const ethereum = getEthereumProvider()
    if (!ethereum?.on) return

    const check = async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" })
        if (!meRes.ok) {
          setMismatch(null)
          return
        }
        const me = (await meRes.json()) as { wallet_address?: string | null }
        if (!me.wallet_address) {
          setMismatch(null)
          return
        }

        const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[]
        if (!accounts?.length) {
          setMismatch(null)
          return
        }

        const selected = ethers.getAddress(accounts[0])
        const sessionWallet = ethers.getAddress(me.wallet_address)
        setMismatch(selected !== sessionWallet ? selected : null)
      } catch {
        setMismatch(null)
      }
    }

    void check()

    const onAccountsChanged = () => {
      void check()
    }

    ethereum.on("accountsChanged", onAccountsChanged)
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged)
    }
  }, [])

  if (!mismatch) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg md:left-auto md:right-4">
      <Alert variant="destructive">
        <AlertDescription className="text-sm">
          Your wallet is on <span className="font-mono">{mismatch.slice(0, 6)}…{mismatch.slice(-4)}</span> but
          Shoutr is signed in with a different address.{" "}
          <Link href="/login" className="underline font-medium">
            Log out and sign in again
          </Link>{" "}
          to use this wallet.
        </AlertDescription>
      </Alert>
    </div>
  )
}
