import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { BookmarkedShoutList } from "@/components/bookmarked-shout-list"
import { getCurrentUser } from "@/lib/auth"
import { getBookmarkCount, getBookmarkedShouts } from "@/app/actions/bookmark-actions"
import { redirect } from "next/navigation"
import { Bookmark } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function BookmarksPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const [bookmarkedShouts, bookmarkCount] = await Promise.all([
    getBookmarkedShouts(10, 0),
    getBookmarkCount(),
  ])

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">Bookmarks</h1>
          {bookmarkCount > 0 && (
            <span className="text-sm text-muted-foreground">({bookmarkCount})</span>
          )}
        </div>
      </header>
      <div className="container max-w-2xl mx-auto px-4 py-4">
        {bookmarkedShouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full mb-4">
              <Bookmark className="h-8 w-8 text-purple-700" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Tap the bookmark icon on any shout to save it here for later.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Browse shouts</Link>
            </Button>
          </div>
        ) : (
          <BookmarkedShoutList initialShouts={bookmarkedShouts} userId={user.id} />
        )}
      </div>
    </SidebarInset>
  )
}
