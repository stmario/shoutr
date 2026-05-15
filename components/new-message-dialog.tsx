"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchMessageRecipients } from "@/app/actions/message-actions"
import { startConversation } from "@/app/actions/message-actions"
import { useToast } from "@/hooks/use-toast"

export function NewMessageDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [results, setResults] = useState<
    { id: number; username: string; avatar_url: string | null }[]
  >([])
  const router = useRouter()
  const { toast } = useToast()

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim().replace(/^@+/, "")
    if (!q) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)
    try {
      const data = await searchMessageRecipients(q, 12)
      setResults(data)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
      toast({
        title: "Search failed",
        description: "Could not search users. Try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!open) return

    const q = query.trim()
    if (q.length < 1) {
      setResults([])
      setSearched(false)
      return
    }

    const timer = setTimeout(() => {
      runSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, open, runSearch])

  const handleSelect = async (userId: number) => {
    setStartingId(userId)
    try {
      const result = await startConversation(userId)
      if (!result.success || !result.conversationId) {
        toast({
          title: "Error",
          description: result.message || "Could not start conversation",
          variant: "destructive",
        })
        return
      }
      setOpen(false)
      setQuery("")
      setResults([])
      setSearched(false)
      router.push(`/messages/${result.conversationId}`)
    } finally {
      setStartingId(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setQuery("")
          setResults([])
          setSearched(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-purple-700 hover:bg-purple-800">New message</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Search by username (with or without @). Wallet addresses starting with 0x also work.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            placeholder="Username or 0x…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
            autoFocus
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => runSearch(query)}
            disabled={loading || !query.trim()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading && (
            <p className="text-sm text-muted-foreground py-4 text-center">Searching…</p>
          )}
          {!loading &&
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user.id)}
                disabled={startingId === user.id}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg?height=36&width=36"}
                    alt={user.username}
                  />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">@{user.username}</span>
                {startingId === user.id && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </button>
            ))}
          {!loading && searched && results.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No users found for &ldquo;{query.trim().replace(/^@+/, "")}&rdquo;
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
