"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MentionUserOption } from "@/app/actions/mention-actions"
import { searchMentionUsers } from "@/app/actions/mention-actions"
import { getActiveMention, insertMention } from "@/lib/mention-autocomplete"

type UseMentionAutocompleteOptions = {
  value: string
  onValueChange: (value: string) => void
}

export function useMentionAutocomplete({ value, onValueChange }: UseMentionAutocompleteOptions) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [caret, setCaret] = useState(0)
  const [suggestions, setSuggestions] = useState<MentionUserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const activeMention = dismissed ? null : getActiveMention(value, caret)
  const open = Boolean(activeMention)

  const syncCaret = useCallback(() => {
    const el = textareaRef.current
    if (el) setCaret(el.selectionStart ?? 0)
  }, [])

  useEffect(() => {
    if (!open) {
      setSuggestions([])
      setSelectedIndex(0)
      return
    }

    setDismissed(false)
    const query = activeMention!.query
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      void searchMentionUsers(query, 8).then((rows) => {
        if (cancelled) return
        setSuggestions(rows)
        setSelectedIndex(0)
        setLoading(false)
      })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, activeMention?.query, activeMention?.start])

  const applyMention = useCallback(
    (username: string) => {
      if (!activeMention) return
      const { text, caret: nextCaret } = insertMention(value, activeMention, username)
      onValueChange(text)
      setDismissed(true)
      setSuggestions([])
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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange(e.target.value)
      setCaret(e.target.selectionStart ?? 0)
      setDismissed(false)
    },
    [onValueChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open || suggestions.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        const user = suggestions[selectedIndex]
        if (user) applyMention(user.username)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setDismissed(true)
        setSuggestions([])
      }
    },
    [applyMention, open, selectedIndex, suggestions],
  )

  return {
    textareaRef,
    open,
    loading,
    suggestions,
    selectedIndex,
    activeMention,
    applyMention,
    handleChange,
    handleKeyDown,
    syncCaret,
    setSelectedIndex,
  }
}
