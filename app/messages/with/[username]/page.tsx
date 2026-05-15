import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import { startConversation } from "@/app/actions/message-actions"

interface MessageWithUserPageProps {
  params: Promise<{ username: string }>
}

export default async function MessageWithUserPage({ params }: MessageWithUserPageProps) {
  const { username } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const rows = await executeQuery(`SELECT id FROM users WHERE username = $1`, [username])
  const otherUser = rows[0]

  if (!otherUser) {
    notFound()
  }

  const otherId = otherUser.id as number
  if (otherId === currentUser.id) {
    redirect("/messages")
  }

  const result = await startConversation(otherId)

  if (result.success && result.conversationId) {
    redirect(`/messages/${result.conversationId}`)
  }

  redirect("/messages")
}
