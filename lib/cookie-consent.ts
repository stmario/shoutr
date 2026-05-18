/** Bump when categories or copy change materially — prompts users to re-consent. */
export const COOKIE_CONSENT_VERSION = "1"

export const COOKIE_CONSENT_STORAGE_KEY = "shoutr_cookie_consent"

export type CookieConsentChoice = {
  version: string
  /** Always true when saved — required cookies cannot be disabled. */
  essential: true
  /** Sidebar preference cookie, theme localStorage, etc. */
  functional: boolean
  savedAt: string
}

export function parseStoredConsent(raw: string | null): CookieConsentChoice | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<CookieConsentChoice>
    if (data.version !== COOKIE_CONSENT_VERSION) return null
    if (data.essential !== true) return null
    if (typeof data.functional !== "boolean") return null
    return {
      version: COOKIE_CONSENT_VERSION,
      essential: true,
      functional: data.functional,
      savedAt: typeof data.savedAt === "string" ? data.savedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function readConsentFromStorage(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null
  return parseStoredConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY))
}

export function writeConsentToStorage(choice: Omit<CookieConsentChoice, "version" | "essential" | "savedAt"> & { functional: boolean }) {
  const payload: CookieConsentChoice = {
    version: COOKIE_CONSENT_VERSION,
    essential: true,
    functional: choice.functional,
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new CustomEvent("shoutr:cookie-consent", { detail: payload }))
  return payload
}

/** Remove functional preference data when user opts out. */
export function clearFunctionalStorage() {
  if (typeof document === "undefined") return
  document.cookie = "sidebar:state=; path=/; max-age=0"
  try {
    localStorage.removeItem("theme")
  } catch {
    /* ignore */
  }
}
