import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
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
          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
