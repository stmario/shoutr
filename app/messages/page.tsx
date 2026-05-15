import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ConversationList } from "@/components/conversation-list"
import { NewMessageDialog } from "@/components/new-message-dialog"
import { getCurrentUser } from "@/lib/auth"
import { getUnreadMessageCount } from "@/app/actions/message-actions"
import { redirect } from "next/navigation"

export default async function MessagesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const unreadCount = await getUnreadMessageCount()

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold flex items-center gap-2">
            Messages
            {unreadCount > 0 && (
              <span
                className="h-2 w-2 rounded-full bg-purple-600"
                aria-label={`${unreadCount} unread messages`}
              />
            )}
          </h1>
        </div>
        <NewMessageDialog />
      </header>
      <ConversationList />
    </SidebarInset>
  )
}
