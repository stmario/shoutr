const MAX_AVATAR_URL_LENGTH = 2048

/** Normalize and validate an avatar image URL; empty string clears the avatar. */
export function normalizeAvatarUrl(input: string | undefined | null): { ok: true; value: string | null } | { ok: false; message: string } {
  const trimmed = (input ?? "").trim()
  if (!trimmed) {
    return { ok: true, value: null }
  }

  if (trimmed.length > MAX_AVATAR_URL_LENGTH) {
    return { ok: false, message: "Avatar URL is too long" }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, message: "Enter a valid avatar URL (https://…)" }
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "Avatar URL must use http or https" }
  }

  return { ok: true, value: parsed.toString() }
}
