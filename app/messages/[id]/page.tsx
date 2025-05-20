import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { MessageItem } from "@/components/message-item"
import { MessageInput } from "@/components/message-input"
import { getCurrentUser } from "@/lib/auth"
import { getConversation, getMessages } from "@/app/actions/message-actions"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ConversationPageProps {
  params: {
    id: string
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const conversationId = Number.parseInt(params.id)

  if (isNaN(conversationId)) {
    notFound()
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const conversation = await getConversation(conversationId)

  if (!conversation) {
    notFound()
  }

  const messages = await getMessages(conversationId)

  // Find the other participant
  const otherParticipant = conversation.participants.find((p) => p.id !== user.id) || conversation.participants[0]

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 w-full">
          <SidebarTrigger className="md:hidden" />
          <Link href="/messages" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={otherParticipant.avatar_url || "/placeholder.svg?height=32&width=32"}
                alt={otherParticipant.display_name}
              />
              <AvatarFallback>{otherParticipant.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold">{otherParticipant.display_name}</h1>
              <p className="text-xs text-muted-foreground">@{otherParticipant.username}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem key={message.id} message={message} isCurrentUser={message.sender_id === user.id} />
            ))
          )}
        </div>
        <MessageInput conversationId={conversationId} />
      </div>
    </SidebarInset>
  )
}
