import type { Metadata } from "next"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { InfiniteScrollShoutList } from "@/components/infinite-scroll-shout-list"
import { getCurrentUser } from "@/lib/auth"
import { getShoutsByHashtag } from "@/app/actions/explore-actions"
import { getHashtagByName } from "@/app/actions/hashtag-actions"
import { buildPageMetadata, pageTitle } from "@/lib/seo"
import { notFound } from "next/navigation"
import { Hash } from "lucide-react"

interface HashtagPageProps {
  params: Promise<{
    name: string
  }>
}

export async function generateMetadata({ params }: HashtagPageProps): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  const hashtag = await getHashtagByName(decodedName)

  if (!hashtag) {
    return buildPageMetadata({
      title: pageTitle("Hashtag not found"),
      description: "This hashtag could not be found on Shoutr.",
      path: `/hashtag/${encodeURIComponent(decodedName)}`,
      noIndex: true,
    })
  }

  return buildPageMetadata({
    title: pageTitle(`#${hashtag.name}`),
    description: `Browse shouts tagged with #${hashtag.name} on Shoutr.`,
    path: `/hashtag/${encodeURIComponent(hashtag.name)}`,
  })
}

export default async function HashtagPage({ params }: HashtagPageProps) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const user = await getCurrentUser()

  const hashtag = await getHashtagByName(decodedName)

  if (!hashtag) {
    notFound()
  }

  const initialShouts = await getShoutsByHashtag(hashtag.name, 10, 0)

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <Hash className="h-5 w-5 text-purple-700" />
          <h1 className="text-xl font-bold">#{hashtag.name}</h1>
        </div>
      </header>
      <div className="container max-w-2xl mx-auto px-4 py-4">
        {initialShouts.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No shouts with this hashtag yet.</p>
        ) : (
          <InfiniteScrollShoutList
            initialShouts={initialShouts}
            userId={user?.id}
            hashtagName={hashtag.name}
          />
        )}
      </div>
    </SidebarInset>
  )
}
