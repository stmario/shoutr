"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SiweMessage } from "siwe"
import { BrowserProvider } from "ethers"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SiweSignIn() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const signIn = async () => {
    setError(null)

    if (typeof window === "undefined" || !window.ethereum) {
      setError("Install an Ethereum wallet (for example MetaMask) to sign in.")
      return
    }

    setIsLoading(true)

    try {
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

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const domain = window.location.host
      const origin = window.location.origin

      const message = new SiweMessage({
        domain,
        address,
        statement: "Sign in with Ethereum to Shoutr. Token holders only.",
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

      router.push("/")
      router.refresh()
    } catch (e) {
      console.error(e)
      setError("Something went wrong while signing in with your wallet.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full border-purple-200 dark:border-purple-900"
        onClick={signIn}
        disabled={isLoading}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isLoading ? "Waiting for wallet…" : "Sign in with Ethereum (SHOT holders)"}
      </Button>
    </div>
  )
}
