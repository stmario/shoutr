import { Suspense } from "react"
import { ShoutList } from "@/components/shout-list"
import { HomeFeed } from "@/components/home-feed"
import { getCurrentUser } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
        <h1 className="text-xl font-bold">Home</h1>
      </header>

      {user ? (
        <HomeFeed
          userId={user.id}
          username={user.username}
          avatarUrl={user.avatar_url ?? undefined}
        />
      ) : (
        <Suspense
          fallback={
            <div className="p-4 space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <ShoutList />
        </Suspense>
      )}
    </div>
  )
}
