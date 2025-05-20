import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 w-full">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">Search</h1>
        </div>
      </header>
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="mb-6">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start mb-6 border-b rounded-none h-12">
            <TabsTrigger
              value="all"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="shouts"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Shouts
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="hashtags"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
            >
              Hashtags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-4">People</h2>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Hashtags</h2>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Shouts</h2>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg mb-4" />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
