"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseInfiniteScrollOptions {
  initialData: any[]
  fetchMore: (offset: number) => Promise<any[]>
  hasMoreInitial?: boolean
}

export function useInfiniteScroll<T>({ initialData, fetchMore, hasMoreInitial = true }: UseInfiniteScrollOptions) {
  const [data, setData] = useState<T[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(hasMoreInitial)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Reset data when initialData changes (e.g., when filters change)
  useEffect(() => {
    setData(initialData)
    setHasMore(hasMoreInitial)
    setError(null)
  }, [initialData, hasMoreInitial])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    setError(null)

    try {
      const newItems = await fetchMore(data.length)

      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setData((prevData) => [...prevData, ...newItems])
      }
    } catch (err) {
      console.error("Error loading more items:", err)
      setError("Failed to load more items. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [data.length, fetchMore, hasMore, isLoading])

  // Set up intersection observer
  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore])

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMoreRef,
    setData,
  }
}
