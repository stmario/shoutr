"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MentionUserOption } from "@/app/actions/mention-actions"
import { searchMentionUsers } from "@/app/actions/mention-actions"
import type { HashtagOption } from "@/app/actions/hashtag-actions"
import { searchHashtags } from "@/app/actions/hashtag-actions"
import { getActiveMention, insertMention } from "@/lib/mention-autocomplete"
import { getActiveHashtag, insertHashtag } from "@/lib/hashtag-autocomplete"

type AutocompleteMode = "mention" | "hashtag"

type UseContentAutocompleteOptions = {
  value: string
  onValueChange: (value: string) => void
}

export function useContentAutocomplete({ value, onValueChange }: UseContentAutocompleteOptions) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [caret, setCaret] = useState(0)
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionUserOption[]>([])
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const activeMention = dismissed ? null : getActiveMention(value, caret)
  const activeHashtag = dismissed || activeMention ? null : getActiveHashtag(value, caret)
  const mode: AutocompleteMode | null = activeMention ? "mention" : activeHashtag ? "hashtag" : null
  const open = Boolean(mode)

  const syncCaret = useCallback(() => {
    const el = textareaRef.current
    if (el) setCaret(el.selectionStart ?? 0)
  }, [])

  useEffect(() => {
    if (!open || !mode) {
      setMentionSuggestions([])
      setHashtagSuggestions([])
      setSelectedIndex(0)
      return
    }

    setDismissed(false)
    const query = mode === "mention" ? activeMention!.query : activeHashtag!.query
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      const fetcher =
        mode === "mention" ? searchMentionUsers(query, 8) : searchHashtags(query, 8)
      void fetcher.then((rows) => {
        if (cancelled) return
        if (mode === "mention") {
          setMentionSuggestions(rows as MentionUserOption[])
          setHashtagSuggestions([])
        } else {
          setHashtagSuggestions(rows as HashtagOption[])
          setMentionSuggestions([])
        }
        setSelectedIndex(0)
        setLoading(false)
      })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, mode, activeMention?.query, activeMention?.start, activeHashtag?.query, activeHashtag?.start])

  const applyMention = useCallback(
    (username: string) => {
      if (!activeMention) return
      const { text, caret: nextCaret } = insertMention(value, activeMention, username)
      onValueChange(text)
      setDismissed(true)
      setMentionSuggestions([])
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        el.setSelectionRange(nextCaret, nextCaret)
        setCaret(nextCaret)
      })
    },
    [activeMention, onValueChange, value],
  )

  const applyHashtag = useCallback(
    (name: string) => {
      if (!activeHashtag) return
      const { text, caret: nextCaret } = insertHashtag(value, activeHashtag, name)
      onValueChange(text)
      setDismissed(true)
      setHashtagSuggestions([])
      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        el.setSelectionRange(nextCaret, nextCaret)
        setCaret(nextCaret)
      })
    },
    [activeHashtag, onValueChange, value],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange(e.target.value)
      setCaret(e.target.selectionStart ?? 0)
      setDismissed(false)
    },
    [onValueChange],
  )

  const suggestionCount = mode === "mention" ? mentionSuggestions.length : hashtagSuggestions.length

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open || suggestionCount === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, suggestionCount - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        if (mode === "mention") {
          const user = mentionSuggestions[selectedIndex]
          if (user) applyMention(user.username)
        } else {
          const tag = hashtagSuggestions[selectedIndex]
          if (tag) applyHashtag(tag.name)
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setDismissed(true)
        setMentionSuggestions([])
        setHashtagSuggestions([])
      }
    },
    [
      applyHashtag,
      applyMention,
      hashtagSuggestions,
      mentionSuggestions,
      mode,
      open,
      selectedIndex,
      suggestionCount,
    ],
  )

  return {
    textareaRef,
    mode,
    open,
    loading,
    mentionSuggestions,
    hashtagSuggestions,
    selectedIndex,
    activeMention,
    activeHashtag,
    applyMention,
    applyHashtag,
    handleChange,
    handleKeyDown,
    syncCaret,
    setSelectedIndex,
  }
}
