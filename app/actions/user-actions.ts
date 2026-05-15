"use server"

import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "./notification-actions"

async function userAllowsFollowNotification(userId: number): Promise<boolean> {
  try {
    const rows = await executeQuery(
      `SELECT notification_settings FROM users WHERE id = $1`,
      [userId],
    )
    const settings = rows[0]?.notification_settings
    if (!settings || typeof settings !== "object") {
      return true
    }
    const followNotifications = (settings as { follow_notifications?: boolean }).follow_notifications
    return followNotifications !== false
  } catch {
    return true
  }
}

export async function followUser(targetUserId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { error: "You must be logged in to follow users" }
    }

    if (currentUser.id === targetUserId) {
      return { error: "You cannot follow yourself" }
    }

    const target = await executeQuery(`SELECT id, username FROM users WHERE id = $1`, [targetUserId])
    if (target.length === 0) {
      return { error: "User not found" }
    }

    await executeQuery(
      `
      INSERT INTO follows (follower_id, following_id)
      VALUES ($1, $2)
      ON CONFLICT (follower_id, following_id) DO NOTHING
    `,
      [currentUser.id, targetUserId],
    )

    if (await userAllowsFollowNotification(targetUserId)) {
      await createNotification({
        userId: targetUserId,
        actorId: currentUser.id,
        type: "follow",
      })
    }

    const username = target[0].username as string
    revalidatePath("/")
    revalidatePath(`/profile/${username}`)
    revalidatePath(`/profile/${username}/followers`)
    revalidatePath(`/profile/${username}/following`)
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { error: "Failed to follow user" }
  }
}

export async function unfollowUser(targetUserId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { error: "You must be logged in to unfollow users" }
    }

    const target = await executeQuery(`SELECT username FROM users WHERE id = $1`, [targetUserId])
    const username = target[0]?.username as string | undefined

    await executeQuery(
      `
      DELETE FROM follows
      WHERE follower_id = $1 AND following_id = $2
    `,
      [currentUser.id, targetUserId],
    )

    revalidatePath("/")
    if (username) {
      revalidatePath(`/profile/${username}`)
      revalidatePath(`/profile/${username}/followers`)
      revalidatePath(`/profile/${username}/following`)
    }
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { error: "Failed to unfollow user" }
  }
}
