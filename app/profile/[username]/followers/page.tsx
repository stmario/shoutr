import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { FollowList } from "@/components/follow-list"
import { getFollowers, getUserProfile } from "@/app/actions/profile"
import { getCurrentUser } from "@/app/actions/auth"
import { notFound } from "next/navigation"

interface FollowersPageProps {
  params: Promise<{ username: string }>
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { username } = await params
  const profile = await getUserProfile(username)

  if (!profile) {
    notFound()
  }

  const [followers, currentUser] = await Promise.all([getFollowers(username), getCurrentUser()])

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <Link href={`/profile/${username}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{profile.username}</h1>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-4">
        <FollowList
          users={followers}
          currentUserId={currentUser?.id}
          emptyMessage="No followers yet."
        />
      </div>
    </SidebarInset>
  )
}
