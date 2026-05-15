import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ConversationThread } from "@/components/conversation-thread"
import { getCurrentUser } from "@/lib/auth"
import { getConversation } from "@/app/actions/message-actions"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ConversationPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params
  const conversationId = Number.parseInt(id, 10)

  if (Number.isNaN(conversationId)) {
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

  const otherParticipant =
    conversation.participants.find((p) => p.id !== user.id) ?? conversation.participants[0]

  if (!otherParticipant) {
    notFound()
  }

  return (
    <SidebarInset className="flex flex-col min-h-[calc(100vh-1px)]">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 w-full">
          <SidebarTrigger className="md:hidden" />
          <Link href="/messages" className="mr-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href={`/profile/${otherParticipant.username}`} className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={otherParticipant.avatar_url || "/placeholder.svg?height=32&width=32"}
                alt={otherParticipant.username}
              />
              <AvatarFallback>{otherParticipant.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="font-bold truncate">{otherParticipant.username}</h1>
              <p className="text-xs text-muted-foreground truncate">@{otherParticipant.username}</p>
            </div>
          </Link>
        </div>
      </header>
      <ConversationThread conversationId={conversationId} currentUserId={user.id} />
    </SidebarInset>
  )
}
