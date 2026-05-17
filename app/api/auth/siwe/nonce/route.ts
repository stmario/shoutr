import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { generateNonce } from "siwe"
import { getConfiguredChainId } from "@/lib/ethereum-network"

const NONCE_COOKIE = "siwe_nonce"
const NONCE_MAX_AGE = 600

export async function GET() {
  const nonce = generateNonce()
  const chainId = getConfiguredChainId()

  const cookieStore = await cookies()
  cookieStore.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: NONCE_MAX_AGE,
    path: "/",
  })

  return NextResponse.json({ nonce, chainId })
}
