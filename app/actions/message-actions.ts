"use server"

import { executeQuery } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createNotification } from "./notification-actions"

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

// Get conversations for the current user
export async function getConversations() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return []
    }

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
          SELECT COUNT(*)
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

    // Get participants for each conversation
    for (const conversation of result) {
      const participants = await executeQuery(
        `
        SELECT u.id, u.username, u.avatar_url
        FROM users u
        JOIN conversation_participants cp ON u.id = cp.user_id
        WHERE cp.conversation_id = $1 AND u.id != $2
        `,
        [conversation.id, currentUser.id],
      )

      conversation.participants = participants
    }

    return result as Conversation[]
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return []
  }
}

// Get a single conversation by ID
export async function getConversation(conversationId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return null
    }

    // Check if the user is a participant in this conversation
    const participantCheck = await executeQuery(
      `
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2
      `,
      [conversationId, currentUser.id],
    )

    if (participantCheck.length === 0) {
      return null
    }

    const result = await executeQuery(
      `
      SELECT 
        c.id, 
        c.created_at, 
        c.updated_at
      FROM conversations c
      WHERE c.id = $1
      `,
      [conversationId],
    )

    if (result.length === 0) {
      return null
    }

    const conversation = result[0] as Conversation

    // Get participants
    const participants = await executeQuery(
      `
      SELECT u.id, u.username, u.avatar_url
      FROM users u
      JOIN conversation_participants cp ON u.id = cp.user_id
      WHERE cp.conversation_id = $1
      `,
      [conversationId],
    )

    conversation.participants = participants

    return conversation
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return null
  }
}

// Get messages for a conversation
export async function getMessages(conversationId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return []
    }

    // Check if the user is a participant in this conversation
    const participantCheck = await executeQuery(
      `
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2
      `,
      [conversationId, currentUser.id],
    )

    if (participantCheck.length === 0) {
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

    // Mark messages as read if they were sent by someone else
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

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath("/messages")

    return messages as Message[]
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

// Send a message
export async function sendMessage(conversationId: number, content: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to send messages" }
    }

    // Check if the user is a participant in this conversation
    const participantCheck = await executeQuery(
      `
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2
      `,
      [conversationId, currentUser.id],
    )

    if (participantCheck.length === 0) {
      return { success: false, message: "You are not a participant in this conversation" }
    }

    // Insert the message
    const result = await executeQuery(
      `
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, created_at
      `,
      [conversationId, currentUser.id, content],
    )

    // Update the conversation's updated_at timestamp
    await executeQuery(
      `
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [conversationId],
    )

    // Get other participants to notify them
    const participants = await executeQuery(
      `
      SELECT user_id FROM conversation_participants
      WHERE conversation_id = $1 AND user_id != $2
      `,
      [conversationId, currentUser.id],
    )

    // Create notifications for other participants
    for (const participant of participants) {
      await createNotification({
        userId: participant.user_id,
        actorId: currentUser.id,
        type: "message",
      })
    }

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath("/messages")

    return {
      success: true,
      message: {
        id: result[0].id,
        created_at: result[0].created_at,
      },
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, message: "Failed to send message" }
  }
}

// Create a new conversation
export async function createConversation(participantIds: number[]) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to create conversations" }
    }

    // Include the current user in participants if not already included
    if (!participantIds.includes(currentUser.id)) {
      participantIds.push(currentUser.id)
    }

    // Check if a conversation already exists with these exact participants
    const existingConversation = await findExistingConversation(participantIds)

    if (existingConversation) {
      return { success: true, conversationId: existingConversation.id }
    }

    // Create a new conversation
    const conversationResult = await executeQuery(
      `
      INSERT INTO conversations DEFAULT VALUES
      RETURNING id
      `,
      [],
    )

    const conversationId = conversationResult[0].id

    // Add participants
    for (const participantId of participantIds) {
      await executeQuery(
        `
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES ($1, $2)
        `,
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

// Helper function to find an existing conversation with the exact same participants
async function findExistingConversation(participantIds: number[]) {
  try {
    // For each potential conversation that any of these users are in
    const potentialConversations = await executeQuery(
      `
      SELECT DISTINCT cp.conversation_id
      FROM conversation_participants cp
      WHERE cp.user_id = ANY($1::int[])
      `,
      [participantIds],
    )

    for (const { conversation_id } of potentialConversations) {
      // Get all participants for this conversation
      const conversationParticipants = await executeQuery(
        `
        SELECT user_id FROM conversation_participants
        WHERE conversation_id = $1
        `,
        [conversation_id],
      )

      const participantUserIds = conversationParticipants.map((p) => p.user_id)

      // Check if the sets of participants are identical
      if (
        participantIds.length === participantUserIds.length &&
        participantIds.every((id) => participantUserIds.includes(id)) &&
        participantUserIds.every((id) => participantIds.includes(id))
      ) {
        return { id: conversation_id }
      }
    }

    return null
  } catch (error) {
    console.error("Error finding existing conversation:", error)
    return null
  }
}

// Get unread message count for the current user
export async function getUnreadMessageCount() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return 0
    }

    const result = await executeQuery(
      `
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = $1
      AND m.sender_id != $1
      AND m.is_read = FALSE
      `,
      [currentUser.id],
    )

    return Number.parseInt(result[0]?.count || "0")
  } catch (error) {
    console.error("Error getting unread message count:", error)
    return 0
  }
}

// Start a new conversation with a user
export async function startConversation(userId: number) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "You must be logged in to start conversations" }
    }

    const result = await createConversation([currentUser.id, userId])

    return result
  } catch (error) {
    console.error("Error starting conversation:", error)
    return { success: false, message: "Failed to start conversation" }
  }
}
