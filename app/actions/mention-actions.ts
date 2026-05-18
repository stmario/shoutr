"use server"

import { executeQuery } from "@/lib/db"
import { extractMentionUsernames } from "@/lib/mentions"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "./notification-actions"
import { areUsersBlockedPair } from "./block-actions"

export type MentionUserOption = {
  id: number
  username: string
  avatar_url: string | null
}

const BLOCKED_USERS_SQL = `
  SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
  UNION
  SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
`

/** Username search for @mention autocomplete (excludes self and blocked users). */
export async function searchMentionUsers(query: string, limit = 8): Promise<MentionUserOption[]> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return []

    const q = query.trim().replace(/^@+/, "")
    const capped = Math.min(Math.max(limit, 1), 12)

    if (!q) {
      const rows = await executeQuery(
        `
        SELECT u.id, u.username, u.avatar_url
        FROM users u
        WHERE u.id != $1
        AND u.id NOT IN (${BLOCKED_USERS_SQL})
        ORDER BY
          EXISTS(
            SELECT 1 FROM follows f
            WHERE f.follower_id = $1 AND f.following_id = u.id
          ) DESC,
          u.username ASC
        LIMIT $2
        `,
        [currentUser.id, capped],
      )
      return rows as MentionUserOption[]
    }

    const prefix = `${q}%`
    const rows = await executeQuery(
      `
      SELECT id, username, avatar_url
      FROM users
      WHERE id != $1
      AND id NOT IN (${BLOCKED_USERS_SQL})
      AND username ILIKE $2
      ORDER BY
        CASE WHEN LOWER(username) = LOWER($3) THEN 0
             WHEN username ILIKE $4 THEN 1
             ELSE 2 END,
        username ASC
      LIMIT $5
      `,
      [currentUser.id, prefix, q, prefix, capped],
    )
    return rows as MentionUserOption[]
  } catch (error) {
    console.error("searchMentionUsers:", error)
    return []
  }
}

async function userAllowsMentionNotification(userId: number): Promise<boolean> {
  try {
    const rows = await executeQuery(`SELECT notification_settings FROM users WHERE id = $1`, [userId])
    const settings = rows[0]?.notification_settings
    if (!settings || typeof settings !== "object") return true
    return (settings as { mention_notifications?: boolean }).mention_notifications !== false
  } catch {
    return true
  }
}

/** Notify users @mentioned in a shout or comment (skips self, blocks, unknown users). */
export async function notifyContentMentions(opts: {
  actorId: number
  content: string
  shoutId?: number
  commentId?: number
}): Promise<void> {
  const handles = extractMentionUsernames(opts.content)
  if (handles.length === 0) return

  try {
    const rows = await executeQuery(
      `SELECT id, username FROM users WHERE LOWER(username) = ANY($1::text[])`,
      [handles],
    )

    const notified = new Set<number>()

    for (const row of rows) {
      const userId = Number((row as { id: unknown }).id)
      if (!userId || userId === opts.actorId || notified.has(userId)) continue
      notified.add(userId)

      if (await areUsersBlockedPair(opts.actorId, userId)) continue
      if (!(await userAllowsMentionNotification(userId))) continue

      await createNotification({
        userId,
        actorId: opts.actorId,
        type: "mention",
        shoutId: opts.shoutId,
        commentId: opts.commentId,
      })
    }
  } catch (error) {
    console.error("notifyContentMentions:", error)
  }
}
