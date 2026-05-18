"use client"

import { Button } from "@/components/ui/button"
import { useCookieConsent } from "@/components/cookie-consent-provider"

export function CookiePreferencesButton() {
  const { openSettings } = useCookieConsent()

  return (
    <Button type="button" variant="link" className="h-auto p-0 text-purple-700" onClick={openSettings}>
      Cookie preferences
    </Button>
  )
}
