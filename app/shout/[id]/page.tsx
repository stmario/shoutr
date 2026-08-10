import type { Metadata } from "next"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ShoutDetailCard } from "@/components/shout-detail-card"
import { ShoutComments } from "@/components/shout-comments"
import { getCurrentUser } from "@/lib/auth"
import { getCommentsForShout } from "@/app/actions/comment-actions"
import { getShoutById } from "@/app/actions/shout-actions"
import { buildPageMetadata, pageTitle, stripMarkdown, truncateText } from "@/lib/seo"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ShoutPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ShoutPageProps): Promise<Metadata> {
  const { id } = await params
  const shoutId = Number.parseInt(id, 10)

  if (Number.isNaN(shoutId)) {
    return buildPageMetadata({
      title: pageTitle("Shout not found"),
      description: "This shout could not be found on Shoutr.",
      path: `/shout/${id}`,
      noIndex: true,
    })
  }

  const shout = await getShoutById(shoutId)

  if (!shout) {
    return buildPageMetadata({
      title: pageTitle("Shout not found"),
      description: "This shout could not be found on Shoutr.",
      path: `/shout/${id}`,
      noIndex: true,
    })
  }

  const plainContent = stripMarkdown(shout.content)
  const description = truncateText(
    plainContent || `Shout by @${shout.username} on Shoutr.`,
    160,
  )

  return buildPageMetadata({
    title: pageTitle(`@${shout.username}: ${truncateText(plainContent || "Shout", 60)}`),
    description,
    path: `/shout/${shout.id}`,
    imageUrl: shout.image_url,
  })
}

export default async function ShoutPage({ params }: ShoutPageProps) {
  const { id } = await params
  const shoutId = Number.parseInt(id, 10)

  if (Number.isNaN(shoutId)) {
    notFound()
  }

  const user = await getCurrentUser()
  const [shout, comments] = await Promise.all([getShoutById(shoutId), getCommentsForShout(shoutId)])

  if (!shout) {
    notFound()
  }

  const shoutForCard = {
    ...shout,
    vote_count: shout.vote_count?.toString() ?? "0",
    comments_count: comments.length,
    reshouts_count: Number(shout.reshouts_count ?? 0),
  }

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="mr-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Shout</h1>
        </div>
      </header>
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <ShoutDetailCard shout={shoutForCard} currentUserId={user?.id} />
        <ShoutComments shoutId={shoutId} initialComments={comments} currentUserId={user?.id} />
      </div>
    </SidebarInset>
  )
}
