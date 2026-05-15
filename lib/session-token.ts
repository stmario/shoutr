import { SignJWT, jwtVerify } from "jose"

function getJwtSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_key_for_development_only")
}

export type AuthJwtPayload = {
  id: number
  username: string
}

export async function signAuthToken(payload: AuthJwtPayload) {
  return new SignJWT({
    id: payload.id,
    username: payload.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret())
}

export async function verifyAuthToken(token: string): Promise<AuthJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    const id = typeof payload.id === "number" ? payload.id : Number(payload.id)
    if (!Number.isFinite(id)) {
      return null
    }
    return {
      id,
      username: String(payload.username ?? ""),
    }
  } catch {
    return null
  }
}
