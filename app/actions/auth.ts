"use server"

import { cookies } from "next/headers"
import { executeQuery } from "@/lib/db"

export async function getCurrentUser() {
  try {
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return null
    }

    // Basic token validation (replace with actual JWT verification if needed)
    // This is a placeholder and should be replaced with proper JWT verification
    if (token === "invalid_token") {
      return null
    }

    // Extract user ID from the token (replace with actual JWT payload extraction)
    const userId = 1 // Replace with actual user ID extraction from token

    const users = await executeQuery(
      "SELECT id, username, display_name, email, bio, avatar_url FROM users WHERE id = $1",
      [userId],
    )

    if (users.length === 0) {
      return null
    }

    return users[0]
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function signOut() {
  cookies().delete("auth_token")
  return { success: true }
}
