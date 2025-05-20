import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchBar } from "@/components/search-bar"
import { InfiniteScrollResults } from "@/components/infinite-scroll-results"
import { getCurrentUser } from "@/lib/auth"
import { search } from "@/app/actions/explore-actions"
import { redirect } from "next/navigation"

interface SearchPageProps {
  searchParams: {
    q: string
    tab?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const query = searchParams.q || ""
  const tab = searchParams.tab || "all"

  if (!query) {
    redirect("/explore")
  }

  // Initial search results
  const searchResults = await search(query, 10, 0, tab === "all" ? undefined : (tab as any))

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
          <SearchBar initialQuery={query} />
        </div>

        <Tabs defaultValue={tab} className="w-full">
          <TabsList className="w-full justify-start mb-6 border-b rounded-none h-12">
            <TabsTrigger
              value="all"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
              asChild
            >
              <a href={`/search?q=${encodeURIComponent(query)}&tab=all`}>All</a>
            </TabsTrigger>
            <TabsTrigger
              value="shout"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
              asChild
            >
              <a href={`/search?q=${encodeURIComponent(query)}&tab=shout`}>Shouts</a>
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
              asChild
            >
              <a href={`/search?q=${encodeURIComponent(query)}&tab=user`}>Users</a>
            </TabsTrigger>
            <TabsTrigger
              value="hashtag"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-700 rounded-none"
              asChild
            >
              <a href={`/search?q=${encodeURIComponent(query)}&tab=hashtag`}>Hashtags</a>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <InfiniteScrollResults initialResults={searchResults} query={query} currentUserId={user.id} />
          </TabsContent>

          <TabsContent value="shout">
            <InfiniteScrollResults initialResults={searchResults} query={query} type="shout" currentUserId={user.id} />
          </TabsContent>

          <TabsContent value="user">
            <InfiniteScrollResults initialResults={searchResults} query={query} type="user" currentUserId={user.id} />
          </TabsContent>

          <TabsContent value="hashtag">
            <InfiniteScrollResults
              initialResults={searchResults}
              query={query}
              type="hashtag"
              currentUserId={user.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
