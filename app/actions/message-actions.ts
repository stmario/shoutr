"use server"

import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { getUsersTableColumns } from "@/lib/users-table-columns"
import { serializeTimestamp } from "@/lib/format-time"
import { createNotification } from "./notification-actions"
import { areUsersBlockedPair } from "./block-actions"

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
  sender_username?: string
  sender_avatar_url?: string | null
}

export interface Conversation {
  id: number
  created_at: string
  updated_at: string
  participants: {
    id: number
    username: string
    avatar_url: string | null
  }[]
  last_message?: {
    content: string
    created_at: string
    is_read: boolean
    sender_id: number
  }
  unread_count: number
}

type ConversationRow = {
  id: number
  created_at: string
  updated_at: string
  last_message?: unknown
  unread_count?: string | number
}

function parseLastMessage(raw: unknown): Conversation["last_message"] | undefined {
  let parsed: Conversation["last_message"] | undefined
  if (!raw) return undefined
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as Conversation["last_message"]
    } catch {
      return undefined
    }
  } else if (typeof raw === "object") {
    parsed = raw as Conversation["last_message"]
  }
  if (parsed?.created_at) {
    parsed.created_at = serializeTimestamp(parsed.created_at)
  }
  return parsed
}

function normalizeMessageRow(row: Message): Message {
  return {
    ...row,
    created_at: serializeTimestamp(row.created_at),
    updated_at: serializeTimestamp(row.updated_at),
  }
}

function normalizeConversation(
  row: ConversationRow,
  participants: Conversation["participants"],
): Conversation {
  return {
    id: row.id,
    created_at: serializeTimestamp(row.created_at),
    updated_at: serializeTimestamp(row.updated_at),
    last_message: parseLastMessage(row.last_message),
    unread_count: Number(row.unread_count ?? 0),
    participants,
  }
}

async function isParticipant(conversationId: number, userId: number): Promise<boolean> {
  const rows = await executeQuery(
    `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId],
  )
  return rows.length > 0
}

/** True if the current user cannot exchange messages with anyone else in this conversation (symmetric block). */
async function conversationBlockedForUser(conversationId: number, currentUserId: number): Promise<boolean> {
  const others = await executeQuery(
    `SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2`,
    [conversationId, currentUserId],
  )
  for (const row of others) {
    const otherId = Number((row as { user_id: unknown }).user_id)
    if (await areUsersBlockedPair(currentUserId, otherId)) {
      return true
    }
  }
  return false
}

async function userAllowsMessageNotification(userId: number): Promise<boolean> {
  try {
    const rows = await executeQuery(`SELECT notification_settings FROM users WHERE id = $1`, [userId])
    const settings = rows[0]?.notification_settings
    if (!settings || typeof settings !== "object") return true
    return (settings as { message_notifications?: boolean }).message_notifications !== false
  } catch {
    return true
  }
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return []

    const result = await executeQuery(
      `
      SELECT 
        c.id, 
        c.created_at, 
        c.updated_at,
        (
          SELECT json_build_object(
            'content', m.content,
            'created_at', m.created_at,
            'is_read', m.is_read,
            'sender_id', m.sender_id
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.is_read = FALSE
          AND m.sender_id != $1
        ) as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1
      ORDER BY c.updated_at DESC
      `,
      [currentUser.id],
    )

    const conversations: Conversation[] = []

    for (const row of result as ConversationRow[]) {
      const participants = await executeQuery(
        `
        SELECT u.id, u.username, u.avatar_url
        FROM users u
        JOIN conversation_participants cp ON u.id = cp.user_id
        WHERE cp.conversation_id = $1 AND u.id != $2
        `,
        [row.id, currentUser.id],
      )

      conversations.push(normalizeConversation(row, participants as Conversation["participants"]))
    }

    return conversations
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return []
  }
}

export async function getConversation(conversationId: number): Promise<Conversation | null> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return null

    if (!(await isParticipant(conversationId, currentUser.id))) {
      return null
    }

    const result = await executeQuery(
      `SELECT id, created_at, updated_at FROM conversations WHERE id = $1`,
      [conversationId],
    )

    if (result.length === 0) return null

    const participants = await executeQuery(
      `
      SELECT u.id, u.username, u.avatar_url
      FROM users u
      JOIN conversation_participants cp ON u.id = cp.user_id
      WHERE cp.conversation_id = $1
      `,
      [conversationId],
    )

    return normalizeConversation(result[0] as ConversationRow, participants as Conversation["participants"])
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return null
  }
}

export async function markConversationAsRead(conversationId: number) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return

    if (!(await isParticipant(conversationId, currentUser.id))) return

    await executeQuery(
      `
      UPDATE messages
      SET is_read = TRUE
      WHERE conversation_id = $1
      AND sender_id != $2
      AND is_read = FALSE
      `,
      [conversationId, currentUser.id],
    )

    revalidatePath("/messages")
    revalidatePath(`/messages/${conversationId}`)
  } catch (error) {
    console.error("Error marking conversation as read:", error)
  }
}

export async function getMessages(conversationId: number, options?: { markRead?: boolean }): Promise<Message[]> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return []

    if (!(await isParticipant(conversationId, currentUser.id))) {
      return []
    }

    const messages = await executeQuery(
      `
      SELECT 
        m.id, 
        m.conversation_id, 
        m.sender_id, 
        m.content, 
        m.is_read, 
        m.created_at, 
        m.updated_at,
        u.username as sender_username,
        u.avatar_url as sender_avatar_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      `,
      [conversationId],
    )

    if (options?.markRead !== false) {
      await markConversationAsRead(conversationId)
    }

    return (messages as Message[]).map(normalizeMessageRow)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

export async function sendMessage(conversationId: number, content: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to send messages" }
    }

    const trimmed = content.trim()
    if (!trimmed) {
      return { success: false, message: "Message cannot be empty" }
    }
    if (trimmed.length > 2000) {
      return { success: false, message: "Message is too long (max 2000 characters)" }
    }

    if (!(await isParticipant(conversationId, currentUser.id))) {
      return { success: false, message: "You are not a participant in this conversation" }
    }

    if (await conversationBlockedForUser(conversationId, currentUser.id)) {
      return { success: false, message: "You cannot message this user" }
    }

    const result = await executeQuery(
      `
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, created_at, conversation_id, sender_id, content, is_read, updated_at
      `,
      [conversationId, currentUser.id, trimmed],
    )

    await executeQuery(
      `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId],
    )

    const participants = await executeQuery(
      `
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = $1 AND user_id != $2
      `,
      [conversationId, currentUser.id],
    )

    for (const participant of participants) {
      const recipientId = participant.user_id as number
      if (await userAllowsMessageNotification(recipientId)) {
        await createNotification({
          userId: recipientId,
          actorId: currentUser.id,
          type: "message",
        })
      }
    }

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath("/messages")

    const row = result[0]
    return {
      success: true,
      message: normalizeMessageRow({
        id: row.id,
        conversation_id: row.conversation_id,
        sender_id: row.sender_id,
        content: row.content,
        is_read: row.is_read,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sender_username: currentUser.username,
        sender_avatar_url: currentUser.avatar_url,
      } as Message),
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, message: "Failed to send message" }
  }
}

async function findExistingConversation(participantIds: number[]) {
  try {
    const uniqueIds = [...new Set(participantIds.map(Number))].sort((a, b) => a - b)
    if (uniqueIds.length < 2) return null

    const potentialConversations = await executeQuery(
      `
      SELECT DISTINCT cp.conversation_id
      FROM conversation_participants cp
      WHERE cp.user_id = ANY($1::int[])
      `,
      [uniqueIds],
    )

    for (const { conversation_id } of potentialConversations) {
      const conversationParticipants = await executeQuery(
        `SELECT user_id FROM conversation_participants WHERE conversation_id = $1`,
        [conversation_id],
      )

      const participantUserIds = conversationParticipants
        .map((p) => Number(p.user_id))
        .sort((a, b) => a - b)

      if (
        uniqueIds.length === participantUserIds.length &&
        uniqueIds.every((id, i) => id === participantUserIds[i])
      ) {
        return { id: conversation_id as number }
      }
    }

    return null
  } catch (error) {
    console.error("Error finding existing conversation:", error)
    return null
  }
}

export async function createConversation(participantIds: number[]) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to create conversations" }
    }

    const uniqueIds = [...new Set([currentUser.id, ...participantIds.map(Number)])]

    if (uniqueIds.length < 2) {
      return { success: false, message: "Select someone to message" }
    }

    for (const pid of uniqueIds) {
      if (pid === currentUser.id) continue
      if (await areUsersBlockedPair(currentUser.id, pid)) {
        return { success: false, message: "You cannot message this user" }
      }
    }

    const existingConversation = await findExistingConversation(uniqueIds)
    if (existingConversation) {
      return { success: true, conversationId: existingConversation.id }
    }

    const conversationResult = await executeQuery(
      `INSERT INTO conversations DEFAULT VALUES RETURNING id`,
      [],
    )

    const conversationId = conversationResult[0].id as number

    for (const participantId of uniqueIds) {
      await executeQuery(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`,
        [conversationId, participantId],
      )
    }

    revalidatePath("/messages")

    return { success: true, conversationId }
  } catch (error) {
    console.error("Error creating conversation:", error)
    return { success: false, message: "Failed to create conversation" }
  }
}

export async function getUnreadMessageCount(): Promise<number> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return 0

    const result = await executeQuery(
      `
      SELECT COUNT(*)::int as count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = $1
      AND m.sender_id != $1
      AND m.is_read = FALSE
      `,
      [currentUser.id],
    )

    return Number(result[0]?.count ?? 0)
  } catch (error) {
    console.error("Error getting unread message count:", error)
    return 0
  }
}

export async function startConversation(userId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to start conversations" }
    }

    if (userId === currentUser.id) {
      return { success: false, message: "You cannot message yourself" }
    }

    if (await areUsersBlockedPair(currentUser.id, userId)) {
      return { success: false, message: "You cannot message this user" }
    }

    const target = await executeQuery(`SELECT id FROM users WHERE id = $1`, [userId])
    if (target.length === 0) {
      return { success: false, message: "User not found" }
    }

    return createConversation([userId])
  } catch (error) {
    console.error("Error starting conversation:", error)
    return { success: false, message: "Failed to start conversation" }
  }
}

export type MessageRecipient = {
  id: number
  username: string
  avatar_url: string | null
}

/** Search users to start a DM (case-insensitive username, optional wallet prefix). */
export async function searchMessageRecipients(query: string, limit = 12): Promise<MessageRecipient[]> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return []

    const q = query.trim().replace(/^@+/, "")
    if (!q) return []

    const pattern = `%${q}%`
    const prefix = `${q}%`
    const columns = await getUsersTableColumns()
    const walletSearch = /^0x[a-fA-F0-9]{4,}$/i.test(q) && columns.has("wallet_address")

    const rows = walletSearch
      ? await executeQuery(
          `
      SELECT id, username, avatar_url
      FROM users
      WHERE id != $1
      AND id NOT IN (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
      )
      AND (username ILIKE $2 OR wallet_address ILIKE $3)
      ORDER BY
        CASE WHEN LOWER(username) = LOWER($4) THEN 0
             WHEN username ILIKE $5 THEN 1
             ELSE 2 END,
        username ASC
      LIMIT $6
      `,
          [currentUser.id, pattern, prefix, q, prefix, limit],
        )
      : await executeQuery(
          `
      SELECT id, username, avatar_url
      FROM users
      WHERE id != $1
      AND id NOT IN (
        SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
        UNION
        SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
      )
      AND username ILIKE $2
      ORDER BY
        CASE WHEN LOWER(username) = LOWER($3) THEN 0
             WHEN username ILIKE $4 THEN 1
             ELSE 2 END,
        username ASC
      LIMIT $5
      `,
          [currentUser.id, pattern, q, prefix, limit],
        )

    return rows as MessageRecipient[]
  } catch (error) {
    console.error("Error searching message recipients:", error)
    return []
  }
}

/** Remove this conversation from the current user's inbox (does not delete the other participant's copy). */
export async function deleteConversation(
  conversationId: number,
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "You must be logged in" }
    }

    if (!(await isParticipant(conversationId, currentUser.id))) {
      return { success: false, message: "Conversation not found" }
    }

    await executeQuery(
      `DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, currentUser.id],
    )

    await executeQuery(
      `
      DELETE FROM conversations c
      WHERE c.id = $1
      AND NOT EXISTS (
        SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = c.id
      )
      `,
      [conversationId],
    )

    revalidatePath("/messages")
    revalidatePath(`/messages/${conversationId}`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return { success: false, message: "Failed to delete conversation" }
  }
}

export async function findConversationWithUser(otherUserId: number): Promise<number | null> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return null

    const existing = await findExistingConversation([currentUser.id, otherUserId])
    return existing?.id ?? null
  } catch {
    return null
  }
}
