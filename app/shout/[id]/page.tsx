import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ShoutCard } from "@/components/shout-card"
import { getCurrentUser } from "@/lib/auth"
import { getShoutById } from "@/app/actions/shout-actions"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ShoutPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ShoutPage({ params }: ShoutPageProps) {
  const { id } = await params
  const shoutId = Number.parseInt(id)

  if (isNaN(shoutId)) {
    notFound()
  }

  const user = await getCurrentUser()
  const shout = await getShoutById(shoutId)

  if (!shout) {
    notFound()
  }

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Shout</h1>
        </div>
      </header>
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <ShoutCard shout={shout} currentUserId={user?.id} />

        {/* Comments section could be added here */}
      </div>
    </SidebarInset>
  )
}
