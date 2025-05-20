"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletConnect } from "@/components/ico/wallet-connect"
import { TokenPurchase } from "@/components/ico/token-purchase"
import { ICOProgress } from "@/components/ico/ico-progress"
import { getTokenPriceFraction } from "@/lib/ico-contract"
import { Loader2 } from "lucide-react"

export default function ICOPage() {
  const [priceFraction, setPriceFraction] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        const fraction = await getTokenPriceFraction()
        setPriceFraction(fraction)
      } catch (error) {
        console.error("Error fetching contract data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContractData()
  }, [])

  // Mock data for ICO progress
  const currentRaised = 125.75
  const hardCap = 500
  const tokenPrice = priceFraction > 0 ? 1 / priceFraction : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Shoutr Token Sale</h1>
        <p className="text-muted-foreground">Join the future of decentralized social media</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Token Information</CardTitle>
            <CardDescription>Details about the SHOT token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Token Name</p>
                <p className="font-medium">Shoutr Token (SHOT)</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Token Price</p>
                <p className="font-medium">{tokenPrice.toFixed(6)} ETH</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Supply</p>
                <p className="font-medium">1,000,000 SHOT</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Token Type</p>
                <p className="font-medium">ERC-20</p>
              </div>
            </div>

            <ICOProgress currentRaised={currentRaised} hardCap={hardCap} />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">Sale ends in:</p>
            <div className="grid grid-cols-4 gap-2 w-full">
              {["14", "22", "45", "12"].map((value, index) => (
                <div key={index} className="bg-muted p-2 rounded-md text-center">
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 ? "Days" : index === 1 ? "Hours" : index === 2 ? "Minutes" : "Seconds"}
                  </p>
                </div>
              ))}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participate in Token Sale</CardTitle>
            <CardDescription>Connect your wallet to purchase SHOT tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WalletConnect />

            <Tabs defaultValue="buy">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy Tokens</TabsTrigger>
                <TabsTrigger value="claim">Claim Tokens</TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="pt-4">
                <TokenPurchase priceFraction={priceFraction} />
              </TabsContent>
              <TabsContent value="claim" className="pt-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Token claiming will be available after the ICO ends</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About Shoutr Token</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>
              Shoutr Token (SHOT) is the native utility token of the Shoutr platform. It powers the decentralized social
              media experience and provides holders with various benefits:
            </p>
            <ul>
              <li>
                <strong>Governance Rights:</strong> Vote on platform decisions and feature proposals
              </li>
              <li>
                <strong>Premium Features:</strong> Access exclusive platform features and capabilities
              </li>
              <li>
                <strong>Rewards:</strong> Earn tokens for creating popular content and participating in the ecosystem
              </li>
              <li>
                <strong>Reduced Fees:</strong> Pay lower fees for premium services and features
              </li>
            </ul>
            <p>
              By participating in the Shoutr Token Sale, you're not just purchasing tokens - you're becoming part of a
              revolutionary social media platform that puts users first.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
