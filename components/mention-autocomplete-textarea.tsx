"use client"

import type { ComponentProps } from "react"
import { Hash, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useContentAutocomplete } from "@/hooks/use-content-autocomplete"

type MentionAutocompleteTextareaProps = Omit<ComponentProps<typeof Textarea>, "value" | "onChange"> & {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export function MentionAutocompleteTextarea({
  value,
  onChange,
  className,
  disabled,
  ...props
}: MentionAutocompleteTextareaProps) {
  const emitChange = (next: string) => {
    onChange({
      target: { value: next, name: props.name ?? "" },
    } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  const {
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
  } = useContentAutocomplete({ value, onValueChange: emitChange })

  const showList = open && !disabled
  const isMention = mode === "mention"
  const isHashtag = mode === "hashtag"
  const suggestions = isMention ? mentionSuggestions : hashtagSuggestions

  return (
    <div className="relative w-full">
      <Textarea
        {...props}
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          handleKeyDown(e)
          props.onKeyDown?.(e)
        }}
        onClick={(e) => {
          syncCaret()
          props.onClick?.(e)
        }}
        onKeyUp={(e) => {
          syncCaret()
          props.onKeyUp?.(e)
        }}
        onSelect={(e) => {
          syncCaret()
          props.onSelect?.(e)
        }}
        disabled={disabled}
        className={className}
      />

      {showList && (
        <div
          role="listbox"
          aria-label={isMention ? "Mention suggestions" : "Hashtag suggestions"}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {loading && suggestions.length === 0 ? (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </p>
          ) : null}

          {!loading && suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {isMention
                ? activeMention?.query
                  ? `No users matching “${activeMention.query}”`
                  : "No users to suggest"
                : activeHashtag?.query
                  ? `No hashtags matching “${activeHashtag.query}”`
                  : "No hashtags to suggest"}
            </p>
          ) : null}

          {isMention &&
            mentionSuggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                  index === selectedIndex && "bg-muted",
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  applyMention(user.username)
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg?height=28&width=28"}
                    alt={user.username}
                  />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium truncate">@{user.username}</span>
              </button>
            ))}

          {isHashtag &&
            hashtagSuggestions.map((tag, index) => (
              <button
                key={tag.name}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                  index === selectedIndex && "bg-muted",
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  applyHashtag(tag.name)
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40">
                  <Hash className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">#{tag.name}</span>
                  {tag.usage_count > 0 ? (
                    <span className="ml-2 text-muted-foreground">{tag.usage_count} shouts</span>
                  ) : null}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
