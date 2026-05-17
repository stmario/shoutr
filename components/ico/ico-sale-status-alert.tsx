"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CalendarCheck } from "lucide-react"
import {
  getIcoSaleEndedMessage,
  getIcoSalePausedMessage,
  ICO_SALE_ENDED_TITLE,
  ICO_SALE_PAUSED_TITLE,
  type IcoStats,
} from "@/lib/ico-contract"

type IcoSaleStatusAlertProps = {
  stats: IcoStats
}

export function IcoSaleStatusAlert({ stats }: IcoSaleStatusAlertProps) {
  if (stats.canBuyOnChain && !stats.paused) return null

  if (stats.paused) {
    return (
      <Alert variant="default" className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>{ICO_SALE_PAUSED_TITLE}</AlertTitle>
        <AlertDescription>{getIcoSalePausedMessage()}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/40">
      <CalendarCheck className="h-4 w-4 text-purple-700 dark:text-purple-300" />
      <AlertTitle className="text-purple-950 dark:text-purple-50">{ICO_SALE_ENDED_TITLE}</AlertTitle>
      <AlertDescription className="text-purple-900/90 dark:text-purple-100/90">
        {getIcoSaleEndedMessage(stats.endsAt)}
      </AlertDescription>
    </Alert>
  )
}
