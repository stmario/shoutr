import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ProfileHeader } from "@/components/profile-header"
import { ShoutList } from "@/components/shout-list"
import { ProfileReshoutList } from "@/components/profile-reshout-list"
import {
  getProfileStakedShot,
  getUserLikedShouts,
  getUserProfile,
  getUserShouts,
  syncProfileEnsVerified,
} from "@/app/actions/profile"
import type { Shout } from "@/app/actions/shouts"
import { getCurrentUser } from "@/app/actions/auth"
import { buildPageMetadata, pageTitle, truncateText } from "@/lib/seo"
import { notFound } from "next/navigation"
import { BadgeCheck } from "lucide-react"

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const profile = await getUserProfile(username)

  if (!profile || profile.profile_blocked_viewer) {
    return buildPageMetadata({
      title: pageTitle("Profile not found"),
      description: "This profile could not be found on Shoutr.",
      path: `/profile/${encodeURIComponent(username)}`,
      noIndex: true,
    })
  }

  const description = profile.bio
    ? truncateText(profile.bio, 160)
    : `View ${profile.username}'s shouts and activity on Shoutr.`

  return buildPageMetadata({
    title: pageTitle(profile.username),
    description,
    path: `/profile/${encodeURIComponent(profile.username)}`,
    imageUrl: profile.avatar_url,
  })
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const profile = await getUserProfile(username)

  if (!profile) {
    notFound()
  }

  const currentUser = await getCurrentUser()
  const isCurrentUser = currentUser?.id === profile.id

  if (profile.profile_blocked_viewer && !isCurrentUser) {
    notFound()
  }

  const displayProfile = await syncProfileEnsVerified(profile, currentUser?.id ?? null)

  const [userShouts, likedShouts, stakedShot] = await Promise.all([
    getUserShouts(profile.id, 10, 0, currentUser?.id),
    getUserLikedShouts(profile.id, 10, 0, currentUser?.id),
    getProfileStakedShot(profile.wallet_address),
  ])

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold inline-flex items-center gap-1.5">
            {displayProfile.username}
            {displayProfile.is_verified ? (
              <BadgeCheck
                className="h-5 w-5 shrink-0 fill-sky-500 text-white dark:text-background"
                aria-label="ENS verified"
              />
            ) : null}
          </h1>
        </div>
      </header>

      <div>
        <ProfileHeader profile={displayProfile} isCurrentUser={isCurrentUser} stakedShot={stakedShot} />

        <Tabs defaultValue="shouts" className="mt-6">
          <TabsList className="w-full justify-start px-4 border-b rounded-none h-12">
            <TabsTrigger
              value="shouts"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Shouts
            </TabsTrigger>
            <TabsTrigger
              value="reshouts"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Reshouts
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Likes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="shouts" className="mt-0">
            <div className="container max-w-2xl mx-auto px-4 py-4">
              <ShoutList
                initialShouts={userShouts}
                userId={currentUser?.id}
                profileId={profile.id}
                viewerUserId={currentUser?.id}
              />
            </div>
          </TabsContent>
          <TabsContent value="reshouts" className="mt-0">
            <div className="container max-w-2xl mx-auto px-4 py-4">
              <ProfileReshoutList
                profileId={profile.id}
                profileUsername={profile.username}
                profileAvatarUrl={profile.avatar_url}
                currentUserId={currentUser?.id}
              />
            </div>
          </TabsContent>
          <TabsContent value="likes" className="mt-0">
            <div className="container max-w-2xl mx-auto px-4 py-4">
              <ShoutList
                initialShouts={likedShouts as Shout[]}
                userId={currentUser?.id}
                likedProfileId={profile.id}
                viewerUserId={currentUser?.id}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
