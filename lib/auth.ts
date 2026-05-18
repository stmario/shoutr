"use server"

import { cookies } from "next/headers"
import { db } from "./db"
import { users } from "./schema"
import { eq } from "drizzle-orm"
import { verifyAuthToken } from "./session-token"

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete({ name: "auth_token", path: "/" })
  return { success: true }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return null
    }

    const payload = await verifyAuthToken(token)
    if (!payload) {
      return null
    }

    // Add retry logic for database queries
    let retries = 3
    let userResults = null

    while (retries > 0) {
      try {
        userResults = await db
          .select({
            id: users.id,
            username: users.username,
            bio: users.bio,
            location: users.location,
            website: users.website,
            avatar_url: users.avatar_url,
            wallet_address: users.wallet_address,
          })
          .from(users)
          .where(eq(users.id, payload.id))
          .limit(1)

        break // If successful, exit the loop
      } catch (error) {
        retries--
        if (retries === 0) throw error // Re-throw if all retries failed

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (3 - retries)))
      }
    }

    if (!userResults || userResults.length === 0) {
      return null
    }

    const row = userResults[0]
    if (!row.wallet_address) {
      return null
    }
    return row
  } catch (error) {
    const digest = typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: string }).digest) : ""
    if (
      digest === "DYNAMIC_SERVER_USAGE" ||
      (error instanceof Error && error.message.includes("Dynamic server usage"))
    ) {
      return null
    }

    console.error("Get current user error:", error)

    // For rate limiting errors, return a mock user to prevent cascading failures
    if (
      error instanceof Error &&
      error.message &&
      (error.message.includes("Too Many Requests") ||
        error.message.includes("rate limit") ||
        error.message.includes("not valid JSON"))
    ) {
      console.log("Rate limit detected, returning mock user")
      return {
        id: 1,
        username: "demo_user",
        bio: "This is a fallback user due to rate limiting",
        avatar_url: null,
        wallet_address: null,
      }
    }

    return null
  }
}

