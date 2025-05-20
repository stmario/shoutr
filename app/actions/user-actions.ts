"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { sql } from "drizzle-orm"
import { generateToken } from "@/lib/token"
import { sendVerificationEmail } from "@/lib/resend"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

// Create a new user
export async function createUser(userData: {
  username: string
  display_name: string
  email: string
  password: string
}) {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(userData.password, 10)

    // Insert the user using Drizzle ORM
    const [newUser] = await db
      .insert(users)
      .values({
        username: userData.username,
        display_name: userData.display_name,
        email: userData.email,
        password_hash: passwordHash,
      })
      .returning()

    return { success: true, user: newUser }
  } catch (error: any) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  try {
    // Check if user exists
    const userResult = await db.select().from(users).where(sql`${users.email} = ${email}`).limit(1)

    if (userResult.length === 0) {
      return { success: false, message: "Email not found" }
    }

    const user = userResult[0]

    // Generate verification token
    const verificationToken = generateToken()

    // Save token to database
    await db.update(users).set({ verification_token: verificationToken }).where(sql`${users.id} = ${user.id}`)

    // Send verification email
    await sendVerificationEmail(email, user.display_name, verificationToken)

    return { success: true }
  } catch (error) {
    console.error("Error resending verification email:", error)
    return { success: false, message: "An error occurred while processing your request" }
  }
}

// Verify email
export async function verifyEmail(token: string) {
  try {
    // Check if token is valid
    const userResult = await db.select().from(users).where(sql`${users.verification_token} = ${token}`).limit(1)

    if (userResult.length === 0) {
      return { success: false, message: "Invalid verification token" }
    }

    const user = userResult[0]

    // Mark email as verified
    await db.update(users).set({ email_verified: true, verification_token: null }).where(sql`${users.id} = ${user.id}`)

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error verifying email:", error)
    return { success: false, message: "An error occurred while verifying your email" }
  }
}

// Follow a user
export async function followUser(currentUserId: number, userId: number) {
  try {
    await db.execute(sql`
      INSERT INTO follows (follower_id, following_id)
      VALUES (${currentUserId}, ${userId})
      ON CONFLICT (follower_id, following_id) DO NOTHING
    `)

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { error: "Failed to follow user" }
  }
}

// Unfollow a user
export async function unfollowUser(currentUserId: number, userId: number) {
  try {
    await db.execute(sql`
      DELETE FROM follows
      WHERE follower_id = ${currentUserId} AND following_id = ${userId}
    `)

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { error: "Failed to unfollow user" }
  }
}
