"use server"

import { db, executeQuery } from "@/lib/db"
import { reshouts, shouts } from "@/lib/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "./notification-actions"

function revalidateReshoutPaths() {
  revalidatePath("/")
  revalidatePath("/profile")
}

export async function getShoutReshoutStatus(shoutId: number): Promise<{
  reshouted: boolean
  count: number
}> {
  const currentUser = await getCurrentUser()

  const countRows = await executeQuery<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM reshouts WHERE shout_id = $1`,
    [shoutId],
  )
  const count = Number(countRows[0]?.count ?? 0)

  if (!currentUser) {
    return { reshouted: false, count }
  }

  const existing = await db
    .select({ user_id: reshouts.user_id })
    .from(reshouts)
    .where(and(eq(reshouts.user_id, currentUser.id), eq(reshouts.shout_id, shoutId)))
    .limit(1)

  return { reshouted: existing.length > 0, count }
}

export async function toggleReshout(shoutId: number): Promise<{
  success: boolean
  reshouted?: boolean
  count?: number
  message?: string
}> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to reshout" }
    }

    const shoutRows = await db
      .select({ user_id: shouts.user_id })
      .from(shouts)
      .where(eq(shouts.id, shoutId))
      .limit(1)

    if (shoutRows.length === 0) {
      return { success: false, message: "Shout not found" }
    }

    const ownerId = shoutRows[0].user_id

    if (ownerId === currentUser.id) {
      return { success: false, message: "You cannot reshout your own shout" }
    }

    const existing = await db
      .select({ user_id: reshouts.user_id })
      .from(reshouts)
      .where(and(eq(reshouts.user_id, currentUser.id), eq(reshouts.shout_id, shoutId)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .delete(reshouts)
        .where(and(eq(reshouts.user_id, currentUser.id), eq(reshouts.shout_id, shoutId)))

      const countRows = await executeQuery<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM reshouts WHERE shout_id = $1`,
        [shoutId],
      )

      revalidateReshoutPaths()
      return {
        success: true,
        reshouted: false,
        count: Number(countRows[0]?.count ?? 0),
      }
    }

    await db.insert(reshouts).values({
      user_id: currentUser.id,
      shout_id: shoutId,
    })

    await createNotification({
      userId: ownerId,
      actorId: currentUser.id,
      type: "reshout",
      shoutId,
    })

    const countRows = await executeQuery<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM reshouts WHERE shout_id = $1`,
      [shoutId],
    )

    revalidateReshoutPaths()
    return {
      success: true,
      reshouted: true,
      count: Number(countRows[0]?.count ?? 0),
    }
  } catch (error) {
    console.error("Error toggling reshout:", error)
    return { success: false, message: "Failed to reshout" }
  }
}
