"use server"

import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "./notification-actions"

/** True if either user has blocked the other. */
export async function areUsersBlockedPair(a: number, b: number): Promise<boolean> {
  if (a === b) return false
  try {
    const rows = await executeQuery(
      `
      SELECT 1 FROM user_blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
      LIMIT 1
      `,
      [a, b],
    )
    return rows.length > 0
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("user_blocks") && msg.includes("does not exist")) {
      return false
    }
    throw e
  }
}

export type BlockedUserRow = {
  id: number
  username: string
  avatar_url: string | null
  blocked_at: string
}

export async function listBlockedUsers(): Promise<BlockedUserRow[]> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return []

  try {
    const rows = await executeQuery(
      `
      SELECT u.id, u.username, u.avatar_url, ub.created_at AS blocked_at
      FROM user_blocks ub
      INNER JOIN users u ON u.id = ub.blocked_id
      WHERE ub.blocker_id = $1
      ORDER BY ub.created_at DESC
      `,
      [currentUser.id],
    )
    return rows as BlockedUserRow[]
  } catch {
    return []
  }
}

export async function blockUser(targetUserId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be signed in" }
    }
    if (currentUser.id === targetUserId) {
      return { success: false, message: "You cannot block yourself" }
    }

    const target = await executeQuery(`SELECT id, username FROM users WHERE id = $1`, [targetUserId])
    if (target.length === 0) {
      return { success: false, message: "User not found" }
    }

    const username = (target[0] as { username: string }).username

    await executeQuery(
      `
      DELETE FROM follows
      WHERE (follower_id = $1 AND following_id = $2)
         OR (follower_id = $2 AND following_id = $1)
      `,
      [currentUser.id, targetUserId],
    )

    const inserted = await executeQuery(
      `
      INSERT INTO user_blocks (blocker_id, blocked_id)
      VALUES ($1, $2)
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
      RETURNING blocker_id
      `,
      [currentUser.id, targetUserId],
    )

    if (inserted.length > 0) {
      await createNotification({
        userId: targetUserId,
        actorId: currentUser.id,
        type: "blocked",
      })
    }

    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/bookmarks")
    revalidatePath("/settings")
    revalidatePath("/settings/blocked")
    revalidatePath(`/profile/${username}`)
    revalidatePath(`/profile/${currentUser.username}`)

    return { success: true }
  } catch (error) {
    console.error("blockUser:", error)
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("user_blocks") && msg.includes("does not exist")) {
      return {
        success: false,
        message: "Blocks table missing. Run: psql $DATABASE_URL -f db/user-blocks.sql",
      }
    }
    return { success: false, message: "Failed to block user" }
  }
}

export async function unblockUser(targetUserId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be signed in" }
    }

    const target = await executeQuery(`SELECT username FROM users WHERE id = $1`, [targetUserId])
    const username = (target[0] as { username?: string } | undefined)?.username

    await executeQuery(
      `DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [currentUser.id, targetUserId],
    )

    revalidatePath("/")
    revalidatePath("/explore")
    revalidatePath("/bookmarks")
    revalidatePath("/settings")
    revalidatePath("/settings/blocked")
    if (username) {
      revalidatePath(`/profile/${username}`)
    }
    revalidatePath(`/profile/${currentUser.username}`)

    return { success: true }
  } catch (error) {
    console.error("unblockUser:", error)
    return { success: false, message: "Failed to unblock user" }
  }
}

export async function viewerHasBlocked(viewerId: number, targetUserId: number): Promise<boolean> {
  try {
    const rows = await executeQuery(
      `SELECT 1 FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 LIMIT 1`,
      [viewerId, targetUserId],
    )
    return rows.length > 0
  } catch {
    return false
  }
}
