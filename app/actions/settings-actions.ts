"use server"

import { cookies } from "next/headers"
import { normalizeAvatarUrl } from "@/lib/avatar-url"
import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { validateUsernameForWallet } from "@/lib/ens-username-guard"
import { refreshUserEnsVerified } from "@/lib/ens-verified"
import { getUsersTableColumns, pickExistingColumns } from "@/lib/users-table-columns"
import { joinSafePgIdentifiers } from "@/lib/sql-identifiers"

export interface ProfileSettings {
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
}

export interface AccountSettings {
  email?: string
  username?: string
}

export interface NotificationSettings {
  email_notifications?: boolean
  mention_notifications?: boolean
  follow_notifications?: boolean
  like_notifications?: boolean
  reshout_notifications?: boolean
  comment_notifications?: boolean
  message_notifications?: boolean
}

export async function updateProfileSettings(settings: ProfileSettings) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile" }
    }

    const columns = await getUsersTableColumns()
    const updates = []
    const values = []
    let paramIndex = 1

    if (settings.bio !== undefined && columns.has("bio")) {
      updates.push(`bio = $${paramIndex}`)
      values.push(settings.bio)
      paramIndex++
    }

    if (settings.avatar_url !== undefined && columns.has("avatar_url")) {
      const avatar = normalizeAvatarUrl(settings.avatar_url)
      if (!avatar.ok) {
        return { success: false, message: avatar.message }
      }
      updates.push(`avatar_url = $${paramIndex}`)
      values.push(avatar.value)
      paramIndex++
    }

    if (settings.location !== undefined && columns.has("location")) {
      updates.push(`location = $${paramIndex}`)
      values.push(settings.location.trim() || null)
      paramIndex++
    }

    if (settings.website !== undefined && columns.has("website")) {
      updates.push(`website = $${paramIndex}`)
      values.push(settings.website.trim() || null)
      paramIndex++
    }

    if (updates.length === 0) {
      return { success: false, message: "No changes to update" }
    }

    if (columns.has("updated_at")) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`)
    }

    values.push(currentUser.id)

    const returning = pickExistingColumns(columns, [
      "id",
      "username",
      "bio",
      "avatar_url",
      "location",
      "website",
      "updated_at",
    ])
    const returningClause = returning.length > 0 ? ` RETURNING ${joinSafePgIdentifiers(returning)}` : ""

    const result = await executeQuery(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex}${returningClause}`,
      values,
    )

    revalidatePath(`/profile/${currentUser.username}`)
    revalidatePath("/settings")

    return { success: true, user: result[0] ?? { id: currentUser.id } }
  } catch (error) {
    console.error("Error updating profile settings:", error)
    return { success: false, message: "Failed to update profile settings" }
  }
}

// Update account settings
export async function updateAccountSettings(settings: AccountSettings) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your account" }
    }

    const columns = await getUsersTableColumns()
    const updates = []
    const values = []
    let paramIndex = 1

    if (settings.email !== undefined && columns.has("email")) {
      const emailCheck = await executeQuery("SELECT id FROM users WHERE email = $1 AND id != $2", [
        settings.email,
        currentUser.id,
      ])

      if (emailCheck.length > 0) {
        return { success: false, message: "Email is already in use" }
      }

      updates.push(`email = $${paramIndex}`)
      values.push(settings.email)
      paramIndex++
    }

    if (settings.username !== undefined && columns.has("username")) {
      // Check if username is already in use
      const usernameCheck = await executeQuery("SELECT id FROM users WHERE username = $1 AND id != $2", [
        settings.username,
        currentUser.id,
      ])

      if (usernameCheck.length > 0) {
        return { success: false, message: "Username is already in use" }
      }

      if (currentUser.wallet_address) {
        const ensCheck = await validateUsernameForWallet(settings.username, currentUser.wallet_address)
        if (!ensCheck.ok) {
          return { success: false, message: ensCheck.message }
        }
      }

      updates.push(`username = $${paramIndex}`)
      values.push(settings.username)
      paramIndex++
    }

    if (updates.length === 0) {
      return { success: false, message: "No changes to update" }
    }

    if (columns.has("updated_at")) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`)
    }

    values.push(currentUser.id)

    const returning = pickExistingColumns(columns, ["id", "username", "email", "updated_at"])
    const returningClause = returning.length > 0 ? ` RETURNING ${joinSafePgIdentifiers(returning)}` : ""

    const result = await executeQuery(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex}${returningClause}`,
      values,
    )

    const newUsername =
      (result[0] as { username?: string } | undefined)?.username ?? settings.username ?? currentUser.username

    if (currentUser.wallet_address) {
      await refreshUserEnsVerified(currentUser.id, newUsername, currentUser.wallet_address).catch(() => undefined)
    }

    revalidatePath(`/profile/${newUsername}`)
    revalidatePath("/settings")

    return { success: true, user: result[0] }
  } catch (error) {
    console.error("Error updating account settings:", error)
    return { success: false, message: "Failed to update account settings" }
  }
}

// Update notification settings
export async function updateNotificationSettings(settings: NotificationSettings) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your notification settings" }
    }

    // Check if notification_settings column exists, if not, add it
    const columnCheck = await executeQuery(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name = 'notification_settings'`,
      [],
    )

    if (columnCheck.length === 0) {
      await executeQuery(
        `ALTER TABLE users 
         ADD COLUMN notification_settings JSONB DEFAULT '{
           "email_notifications": true,
           "mention_notifications": true,
           "follow_notifications": true,
           "like_notifications": true,
           "reshout_notifications": true,
           "comment_notifications": true,
           "message_notifications": true
         }'::jsonb`,
        [],
      )
    }

    // Get current notification settings
    const currentSettings = await executeQuery(`SELECT notification_settings FROM users WHERE id = $1`, [
      currentUser.id,
    ])

    // Merge current settings with new settings
    const mergedSettings = {
      ...(currentSettings[0]?.notification_settings || {}),
      ...settings,
    }

    // Update notification settings
    await executeQuery(`UPDATE users SET notification_settings = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
      JSON.stringify(mergedSettings),
      currentUser.id,
    ])

    revalidatePath("/settings")

    return { success: true, settings: mergedSettings }
  } catch (error) {
    console.error("Error updating notification settings:", error)
    return { success: false, message: "Failed to update notification settings" }
  }
}

// Get notification settings
export async function getNotificationSettings() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return null
    }

    // Check if notification_settings column exists
    const columnCheck = await executeQuery(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'users' AND column_name = 'notification_settings'`,
      [],
    )

    if (columnCheck.length === 0) {
      // Return default settings if column doesn't exist
      return {
        email_notifications: true,
        mention_notifications: true,
        follow_notifications: true,
        like_notifications: true,
        reshout_notifications: true,
        comment_notifications: true,
        message_notifications: true,
      }
    }

    // Get notification settings
    const result = await executeQuery(`SELECT notification_settings FROM users WHERE id = $1`, [currentUser.id])

    return (
      result[0]?.notification_settings || {
        email_notifications: true,
        mention_notifications: true,
        follow_notifications: true,
        like_notifications: true,
        reshout_notifications: true,
        comment_notifications: true,
        message_notifications: true,
      }
    )
  } catch (error) {
    console.error("Error getting notification settings:", error)
    return null
  }
}

// Delete account (confirm by typing your username exactly)
export async function deleteAccount(confirmationUsername: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to delete your account" }
    }

    if (confirmationUsername.trim() !== currentUser.username) {
      return { success: false, message: "Username does not match. Type your exact username to confirm." }
    }

    await executeQuery(`DELETE FROM users WHERE id = $1`, [currentUser.id])

    const cookieStore = await cookies()
    cookieStore.delete({ name: "auth_token", path: "/" })

    return { success: true, message: "Account deleted successfully" }
  } catch (error) {
    console.error("Error deleting account:", error)
    return { success: false, message: "Failed to delete account" }
  }
}
