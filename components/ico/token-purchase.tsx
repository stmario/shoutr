"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import {
  buyTokensWithEth,
  formatEstimateShotFromEth,
  formatIcoError,
  getExplorerTxUrl,
  getIcoSaleEndedMessage,
  getIcoSalePausedMessage,
  getShotPerEthRate,
  type IcoStats,
} from "@/lib/ico-contract"
import { MetamaskInstallLink, MetamaskInstallPrompt } from "@/components/metamask-install-link"

type TokenPurchaseProps = {
  stats: IcoStats
  onPurchased?: () => void
}

export function TokenPurchase({ stats, onPurchased }: TokenPurchaseProps) {
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [hasWallet, setHasWallet] = useState(true)

  useEffect(() => {
    setHasWallet(typeof window !== "undefined" && Boolean(window.ethereum))
  }, [])

  const tokensToReceiveDisplay = formatEstimateShotFromEth(amount, stats.tokensPerEth)
  const exampleShotDisplay = formatEstimateShotFromEth("0.1", stats.tokensPerEth)
  const rateShotPerEth = getShotPerEthRate(stats.tokensPerEth)

  const handlePurchase = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid ETH amount")
      return
    }

    if (!stats.canBuyOnChain) {
      setError(stats.paused ? getIcoSalePausedMessage() : getIcoSaleEndedMessage(stats.endsAt))
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)

    try {
      if (!window.ethereum) {
        setHasWallet(false)
        throw new Error("MetaMask is not installed.")
      }

      const result = await buyTokensWithEth(amount)

      if (result.success) {
        setSuccess(`Purchased ~${formatEstimateShotFromEth(amount, stats.tokensPerEth)} SHOT`)
        setTxHash(result.txHash)
        setAmount("")
        onPurchased?.()
      } else {
        throw result.error
      }
    } catch (err) {
      console.error("Error purchasing tokens:", err)
      setError(formatIcoError(err))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Rate: {rateShotPerEth.toLocaleString()} SHOT per 1 ETH (0.1 ETH ≈ {exampleShotDisplay} SHOT)
      </p>

      <div className="grid gap-2">
        <Label htmlFor="eth-amount">Amount (ETH)</Label>
        <Input
          id="eth-amount"
          type="number"
          placeholder="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.0001"
          step="any"
          disabled={!stats.canBuyOnChain || isProcessing}
        />
        {amount && Number.parseFloat(amount) > 0 && (
          <p className="text-sm text-muted-foreground">
            You receive approximately {tokensToReceiveDisplay} SHOT
          </p>
        )}
      </div>

      {!hasWallet && <MetamaskInstallPrompt />}

      <Button
        onClick={handlePurchase}
        disabled={
          isProcessing || !hasWallet || !stats.canBuyOnChain || !amount || Number.parseFloat(amount) <= 0
        }
        className="w-full"
      >
        {isProcessing
          ? "Confirm in wallet…"
          : stats.canBuyOnChain
            ? "Buy SHOT with ETH"
            : stats.paused
              ? "Sale paused"
              : "Sale ended"}
      </Button>

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

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {txHash && (
        <p className="text-sm">
          <a
            href={getExplorerTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            View transaction
          </a>
        </p>
      )}
    </div>
  )
}
