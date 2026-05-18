"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  clearFunctionalStorage,
  type CookieConsentChoice,
  readConsentFromStorage,
  writeConsentToStorage,
} from "@/lib/cookie-consent"

type CookieConsentContextValue = {
  consent: CookieConsentChoice | null
  ready: boolean
  hasFunctionalConsent: boolean
  saveConsent: (functional: boolean) => void
  openSettings: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider")
  }
  return ctx
}

/** Optional hook for components that may render outside provider (e.g. shared UI). */
export function useCookieConsentOptional() {
  return useContext(CookieConsentContext)
}

function CookieConsentBanner({
  onAcceptAll,
  onEssentialOnly,
  onCustomize,
}: {
  onAcceptAll: () => void
  onEssentialOnly: () => void
  onCustomize: () => void
}) {
  return (
    <aside
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/90 md:p-6"
    >
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2 text-sm text-muted-foreground max-w-3xl">
          <p id="cookie-consent-title" className="font-semibold text-foreground text-base">
            Cookies and similar technologies
          </p>
          <p id="cookie-consent-desc">
            We use essential cookies to keep you signed in and secure wallet login. With your permission, we also
            store preference data (for example sidebar layout and theme) on your device. We do not use advertising or
            analytics cookies. Read our{" "}
            <Link href="/legal/cookies" className="text-purple-700 underline underline-offset-2 hover:text-purple-800">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-purple-700 underline underline-offset-2 hover:text-purple-800">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end shrink-0">
          <Button type="button" variant="outline" onClick={onCustomize} className="order-3 sm:order-1">
            Customize
          </Button>
          <Button type="button" variant="outline" onClick={onEssentialOnly} className="order-2">
            Essential only
          </Button>
          <Button type="button" className="bg-purple-700 hover:bg-purple-800 order-1 sm:order-3" onClick={onAcceptAll}>
            Accept all
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentChoice | null>(null)
  const [ready, setReady] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [functionalDraft, setFunctionalDraft] = useState(true)

  const applyConsent = useCallback((functional: boolean) => {
    if (!functional) {
      clearFunctionalStorage()
    }
    const saved = writeConsentToStorage({ functional })
    setConsent(saved)
    setShowBanner(false)
    setSettingsOpen(false)
  }, [])

  useEffect(() => {
    const stored = readConsentFromStorage()
    setConsent(stored)
    setShowBanner(!stored)
    setFunctionalDraft(stored?.functional ?? false)
    setReady(true)

    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentChoice>).detail
      if (detail) {
        setConsent(detail)
        setShowBanner(false)
        setFunctionalDraft(detail.functional)
      }
    }
    window.addEventListener("shoutr:cookie-consent", onUpdate)
    return () => window.removeEventListener("shoutr:cookie-consent", onUpdate)
  }, [])

  const saveConsent = useCallback(
    (functional: boolean) => {
      applyConsent(functional)
    },
    [applyConsent],
  )

  const value = useMemo(
    () => ({
      consent,
      ready,
      hasFunctionalConsent: consent?.functional === true,
      saveConsent,
      openSettings: () => {
        setFunctionalDraft(consent?.functional ?? false)
        setSettingsOpen(true)
      },
    }),
    [consent, ready, saveConsent],
  )

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {ready && showBanner ? (
        <CookieConsentBanner
          onAcceptAll={() => applyConsent(true)}
          onEssentialOnly={() => applyConsent(false)}
          onCustomize={() => {
            setFunctionalDraft(false)
            setSettingsOpen(true)
          }}
        />
      ) : null}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Choose which optional technologies we may use. Essential cookies are always active because the app
              cannot work without them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label className="font-medium">Essential</Label>
                <Switch checked disabled aria-readonly />
              </div>
              <p className="text-sm text-muted-foreground">
                Session sign-in (<code className="text-xs">auth_token</code>), wallet login nonce (
                <code className="text-xs">siwe_nonce</code>). Required for authentication.
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="cookie-functional" className="font-medium">
                  Preferences (functional)
                </Label>
                <Switch
                  id="cookie-functional"
                  checked={functionalDraft}
                  onCheckedChange={setFunctionalDraft}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Mobile sidebar state cookie and theme storage in your browser. Not required to use Shoutr.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" asChild>
              <Link href="/legal/cookies">Cookie Policy</Link>
            </Button>
            <Button
              type="button"
              className="bg-purple-700 hover:bg-purple-800"
              onClick={() => applyConsent(functionalDraft)}
            >
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CookieConsentContext.Provider>
  )
}
