import { Suspense } from "react"
import type { Metadata } from "next"
import { SearchBar } from "@/components/search-bar"
import { TrendingHashtags } from "@/components/trending-hashtags"
import { SuggestedUsers } from "@/components/suggested-users"
import { Skeleton } from "@/components/ui/skeleton"
import { getTrendingHashtags, getSuggestedUsers } from "@/app/actions/explore-actions"
import { getCurrentUser } from "@/lib/auth"
import { buildPageMetadata, pageTitle } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Explore"),
  description: "Discover trending hashtags, find people to follow, and search shouts, users, and hashtags on Shoutr.",
  path: "/explore",
})

async function ExploreTrending() {
  const hashtags = await getTrendingHashtags(10)
  return <TrendingHashtags hashtags={hashtags} />
}

async function ExploreSuggested() {
  const [users, currentUser] = await Promise.all([getSuggestedUsers(5), getCurrentUser()])
  return <SuggestedUsers users={users} currentUserId={currentUser?.id ?? 0} />
}

export default function ExplorePage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
        <h1 className="text-xl font-bold mb-4">Explore</h1>
        <SearchBar />
      </header>

      <div className="p-4">
        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              </div>
            }
          >
            <ExploreTrending />
          </Suspense>

          <Suspense
            fallback={
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-9 w-24 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <ExploreSuggested />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
