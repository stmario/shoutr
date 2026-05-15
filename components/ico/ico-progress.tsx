"use client"

import { Progress } from "@/components/ui/progress"

interface ICOProgressProps {
  currentRaised: number
  hardCap: number
}

export function ICOProgress({ currentRaised, hardCap }: ICOProgressProps) {
  const progressPercentage = (currentRaised / hardCap) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progress</span>
        <span>{progressPercentage.toFixed(2)}%</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {currentRaised.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH raised
        </span>
        <span>Hard cap: {hardCap.toLocaleString("de-CH")} ETH</span>
      </div>
    </div>
  )
}
