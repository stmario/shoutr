"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, User, Hash, MessageSquare, Loader2 } from "lucide-react"
import { search } from "@/app/actions/explore-actions"
import type { SearchResult } from "@/app/actions/explore-actions"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface SearchBarProps {
  initialQuery?: string
}

export function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    // Close search results when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const searchResults = await search(searchQuery, 5)
      setResults(searchResults)
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (value.trim().length > 1) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        handleSearch(value)
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
      setShowResults(false)
    }
  }

  const handleFocus = () => {
    if (query.trim().length > 1) {
      handleSearch(query)
    }
  }

  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search Shoutr"
          className="pl-10 h-12 rounded-full"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </form>

      {showResults && results.length > 0 && (
        <Card className="absolute z-10 w-full mt-2 max-h-[70vh] overflow-y-auto shadow-lg">
          <div className="p-2">
            {results.map((result) => (
              <SearchResultItem
                key={`${result.type}-${result.id}`}
                result={result}
                onClick={() => setShowResults(false)}
              />
            ))}
            {query.trim().length > 0 && (
              <Button
                variant="ghost"
                className="w-full justify-start mt-2"
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`)
                  setShowResults(false)
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Search for "{query}"
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function SearchResultItem({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const formattedDate = formatDistanceToNow(new Date(result.created_at), { addSuffix: true })

  if (result.type === "user") {
    return (
      <Link href={`/profile/${result.username}`} onClick={onClick}>
        <div className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
          <Avatar className="h-10 w-10">
            <AvatarImage src={result.avatar_url || "/placeholder.svg?height=40&width=40"} alt={result.display_name} />
            <AvatarFallback>{result.display_name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">{result.display_name}</div>
            <div className="text-sm text-muted-foreground truncate">@{result.username}</div>
          </div>
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    )
  }

  if (result.type === "shout") {
    return (
      <Link href={`/shout/${result.id}`} onClick={onClick}>
        <div className="flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
          <Avatar className="h-8 w-8">
            <AvatarImage src={result.avatar_url || "/placeholder.svg?height=32&width=32"} alt={result.display_name} />
            <AvatarFallback>{result.display_name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <span className="font-semibold">{result.display_name}</span>
              <span className="text-muted-foreground"> @{result.username}</span>
              <span className="text-muted-foreground"> · {formattedDate}</span>
            </div>
            <div className="text-sm truncate">{result.content}</div>
          </div>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    )
  }

  if (result.type === "hashtag") {
    return (
      <Link href={`/hashtag/${result.hashtag_name}`} onClick={onClick}>
        <div className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
          <div className="flex-1 min-w-0">
            <div className="font-semibold">#{result.hashtag_name}</div>
            <div className="text-sm text-muted-foreground">{result.usage_count} shouts</div>
          </div>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    )
  }

  return null
}
