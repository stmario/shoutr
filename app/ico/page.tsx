"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WalletConnect } from "@/components/ico/wallet-connect"
import { TokenPurchase } from "@/components/ico/token-purchase"
import { ICOProgress } from "@/components/ico/ico-progress"
import { IcoSaleStatusAlert } from "@/components/ico/ico-sale-status-alert"
import {
  formatEthAmount,
  formatEthPerShot,
  formatShotAmount,
  getIcoStats,
  getShotPerEthRate,
  type IcoStats,
} from "@/lib/ico-contract"
import {
  formatShotCount,
  ICO_HARD_CAP_ETH,
  SHOT_DEV_ALLOCATION,
  SHOT_DEV_ALLOCATION_PERCENT,
  SHOT_PER_ETH,
  SHOT_SALE_ALLOCATION,
  SHOT_TOTAL_SUPPLY,
} from "@/lib/shot-tokenomics"
import { Loader2 } from "lucide-react"
import { ShotTokenLogo } from "@/components/shot-token-logo"
import { ShoutrExplainerVideo } from "@/components/shoutr-explainer-video"
import { formatModeratorShotThreshold } from "@/lib/moderation-shot"

export default function ICOPage() {
  const [stats, setStats] = useState<IcoStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const data = await getIcoStats()
      setStats(data)
      setLoadError(null)
    } catch (error) {
      console.error("Error fetching ICO data:", error)
      setLoadError(error instanceof Error ? error.message : "Could not load ICO contract")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats || loadError) {
    return (
      <div className="container max-w-4xl py-8 text-center">
        <p className="text-destructive">{loadError ?? "ICO contract unavailable"}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Set <code className="text-xs">NEXT_PUBLIC_ICO_CONTRACT_ADDRESS</code> and an Ethereum mainnet RPC, then deploy
          ShoutrICO.
        </p>
      </div>
    )
  }

  const ethRaisedDisplay = formatEthAmount(stats.totalEthCollected)
  const ethRaised = Number.parseFloat(ethers.formatEther(stats.totalEthCollected))
  const tokensSoldDisplay = formatShotAmount(stats.totalTokensSold)
  const pricePerShot = formatEthPerShot(stats.tokensPerEth)
  const rateShotPerEth = getShotPerEthRate(stats.tokensPerEth)
  const hardCapEth = Number.parseFloat(ethers.formatEther(stats.hardCapWei))

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <ShotTokenLogo size={64} priority />
        </div>
        <h1 className="text-4xl font-bold mb-2">Shoutr Token Sale</h1>
        <p className="text-muted-foreground">Buy SHOT with ETH through the on-chain ICO</p>
        <div className="mt-3 flex justify-center gap-2">
          <Badge variant={stats.isActive ? "default" : "secondary"}>
            {stats.paused ? "Paused" : stats.isActive ? "Sale active" : "Sale closed"}
          </Badge>
          <Badge variant="outline">
            Ends {stats.endsAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
          </Badge>
        </div>
      </div>

      <IcoSaleStatusAlert stats={stats} />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Token information</CardTitle>
            <CardDescription>ShoutrICO on-chain stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tokenomics</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total supply</p>
                  <p className="font-medium">{formatShotCount(SHOT_TOTAL_SUPPLY)} SHOT</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dev allocation</p>
                  <p className="font-medium">
                    {SHOT_DEV_ALLOCATION_PERCENT}% ({formatShotCount(SHOT_DEV_ALLOCATION)} SHOT)
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Public sale</p>
                  <p className="font-medium">{formatShotCount(SHOT_SALE_ALLOCATION)} SHOT</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ICO rate</p>
                  <p className="font-medium">{formatShotCount(SHOT_PER_ETH)} SHOT / ETH</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Token</p>
                <p className="font-medium">SHOT</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price</p>
                <p className="font-medium">{pricePerShot} / SHOT</p>
              </div>
              <div>
                <p className="text-muted-foreground">Live rate</p>
                <p className="font-medium">{rateShotPerEth.toLocaleString()} SHOT / ETH</p>
              </div>
              <div>
                <p className="text-muted-foreground">ETH raised</p>
                <p className="font-medium">{ethRaisedDisplay}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SHOT sold</p>
                <p className="font-medium">{tokensSoldDisplay}</p>
              </div>
            </div>

            <ICOProgress currentRaised={ethRaised} hardCap={hardCapEth} />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground break-all space-y-1 flex flex-col items-start">
            <p>SHOT token: {stats.tokenAddress}</p>
            <p>ICO contract (holds sale SHOT): {stats.icoAddress}</p>
            <p>Owner: {stats.owner}</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buy SHOT</CardTitle>
            <CardDescription>Send ETH to buyTokens() — SHOT is sent from the ICO contract balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <WalletConnect />
            <TokenPurchase stats={stats} onPurchased={() => void loadStats()} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>Watch the explainer, then read how the token sale and app fit together.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <ShoutrExplainerVideo embedded title="Shoutr explainer video" />
          <div className="space-y-2">
          <p>
            SHOT has a total supply of {formatShotCount(SHOT_TOTAL_SUPPLY)} tokens. {SHOT_DEV_ALLOCATION_PERCENT}% (
            {formatShotCount(SHOT_DEV_ALLOCATION)} SHOT) is reserved for the team; the remaining{" "}
            {formatShotCount(SHOT_SALE_ALLOCATION)} SHOT are offered in this sale at {formatShotCount(SHOT_PER_ETH)}{" "}
            SHOT per ETH (sale hard cap {ICO_HARD_CAP_ETH.toLocaleString("de-CH")} ETH).
          </p>
          <p>
            Connect your wallet on Ethereum mainnet, enter an ETH amount, and confirm. SHOT is transferred from the ICO
            contract to your wallet at {formatShotCount(SHOT_PER_ETH)} SHOT per 1 ETH. ETH stays in the contract until
            the owner calls <code className="text-xs">withdrawETH</code>.
          </p>
          <p>
            Before the sale, the owner must transfer the public-sale SHOT allocation to the ICO contract address (
            {stats.icoAddress.slice(0, 10)}…). No approve step is required for buyers.
          </p>
          <p>
            After you hold SHOT,{" "}
            <Link href="/staking" className="text-primary underline underline-offset-2">
              stake it on the staking page
            </Link>
            . Likes are powered by staked SHOT: 1 staked SHOT equals 1 SHOT of like weight (1:1). You need a
            staked balance above 0 to like at all.
          </p>
          <p>
            When you like a shout, the app reads your full staked balance from the staking contract and adds that
            amount to the shout total — for example, 50 staked SHOT means one like contributes 50 to the total. That
            weight is stored on your like at that moment. If you unstake later, the shout total does not change until
            you unlike, which removes the stored amount.
          </p>
          <p>
            Stake-weighted moderation: if you have more than {formatModeratorShotThreshold()} staked, you can remove
            another user&apos;s shouts and comments when your staked balance is higher than theirs. You must enter a
            reason; the author is notified. This only applies to other people&apos;s content, not your own.
          </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
