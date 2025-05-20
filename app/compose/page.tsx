import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { NewShoutForm } from "@/components/new-shout-form"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ComposePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">New Shout</h1>
        </div>
      </header>
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <NewShoutForm
          user={{
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
          }}
        />
      </div>
    </SidebarInset>
  )
}
