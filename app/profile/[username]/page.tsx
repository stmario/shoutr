import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ProfileHeader } from "@/components/profile-header"
import { ShoutList } from "@/components/shout-list"
import { getUserProfile, getUserShouts } from "@/app/actions/profile"
import { getCurrentUser } from "@/app/actions/auth"
import { notFound } from "next/navigation"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params
  const profile = await getUserProfile(username)

  if (!profile) {
    notFound()
  }

  const currentUser = await getCurrentUser()
  const isCurrentUser = currentUser?.id === profile.id

  const userShouts = await getUserShouts(profile.id, 10, 0)

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">{profile.display_name}</h1>
        </div>
      </header>

      <div>
        <ProfileHeader profile={profile} isCurrentUser={isCurrentUser} />

        <Tabs defaultValue="shouts" className="mt-6">
          <TabsList className="w-full justify-start px-4 border-b rounded-none h-12">
            <TabsTrigger
              value="shouts"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Shouts
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
              <ShoutList initialShouts={userShouts} userId={currentUser?.id} profileId={profile.id} />
            </div>
          </TabsContent>
          <TabsContent value="likes" className="mt-0">
            <div className="container max-w-2xl mx-auto px-4 py-4">
              <p className="text-center text-muted-foreground py-10">Liked shouts will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
