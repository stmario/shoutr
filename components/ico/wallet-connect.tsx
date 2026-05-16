"use client"

import { useState, useEffect } from "react"
import { BrowserProvider, ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { connectWallet, formatEthAmount, getWalletBalance } from "@/lib/ico-contract"
import { MetamaskInstallLink, MetamaskInstallPrompt } from "@/components/metamask-install-link"

export function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasWallet, setHasWallet] = useState(true)

  useEffect(() => {
    setHasWallet(typeof window !== "undefined" && Boolean(window.ethereum))
  }, [])

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()
      if (accounts.length > 0) {
        const address = accounts[0].address
        setAccount(address)
        const bal = await getWalletBalance(address)
        setBalance(formatEthAmount(ethers.parseEther(bal), 4))
      }
    }
    void checkConnection()
  }, [])

  const handleConnect = async () => {
    if (!window.ethereum) {
      setHasWallet(false)
      setError("MetaMask is not installed.")
      return
    }

    setIsConnecting(true)
    setError(null)
    try {
      const result = await connectWallet()
      if (result.success) {
        setAccount(result.address)
        const bal = await getWalletBalance(result.address)
        setBalance(formatEthAmount(ethers.parseEther(bal), 4))
      } else {
        setError("Failed to connect wallet")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}…${address.slice(-4)}`

  return (
    <div className="flex flex-col gap-4">
      {!hasWallet && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <MetamaskInstallPrompt />
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
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

      {!account ? (
        <Button onClick={handleConnect} disabled={isConnecting || !hasWallet} className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          {isConnecting ? "Connecting…" : "Connect wallet"}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-md bg-muted p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="font-medium">{formatAddress(account)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setAccount(null); setBalance(null) }}>
              Disconnect
            </Button>
          </div>
          {balance !== null && (
            <p className="text-sm text-muted-foreground">Balance: {balance}</p>
          )}
        </div>
      )}
    </div>
  )
}
