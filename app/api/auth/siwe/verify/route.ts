import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SiweMessage } from "siwe"
import { findOrCreateSiweUser } from "@/lib/siwe-user"
import { signAuthToken } from "@/lib/session-token"

const NONCE_COOKIE = "siwe_nonce"

/** Prefer the incoming request host so SIWE domain matches `window.location.host` (e.g. localhost vs production URL in env). */
function getVerifyDomain(hostHeader: string | null) {
  if (hostHeader) {
    return hostHeader.split(",")[0].trim()
  }
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) {
    try {
      return new URL(fromEnv).host
    } catch {
      // fall through
    }
  }
  return "localhost:3000"
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const storedNonce = cookieStore.get(NONCE_COOKIE)?.value
  if (!storedNonce) {
    return NextResponse.json({ error: "Missing or expired SIWE nonce. Request a new nonce." }, { status: 400 })
  }

  let body: { message?: string; signature?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const message = body.message
  const signature = body.signature
  if (!message || !signature) {
    return NextResponse.json({ error: "message and signature are required" }, { status: 400 })
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
  const verifyDomain = getVerifyDomain(host)

  const siwe = new SiweMessage(message)
  const result = await siwe.verify(
    {
      signature,
      nonce: storedNonce,
      domain: verifyDomain,
    },
    { suppressExceptions: true },
  )

  cookieStore.delete(NONCE_COOKIE)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error?.type || "SIWE verification failed" },
      { status: 401 },
    )
  }

  const address = result.data.address
  const user = await findOrCreateSiweUser(address)
  const token = await signAuthToken({
    id: user.id,
    username: user.username,
    email: user.email,
  })

  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  })
}
