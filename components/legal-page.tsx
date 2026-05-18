import type { ReactNode } from "react"
import Link from "next/link"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

interface LegalPageProps {
  title: string
  children: ReactNode
}

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </header>
      <article className="container max-w-3xl mx-auto px-4 py-8 prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground not-prose mb-8">
          <Link href="/" className="text-purple-700 hover:underline">
            ← Back to Shoutr
          </Link>
        </p>
        {children}
      </article>
    </SidebarInset>
  )
}
