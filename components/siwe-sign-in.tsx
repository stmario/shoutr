"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SiweMessage } from "siwe"
import { BrowserProvider, ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { clearAuthSession } from "@/app/actions/auth"
import {
  getEthereumProvider,
  getSelectedEthereumAddress,
  pickEthereumAccount,
} from "@/lib/ethereum-wallet"
import { MetamaskInstallLink, MetamaskInstallPrompt } from "@/components/metamask-install-link"

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function SiweSignIn() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [sessionWallet, setSessionWallet] = useState<string | null>(null)
  const [hasWallet, setHasWallet] = useState(true)

  const refreshWallet = useCallback(async () => {
    try {
      const address = await getSelectedEthereumAddress()
      setWalletAddress(address)
      setError(null)
    } catch {
      setWalletAddress(null)
    }
  }, [])

  useEffect(() => {
    setHasWallet(Boolean(getEthereumProvider()))
    void refreshWallet()

    const ethereum = typeof window !== "undefined" ? window.ethereum : undefined
    if (!ethereum?.on) return

    const onAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts : []
      if (list.length > 0) {
        try {
          setWalletAddress(ethers.getAddress(String(list[0])))
          setError(null)
        } catch {
          void refreshWallet()
        }
      } else {
        setWalletAddress(null)
      }
    }

    ethereum.on("accountsChanged", onAccountsChanged)
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged)
    }
  }, [refreshWallet])

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (!res.ok) return
      const data = (await res.json()) as { wallet_address?: string | null }
      if (data.wallet_address) {
        setSessionWallet(ethers.getAddress(data.wallet_address))
      }
    })()
  }, [])

  const handleSwitchWallet = async () => {
    setError(null)
    setIsSwitching(true)
    try {
      await clearAuthSession()
      setSessionWallet(null)
      const address = await pickEthereumAccount()
      setWalletAddress(address)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : "Could not switch wallet.")
    } finally {
      setIsSwitching(false)
    }
  }

  const signIn = async () => {
    setError(null)

    if (typeof window === "undefined" || !window.ethereum) {
      setHasWallet(false)
      setError("Install MetaMask to sign in.")
      return
    }

    setIsLoading(true)

    try {
      if (sessionWallet) {
        await clearAuthSession()
        setSessionWallet(null)
      }

      const address = walletAddress ?? (await getSelectedEthereumAddress())
      setWalletAddress(address)

      const nonceRes = await fetch("/api/auth/siwe/nonce", { credentials: "include" })
      if (!nonceRes.ok) {
        const err = await nonceRes.json().catch(() => ({}))
        setError(err.error || "Could not start wallet sign-in.")
        return
      }
      const { nonce, chainId } = (await nonceRes.json()) as { nonce: string; chainId: number }

      let provider = new BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      if (Number(network.chainId) !== chainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          })
        } catch (switchErr) {
          console.error(switchErr)
          setError(`Please switch your wallet to the network with chain ID ${chainId} (NEXT_PUBLIC_CHAIN_ID).`)
          return
        }
        provider = new BrowserProvider(window.ethereum)
      }

      const signer = await provider.getSigner(address)
      const signerAddress = await signer.getAddress()
      if (ethers.getAddress(signerAddress) !== ethers.getAddress(address)) {
        setError("Wallet account changed during sign-in. Click Switch wallet and try again.")
        return
      }

      const domain = window.location.host
      const origin = window.location.origin

      const message = new SiweMessage({
        domain,
        address: signerAddress,
        statement: "Sign in with Ethereum to Shoutr.",
        uri: origin,
        version: "1",
        chainId,
        nonce,
      })

      const prepared = message.prepareMessage()
      const signature = await signer.signMessage(prepared)

      const verifyRes = await fetch("/api/auth/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: prepared, signature }),
      })

      const verifyJson = await verifyRes.json().catch(() => ({}))

      if (!verifyRes.ok) {
        setError(verifyJson.error || "Wallet sign-in failed.")
        return
      }

      setSessionWallet(ethers.getAddress(signerAddress))
      router.push("/")
      router.refresh()
    } catch (e) {
      console.error(e)
      if (e instanceof Error && e.message.includes("user rejected")) {
        setError("Signature rejected in your wallet.")
      } else {
        setError("Something went wrong while signing in with your wallet.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {sessionWallet && (
        <Alert>
          <AlertDescription className="text-sm">
            Signed in as <span className="font-mono">{shortenAddress(sessionWallet)}</span>. Use Switch wallet to pick
            another address, then sign in.
          </AlertDescription>
        </Alert>
      )}

      {walletAddress && (
        <p className="text-sm text-muted-foreground text-center">
          Wallet to sign in with: <span className="font-mono font-medium text-foreground">{walletAddress}</span>
        </p>
      )}

      {!hasWallet && (
        <Alert>
          <AlertDescription className="text-sm">
            <MetamaskInstallPrompt />
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            {error}
            {!hasWallet && (
              <>
                {" "}
                <MetamaskInstallLink />
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => void handleSwitchWallet()}
          disabled={isLoading || isSwitching}
        >
          {isSwitching ? "Opening wallet…" : "Switch wallet"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={() => void refreshWallet()}
          disabled={isLoading || isSwitching}
        >
          Refresh
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-purple-200 dark:border-purple-900"
        onClick={() => void signIn()}
        disabled={isLoading || isSwitching || !hasWallet}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isLoading ? "Waiting for wallet…" : "Sign in with Ethereum"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        In MetaMask: click your account icon → select another account → Switch wallet (or Refresh), then Sign in.
      </p>
    </div>
  )
}
