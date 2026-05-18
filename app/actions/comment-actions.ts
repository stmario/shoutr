"use server"

import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { serializeTimestamp } from "@/lib/format-time"
import { createNotification } from "./notification-actions"
import { notifyContentMentions } from "./mention-actions"

export type Comment = {
  id: number
  content: string
  created_at: string
  user_id: number
  username: string
  avatar_url: string | null
  is_verified: boolean
}

function normalizeComment(row: Record<string, unknown>): Comment {
  return {
    id: Number(row.id),
    content: String(row.content ?? ""),
    created_at: serializeTimestamp(row.created_at),
    user_id: Number(row.user_id),
    username: String(row.username),
    avatar_url: row.avatar_url != null ? String(row.avatar_url) : null,
    is_verified: row.is_verified === true || row.is_verified === "t" || row.is_verified === "true",
  }
}

async function userAllowsCommentNotification(userId: number): Promise<boolean> {
  try {
    const rows = await executeQuery(`SELECT notification_settings FROM users WHERE id = $1`, [userId])
    const settings = rows[0]?.notification_settings
    if (!settings || typeof settings !== "object") return true
    return (settings as { comment_notifications?: boolean }).comment_notifications !== false
  } catch {
    return true
  }
}

export async function getCommentsForShout(shoutId: number): Promise<Comment[]> {
  try {
    const shout = await executeQuery(`SELECT id FROM shouts WHERE id = $1`, [shoutId])
    if (shout.length === 0) return []

    const rows = await executeQuery(
      `
      SELECT
        c.id,
        c.content,
        c.created_at,
        c.user_id,
        u.username,
        u.avatar_url,
        COALESCE(u.is_verified, false) as is_verified
      FROM comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.shout_id = $1
      ORDER BY c.created_at ASC
      `,
      [shoutId],
    )

    return rows.map((row) => normalizeComment(row as Record<string, unknown>))
  } catch (error) {
    console.error("Error fetching comments:", error)
    return []
  }
}

export async function postComment(shoutId: number, content: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to comment" }
    }

    const trimmed = content.trim()
    if (!trimmed) {
      return { success: false, message: "Comment cannot be empty" }
    }
    if (trimmed.length > 500) {
      return { success: false, message: "Comment is too long (max 500 characters)" }
    }

    const shoutRows = await executeQuery(`SELECT id, user_id FROM shouts WHERE id = $1`, [shoutId])
    if (shoutRows.length === 0) {
      return { success: false, message: "Shout not found" }
    }

    const shoutOwnerId = shoutRows[0].user_id as number

    const inserted = await executeQuery(
      `
      INSERT INTO comments (user_id, shout_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at, user_id
      `,
      [currentUser.id, shoutId, trimmed],
    )

    const row = inserted[0]
    const comment: Comment = {
      id: Number(row.id),
      content: String(row.content),
      created_at: serializeTimestamp(row.created_at),
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_url ?? null,
    }

    if (shoutOwnerId !== currentUser.id && (await userAllowsCommentNotification(shoutOwnerId))) {
      await createNotification({
        userId: shoutOwnerId,
        actorId: currentUser.id,
        type: "comment",
        shoutId,
        commentId: comment.id,
      })
    }

    await notifyContentMentions({
      actorId: currentUser.id,
      content: trimmed,
      shoutId,
      commentId: comment.id,
    })

    revalidatePath(`/shout/${shoutId}`)
    revalidatePath("/")

    return { success: true, comment }
  } catch (error) {
    console.error("Error posting comment:", error)
    return { success: false, message: "Failed to post comment" }
  }
}

export async function deleteComment(commentId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in" }
    }

    const rows = await executeQuery(
      `SELECT shout_id, user_id FROM comments WHERE id = $1`,
      [commentId],
    )

    if (rows.length === 0) {
      return { success: false, message: "Comment not found" }
    }

    if (rows[0].user_id !== currentUser.id) {
      return { success: false, message: "You can only delete your own comments" }
    }

    const shoutId = rows[0].shout_id as number

    await executeQuery(`DELETE FROM comments WHERE id = $1`, [commentId])

    revalidatePath(`/shout/${shoutId}`)
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting comment:", error)
    return { success: false, message: "Failed to delete comment" }
  }
}
