import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { InfiniteScrollShoutList } from "@/components/infinite-scroll-shout-list"
import { getCurrentUser } from "@/lib/auth"
import { getShoutsByHashtag } from "@/app/actions/explore-actions"
import { notFound, redirect } from "next/navigation"
import { Hash } from "lucide-react"

interface HashtagPageProps {
  params: Promise<{
    name: string
  }>
}

export default async function HashtagPage({ params }: HashtagPageProps) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const initialShouts = await getShoutsByHashtag(decodedName, 10, 0)

  if (initialShouts.length === 0) {
    notFound()
  }

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <Hash className="h-5 w-5 text-purple-700" />
          <h1 className="text-xl font-bold">{decodedName}</h1>
        </div>
      </header>
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <InfiniteScrollShoutList
          initialShouts={initialShouts}
          userId={user.id}
          fetchMoreFn={async (offset) => getShoutsByHashtag(decodedName, 10, offset)}
        />
      </div>
    </SidebarInset>
  )
}
