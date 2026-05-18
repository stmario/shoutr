import { Suspense } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { AccountSettings } from "@/components/settings/account-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { BlockedSettings } from "@/components/settings/blocked-settings"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { getCurrentUser } from "@/lib/auth"
import { getNotificationSettings } from "@/app/actions/settings-actions"
import { redirect } from "next/navigation"
import { Loader2 } from "lucide-react"

interface SettingsPageProps {
  searchParams: Promise<{ tab?: string }>
}

function BlockedTabFallback() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { tab } = await searchParams
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
        <SettingsTabs
          defaultTab={tab ?? "profile"}
          profile={<ProfileSettings user={user} />}
          account={<AccountSettings user={user} />}
          notifications={<NotificationSettings initialSettings={notificationSettings} />}
          security={<SecuritySettings username={user.username} />}
          blocked={
            <Suspense fallback={<BlockedTabFallback />}>
              <BlockedSettings />
            </Suspense>
          }
        />
      </div>
    </SidebarInset>
  )
}
