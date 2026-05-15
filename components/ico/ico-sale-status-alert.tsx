"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { IcoStats } from "@/lib/ico-contract"

type IcoSaleStatusAlertProps = {
  stats: IcoStats
}

export function IcoSaleStatusAlert({ stats }: IcoSaleStatusAlertProps) {
  if (stats.canBuyOnChain && !stats.paused) return null

  const endedLabel = stats.endsAt.toLocaleDateString(undefined, { dateStyle: "long" })

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {stats.paused ? "Sale paused" : "Purchases unavailable"}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        {stats.paused ? (
          <p>The ICO owner has paused purchases. Unpause the contract to allow buying again.</p>
        ) : (
          <p>
            <code className="text-xs">buyTokens()</code> cannot succeed right now (sale ended on {endedLabel}, hard cap
            reached, or the contract has insufficient SHOT balance).
          </p>
        )}
        <p className="text-xs break-all">ICO contract: {stats.icoAddress}</p>
      </AlertDescription>
    </Alert>
  )
}
