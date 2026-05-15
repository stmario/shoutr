const MAX_IMAGE_URL_LENGTH = 2048

/** Normalize and validate a public image URL (http/https). Empty input → null. */
export function normalizeImageUrl(
  input: string | undefined | null,
): { ok: true; value: string | null } | { ok: false; message: string } {
  const trimmed = (input ?? "").trim()
  if (!trimmed) {
    return { ok: true, value: null }
  }

  if (trimmed.length > MAX_IMAGE_URL_LENGTH) {
    return { ok: false, message: "Image URL is too long" }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, message: "Enter a valid image URL (https://…)" }
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "Image URL must use http or https" }
  }

  return { ok: true, value: parsed.toString() }
}
