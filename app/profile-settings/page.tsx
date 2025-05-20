import { redirect } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ProfileSettingsForm } from "@/components/profile-settings-form"
import { getCurrentUser } from "@/lib/auth"

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        <ProfileSettingsForm user={user} />
      </div>
    </SidebarInset>
  )
}
