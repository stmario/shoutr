"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

export async function updateProfile(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile" }
    }

    const bio = formData.get("bio") as string
    const location = formData.get("location") as string
    const website = formData.get("website") as string
    const walletAddress = formData.get("walletAddress") as string

    await db
      .update(users)
      .set({
        bio: bio || null,
        location: location || null,
        website: website || null,
        wallet_address: walletAddress || null,
        updated_at: new Date(),
      })
      .where(eq(users.id, currentUser.id))

    revalidatePath(`/profile/${currentUser.username}`)
    revalidatePath("/settings")

    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, message: "Failed to update profile" }
  }
}

export async function updateWalletAddress(userId: number, walletAddress: string) {
  try {
    await db
      .update(users)
      .set({
        wallet_address: walletAddress,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId))

    return { success: true }
  } catch (error) {
    console.error("Error updating wallet address:", error)
    return { success: false, message: "Failed to update wallet address" }
  }
}
