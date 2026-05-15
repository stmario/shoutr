import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { getCurrentUser } from "@/lib/auth"
import { getNotificationSettings } from "@/app/actions/settings-actions"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const notificationSettings = await getNotificationSettings()

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full justify-start mb-6 border-b rounded-none h-12">
            <TabsTrigger
              value="profile"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Account
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Security
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileSettings user={user} />
          </TabsContent>
          <TabsContent value="account">
            <AccountSettings user={user} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationSettings initialSettings={notificationSettings} />
          </TabsContent>
          <TabsContent value="security">
            <SecuritySettings username={user.username} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
