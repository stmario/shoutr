"use server"

import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"

export interface ProfileSettings {
  display_name?: string
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
  push_notifications?: boolean
  mention_notifications?: boolean
  follow_notifications?: boolean
  like_notifications?: boolean
  reshout_notifications?: boolean
  comment_notifications?: boolean
  message_notifications?: boolean
}

export interface SecuritySettings {
  current_password: string
  new_password: string
  confirm_password: string
}

// Update profile settings
export async function updateProfileSettings(settings: ProfileSettings) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile" }
    }

    const updates = []
    const values = []
    let paramIndex = 1

    if (settings.display_name !== undefined) {
      updates.push(`display_name = $${paramIndex}`)
      values.push(settings.display_name)
      paramIndex++
    }

    if (settings.bio !== undefined) {
      updates.push(`bio = $${paramIndex}`)
      values.push(settings.bio)
      paramIndex++
    }

    if (settings.avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex}`)
      values.push(settings.avatar_url)
      paramIndex++
    }

    if (settings.location !== undefined) {
      updates.push(`location = $${paramIndex}`)
      values.push(settings.location)
      paramIndex++
    }

    if (settings.website !== undefined) {
      updates.push(`website = $${paramIndex}`)
      values.push(settings.website)
      paramIndex++
    }

    if (updates.length === 0) {
      return { success: false, message: "No changes to update" }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    values.push(currentUser.id)

    const result = await executeQuery(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} 
       RETURNING id, username, display_name, bio, avatar_url, location, website, updated_at`,
      values,
    )

    revalidatePath(`/profile/${currentUser.username}`)
    revalidatePath("/settings")

    return { success: true, user: result[0] }
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

    const updates = []
    const values = []
    let paramIndex = 1

    if (settings.email !== undefined) {
      // Check if email is already in use
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

      // Set email_verified to false since the email has changed
      updates.push(`email_verified = false`)
    }

    if (settings.username !== undefined) {
      // Check if username is already in use
      const usernameCheck = await executeQuery("SELECT id FROM users WHERE username = $1 AND id != $2", [
        settings.username,
        currentUser.id,
      ])

      if (usernameCheck.length > 0) {
        return { success: false, message: "Username is already in use" }
      }

      updates.push(`username = $${paramIndex}`)
      values.push(settings.username)
      paramIndex++
    }

    if (updates.length === 0) {
      return { success: false, message: "No changes to update" }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    values.push(currentUser.id)

    const result = await executeQuery(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} 
       RETURNING id, username, email, updated_at`,
      values,
    )

    revalidatePath(`/profile/${result[0].username}`)
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
           "push_notifications": true,
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
        push_notifications: true,
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
        push_notifications: true,
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

// Change password
export async function changePassword(settings: SecuritySettings) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to change your password" }
    }

    // Verify current password
    const userResult = await executeQuery(`SELECT password_hash FROM users WHERE id = $1`, [currentUser.id])

    if (userResult.length === 0) {
      return { success: false, message: "User not found" }
    }

    const passwordMatch = await bcrypt.compare(settings.current_password, userResult[0].password_hash)

    if (!passwordMatch) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Check if new password and confirm password match
    if (settings.new_password !== settings.confirm_password) {
      return { success: false, message: "New password and confirm password do not match" }
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(settings.new_password, 10)

    // Update password
    await executeQuery(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
      newPasswordHash,
      currentUser.id,
    ])

    return { success: true, message: "Password changed successfully" }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, message: "Failed to change password" }
  }
}

// Delete account
export async function deleteAccount(password: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to delete your account" }
    }

    // Verify password
    const userResult = await executeQuery(`SELECT password_hash FROM users WHERE id = $1`, [currentUser.id])

    if (userResult.length === 0) {
      return { success: false, message: "User not found" }
    }

    const passwordMatch = await bcrypt.compare(password, userResult[0].password_hash)

    if (!passwordMatch) {
      return { success: false, message: "Password is incorrect" }
    }

    // Delete user
    await executeQuery(`DELETE FROM users WHERE id = $1`, [currentUser.id])

    return { success: true, message: "Account deleted successfully" }
  } catch (error) {
    console.error("Error deleting account:", error)
    return { success: false, message: "Failed to delete account" }
  }
}
