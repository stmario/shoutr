import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ConversationList } from "@/components/conversation-list"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MessagesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
      </header>
      <div>
        <ConversationList />
      </div>
    </SidebarInset>
  )
}
