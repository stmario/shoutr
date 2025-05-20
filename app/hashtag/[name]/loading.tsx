import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Hash } from "lucide-react"

export default function Loading() {
  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <Hash className="h-5 w-5 text-purple-700" />
          <Skeleton className="h-6 w-24" />
        </div>
      </header>
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </SidebarInset>
  )
}
