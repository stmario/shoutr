import type { Metadata } from "next"
import Link from "next/link"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { SearchBar } from "@/components/search-bar"
import { InfiniteScrollResults } from "@/components/infinite-scroll-results"
import { getCurrentUser } from "@/lib/auth"
import { search } from "@/app/actions/explore-actions"
import { buildPageMetadata, pageTitle, truncateText } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { redirect } from "next/navigation"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    tab?: string
  }>
}

const SEARCH_TABS = [
  { value: "all", label: "All" },
  { value: "shout", label: "Shouts" },
  { value: "user", label: "Users" },
  { value: "hashtag", label: "Hashtags" },
] as const

type SearchTab = (typeof SEARCH_TABS)[number]["value"]

function isSearchTab(value: string): value is SearchTab {
  return SEARCH_TABS.some((tab) => tab.value === value)
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  const query = q?.trim()

  if (!query) {
    return buildPageMetadata({
      title: pageTitle("Search"),
      description: "Search shouts, users, and hashtags on Shoutr.",
      path: "/explore",
    })
  }

  return buildPageMetadata({
    title: pageTitle(`Search: ${query}`),
    description: truncateText(`Find shouts, users, and hashtags matching "${query}" on Shoutr.`, 160),
    path: `/search?q=${encodeURIComponent(query)}`,
    noIndex: true,
  })
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await getCurrentUser()

  const { q, tab: tabParam } = await searchParams
  const query = q || ""
  const tab: SearchTab = tabParam && isSearchTab(tabParam) ? tabParam : "all"

  if (!query) {
    redirect("/explore")
  }

  const searchType = tab === "all" ? undefined : tab
  const searchResults = await search(query, 10, 0, searchType)

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

        <nav
          className="inline-flex w-full items-center justify-start mb-6 border-b rounded-none h-12 text-muted-foreground"
          aria-label="Search result types"
        >
          {SEARCH_TABS.map(({ value, label }) => (
            <Link
              key={value}
              href={`/search?q=${encodeURIComponent(query)}&tab=${value}`}
              aria-current={tab === value ? "page" : undefined}
              className={cn(
                "flex-1 inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-all rounded-none",
                tab === value
                  ? "border-b-2 border-purple-700 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <InfiniteScrollResults
          initialResults={searchResults}
          query={query}
          type={searchType}
          currentUserId={user?.id}
        />
      </div>
    </SidebarInset>
  )
}
