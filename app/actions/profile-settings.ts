"use server"

import { normalizeAvatarUrl } from "@/lib/avatar-url"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { requireChecksumAddress } from "@/lib/wallet-address"

export async function updateProfile(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile" }
    }

    const bio = String(formData.get("bio") ?? "").trim()
    const location = String(formData.get("location") ?? "").trim()
    const website = String(formData.get("website") ?? "").trim()
    const avatarRaw = formData.get("avatar_url")
    const avatar =
      avatarRaw === null
        ? { ok: true as const, value: undefined }
        : normalizeAvatarUrl(String(avatarRaw))

    if (!avatar.ok) {
      return { success: false, message: avatar.message }
    }

    await db
      .update(users)
      .set({
        bio: bio || null,
        location: location || null,
        website: website || null,
        ...(avatar.value !== undefined ? { avatar_url: avatar.value } : {}),
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
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.id !== userId) {
      return { success: false, message: "Unauthorized" }
    }

    const checksum = requireChecksumAddress(walletAddress)

    await db
      .update(users)
      .set({
        wallet_address: checksum,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId))

    return { success: true }
  } catch (error) {
    console.error("Error updating wallet address:", error)
    return { success: false, message: "Failed to update wallet address" }
  }
}
