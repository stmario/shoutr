"use server"

import { db } from "@/lib/db"
import { notifications, shouts, comments, users } from "@/lib/schema"
import { eq, desc, and, sql, count } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
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
  shout_id?: number
  shout_content?: string
  comment_id?: number
  comment_content?: string
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
        shout_id: notifications.shout_id,
        shout_content: shouts.content,
        comment_id: notifications.comment_id,
        comment_content: comments.content,
      })
      .from(notifications)
      .innerJoin(actorUser, eq(notifications.actor_id, actorUser.id))
      .leftJoin(shouts, eq(notifications.shout_id, shouts.id))
      .leftJoin(comments, eq(notifications.comment_id, comments.id))
      .where(eq(notifications.user_id, currentUser.id))
      .orderBy(desc(notifications.created_at))
      .limit(limit)
      .offset(offset)

    return result as Notification[]
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

    const result = await db
      .select({
        count: count().as("count"),
      })
      .from(notifications)
      .where(and(eq(notifications.user_id, currentUser.id), eq(notifications.is_read, false)))

    return result[0] || { count: 0 }
  } catch (error) {
    console.error("Error fetching unread notification count:", error)
    return { count: 0 }
  }
}

export async function markNotificationsAsRead() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return false
    }

    await db
      .update(notifications)
      .set({ is_read: true })
      .where(and(eq(notifications.user_id, currentUser.id), eq(notifications.is_read, false)))

    return true
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return false
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return false
    }

    await db
      .update(notifications)
      .set({ is_read: true })
      .where(and(eq(notifications.id, id), eq(notifications.user_id, currentUser.id)))

    return true
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return false
  }
}

export async function createNotification({
  userId,
  actorId,
  type,
  shoutId,
  commentId,
  vote_type: _voteType,
}: {
  userId: number
  actorId: number
  type: string
  shoutId?: number
  commentId?: number
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
        is_read: false,
      })
      .returning()

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}
