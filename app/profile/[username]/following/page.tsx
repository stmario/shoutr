import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { FollowList } from "@/components/follow-list"
import { getFollowing, getUserProfile } from "@/app/actions/profile"
import { getCurrentUser } from "@/app/actions/auth"
import { notFound } from "next/navigation"

interface FollowingPageProps {
  params: Promise<{ username: string }>
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { username } = await params
  const profile = await getUserProfile(username)

  if (!profile) {
    notFound()
  }

  const [following, currentUser] = await Promise.all([getFollowing(username), getCurrentUser()])

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
            <p className="text-sm text-muted-foreground">Following</p>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-4">
        <FollowList
          users={following}
          currentUserId={currentUser?.id}
          emptyMessage="Not following anyone yet."
        />
      </div>
    </SidebarInset>
  )
}
