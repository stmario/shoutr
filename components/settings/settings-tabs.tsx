"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const VALID_TABS = ["profile", "account", "notifications", "security", "blocked"] as const

type SettingsTab = (typeof VALID_TABS)[number]

interface SettingsTabsProps {
  defaultTab: string
  profile: ReactNode
  account: ReactNode
  notifications: ReactNode
  security: ReactNode
  blocked: ReactNode
}

function resolveTab(tab: string): SettingsTab {
  return VALID_TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : "profile"
}

export function SettingsTabs({
  defaultTab,
  profile,
  account,
  notifications,
  security,
  blocked,
}: SettingsTabsProps) {
  const router = useRouter()
  const activeTab = resolveTab(defaultTab)

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => router.replace(`/settings?tab=${value}`, { scroll: false })}
      className="w-full"
    >
      <TabsList className="w-full justify-start mb-6 border-b rounded-none h-12 overflow-x-auto">
        <TabsTrigger
          value="profile"
          className="flex-1 min-w-[4.5rem] data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
        >
          Profile
        </TabsTrigger>
        <TabsTrigger
          value="account"
          className="flex-1 min-w-[4.5rem] data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
        >
          Account
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="flex-1 min-w-[4.5rem] data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
        >
          Notifications
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="flex-1 min-w-[4.5rem] data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
        >
          Security
        </TabsTrigger>
        <TabsTrigger
          value="blocked"
          className="flex-1 min-w-[4.5rem] data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
        >
          Blocked
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">{profile}</TabsContent>
      <TabsContent value="account">{account}</TabsContent>
      <TabsContent value="notifications">{notifications}</TabsContent>
      <TabsContent value="security">{security}</TabsContent>
      <TabsContent value="blocked">{blocked}</TabsContent>
    </Tabs>
  )
}
