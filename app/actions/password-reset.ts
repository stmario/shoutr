"use server"

import { executeQuery } from "@/lib/db"
import { generateToken } from "@/lib/token"
import { sendPasswordResetEmail } from "@/lib/resend"
import bcrypt from "bcryptjs"

// Request a password reset
export async function requestPasswordReset(email: string) {
  try {
    // Check if user exists
    const userResult = await executeQuery("SELECT id, username, display_name FROM users WHERE email = $1", [email])

    if (userResult.length === 0) {
      // Don't reveal that the email doesn't exist for security reasons
      return { success: true }
    }

    const user = userResult[0]

    // Generate reset token
    const resetToken = generateToken()

    // Set expiration time (1 hour from now)
    const expirationTime = new Date()
    expirationTime.setHours(expirationTime.getHours() + 1)

    // Save token to database
    await executeQuery("UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3", [
      resetToken,
      expirationTime,
      user.id,
    ])

    // Send reset email
    await sendPasswordResetEmail(email, user.display_name, resetToken)

    return { success: true }
  } catch (error) {
    console.error("Error requesting password reset:", error)
    return { success: false, message: "An error occurred while processing your request" }
  }
}

// Verify reset token
export async function verifyResetToken(token: string) {
  try {
    const result = await executeQuery(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()",
      [token],
    )

    return { valid: result.length > 0 }
  } catch (error) {
    console.error("Error verifying reset token:", error)
    return { valid: false }
  }
}

// Reset password
export async function resetPassword(token: string, newPassword: string) {
  try {
    // Verify token is valid and not expired
    const userResult = await executeQuery(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()",
      [token],
    )

    if (userResult.length === 0) {
      return { success: false, message: "Invalid or expired reset token" }
    }

    const userId = userResult[0].id

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    await executeQuery(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2",
      [passwordHash, userId],
    )

    return { success: true }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, message: "An error occurred while resetting your password" }
  }
}
