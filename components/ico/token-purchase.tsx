"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { buyTokens } from "@/lib/ico-contract"

interface TokenPurchaseProps {
  priceFraction: number
}

export function TokenPurchase({ priceFraction }: TokenPurchaseProps) {
  const [amount, setAmount] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const tokenPrice = priceFraction > 0 ? 1 / priceFraction : 0
  const tokensToReceive = amount ? Number.parseFloat(amount) / tokenPrice : 0

  const handlePurchase = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)

    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum wallet found. Please install MetaMask or another wallet.")
      }

      // Convert amount to wei
      const amountInWei = ethers.utils.parseEther(amount)

      const result = await buyTokens(amountInWei.toString())

      if (result.success) {
        setSuccess(`Successfully purchased ${tokensToReceive.toFixed(2)} SHOT tokens!`)
        setTxHash(result.txHash)
        setAmount("")
      } else {
        throw new Error(result.error?.message || "Transaction failed")
      }
    } catch (err: any) {
      console.error("Error purchasing tokens:", err)
      setError(err.message || "Failed to purchase tokens")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount (ETH)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.001"
          step="0.001"
        />
        {amount && (
          <div className="text-sm text-muted-foreground">
            You will receive approximately {tokensToReceive.toFixed(2)} SHTR tokens
          </div>
        )}
      </div>

      <Button
        onClick={handlePurchase}
        disabled={isProcessing || !amount || Number.parseFloat(amount) <= 0}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Buy Tokens"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {txHash && (
        <div className="text-sm">
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View transaction on Etherscan
          </a>
        </div>
      )}
    </div>
  )
}
