"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ethers } from "ethers"
import { Loader2 } from "lucide-react"
import { ShotTokenLogo } from "@/components/shot-token-logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ICOProgress } from "@/components/ico/ico-progress"
import {
  formatEthAmount,
  formatEthPerShot,
  formatShotAmount,
  getIcoStats,
  getShotPerEthRate,
  type IcoStats,
} from "@/lib/ico-contract"
import { formatShotCount, SHOT_PER_ETH } from "@/lib/shot-tokenomics"

export function IcoSidebar() {
  const pathname = usePathname()
  const [stats, setStats] = useState<IcoStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      const data = await getIcoStats()
      setStats(data)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "ICO unavailable")
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
    const interval = setInterval(() => void loadStats(), 60_000)
    return () => clearInterval(interval)
  }, [loadStats])

  if (pathname === "/ico") {
    return null
  }

  return (
    <aside className="sticky top-0 z-20 hidden h-svh max-h-svh w-[22rem] shrink-0 self-start flex-col gap-4 overflow-y-auto border-l border-border p-4 xl:flex">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShotTokenLogo size={24} />
            <CardTitle className="text-lg">SHOT token sale</CardTitle>
          </div>
          <CardDescription>Buy SHOT with ETH on Ethereum mainnet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !stats || loadError ? (
            <p className="text-sm text-muted-foreground">{loadError ?? "ICO contract not configured"}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant={stats.isActive && !stats.paused ? "default" : "secondary"}>
                  {stats.paused ? "Paused" : stats.isActive ? "Active" : "Ended"}
                </Badge>
                <Badge variant="outline">
                  Ends {stats.endsAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Rate</p>
                  <p className="font-medium">{getShotPerEthRate(stats.tokensPerEth).toLocaleString()} / ETH</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium">{formatEthPerShot(stats.tokensPerEth)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Raised</p>
                  <p className="font-medium">{formatEthAmount(stats.totalEthCollected)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sold</p>
                  <p className="font-medium">{formatShotAmount(stats.totalTokensSold)}</p>
                </div>
              </div>

              <ICOProgress
                currentRaised={Number.parseFloat(ethers.formatEther(stats.totalEthCollected))}
                hardCap={Number.parseFloat(ethers.formatEther(stats.hardCapWei))}
              />

              <p className="text-xs text-muted-foreground">
                {formatShotCount(SHOT_PER_ETH)} SHOT per 1 ETH · public sale allocation on-chain
              </p>
            </>
          )}

          <Button asChild className="w-full bg-purple-700 hover:bg-purple-800 text-white">
            <Link href="/ico">{stats?.canBuyOnChain && !stats.paused ? "Buy SHOT" : "View ICO"}</Link>
          </Button>
        </CardContent>
      </Card>
    </aside>
  )
}
