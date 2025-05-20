import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function Loading() {
  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4 w-full">
          <SidebarTrigger className="md:hidden" />
          <Link href="/messages" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col items-start mb-4">
            <div className="flex items-end gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-48 rounded-lg" />
            </div>
          </div>
          <div className="flex flex-col items-end mb-4">
            <div className="flex items-end gap-2">
              <Skeleton className="h-16 w-48 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col items-start mb-4">
            <div className="flex items-end gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-64 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
