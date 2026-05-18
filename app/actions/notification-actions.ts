"use server"

import { db, executeQuery } from "@/lib/db"
import { notifications, shouts, comments, users, shoutDeletions, commentDeletions } from "@/lib/schema"
import { eq, desc, and, sql, count } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

const actorUser = alias(users, "actor")

export type Notification = {
  id: number
  type: string
  created_at: string
  is_read: boolean
  actor_id: number
  actor_username: string
  actor_avatar_url: string | null
  actor_is_verified: boolean
  shout_id?: number
  shout_content?: string
  comment_id?: number
  comment_content?: string
  shout_deletion_id?: number
  comment_deletion_id?: number
  deletion_reason?: string
}

export type NotificationCount = {
  count: number
}

export async function getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return []
    }

    const result = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        created_at: notifications.created_at,
        is_read: notifications.is_read,
        actor_id: notifications.actor_id,
        actor_username: actorUser.username,
        actor_avatar_url: actorUser.avatar_url,
        actor_is_verified: actorUser.is_verified,
        shout_id: notifications.shout_id,
        shout_content: shouts.content,
        comment_id: notifications.comment_id,
        comment_content: comments.content,
        shout_deletion_id: notifications.shout_deletion_id,
        comment_deletion_id: notifications.comment_deletion_id,
        shout_deletion_reason: shoutDeletions.reason,
        comment_deletion_reason: commentDeletions.reason,
        deleted_shout_content: shoutDeletions.content,
        deleted_comment_content: commentDeletions.content,
      })
      .from(notifications)
      .innerJoin(actorUser, eq(notifications.actor_id, actorUser.id))
      .leftJoin(shouts, eq(notifications.shout_id, shouts.id))
      .leftJoin(comments, eq(notifications.comment_id, comments.id))
      .leftJoin(shoutDeletions, eq(notifications.shout_deletion_id, shoutDeletions.id))
      .leftJoin(commentDeletions, eq(notifications.comment_deletion_id, commentDeletions.id))
      .where(eq(notifications.user_id, currentUser.id))
      .orderBy(desc(notifications.created_at))
      .limit(limit)
      .offset(offset)

    return (
      result as (Notification & {
        deleted_shout_content?: string
        deleted_comment_content?: string
        shout_deletion_reason?: string
        comment_deletion_reason?: string
      })[]
    ).map((row) => ({
      ...row,
      shout_content: row.shout_content ?? row.deleted_shout_content ?? undefined,
      comment_content: row.comment_content ?? row.deleted_comment_content ?? undefined,
      deletion_reason: row.shout_deletion_reason ?? row.comment_deletion_reason ?? undefined,
      is_read: row.is_read === true || row.is_read === "t" || row.is_read === "true",
      actor_is_verified: row.actor_is_verified === true,
    }))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function getUnreadNotificationCount(): Promise<NotificationCount> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { count: 0 }
    }

    const result = await executeQuery(
      `
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE user_id = $1
      AND (is_read = FALSE OR is_read IS NULL)
      `,
      [currentUser.id],
    )

    return { count: Number(result[0]?.count ?? 0) }
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return { count: 0 }
  }
}

function revalidateNotificationSurfaces() {
  revalidatePath("/notifications")
  revalidatePath("/")
}

export async function markNotificationsAsRead(): Promise<{ success: boolean }> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false }
    }

    await executeQuery(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      AND (is_read = FALSE OR is_read IS NULL)
      `,
      [currentUser.id],
    )

    revalidateNotificationSurfaces()
    return { success: true }
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return { success: false }
  }
}

export async function markNotificationAsRead(id: number): Promise<{ success: boolean }> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false }
    }

    await executeQuery(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      `,
      [id, currentUser.id],
    )

    revalidateNotificationSurfaces()
    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return { success: false }
  }
}

export async function createNotification({
  userId,
  actorId,
  type,
  shoutId,
  commentId,
  shoutDeletionId,
  commentDeletionId,
  vote_type: _voteType,
}: {
  userId: number
  actorId: number
  type: string
  shoutId?: number
  commentId?: number
  shoutDeletionId?: number
  commentDeletionId?: number
  vote_type?: number
}) {
  try {
    // Don't create notifications for yourself
    if (userId === actorId) {
      return null
    }

    // Check if a similar notification already exists (to prevent duplicates)
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.actor_id, actorId),
          eq(notifications.type, type),
          shoutId ? eq(notifications.shout_id, shoutId) : sql`1=1`,
          commentId ? eq(notifications.comment_id, commentId) : sql`1=1`,
          shoutDeletionId ? eq(notifications.shout_deletion_id, shoutDeletionId) : sql`1=1`,
          commentDeletionId ? eq(notifications.comment_deletion_id, commentDeletionId) : sql`1=1`,
        ),
      )
      .limit(1)

    if (existingNotification.length > 0) {
      // Update the existing notification to mark it as new again
      await db
        .update(notifications)
        .set({
          is_read: false,
          created_at: new Date(),
        })
        .where(eq(notifications.id, existingNotification[0].id))

      return existingNotification[0]
    }

    // Create a new notification
    const [notification] = await db
      .insert(notifications)
      .values({
        user_id: userId,
        actor_id: actorId,
        type,
        shout_id: shoutId,
        comment_id: commentId,
        shout_deletion_id: shoutDeletionId,
        comment_deletion_id: commentDeletionId,
        is_read: false,
      })
      .returning()

    revalidateNotificationSurfaces()
    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}
