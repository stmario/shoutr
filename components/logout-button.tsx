"use client"

import { useTransition } from "react"
import { signOut } from "@/app/actions/auth"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LogoutButtonProps = {
  variant?: "menu-item" | "button"
  className?: string
  onComplete?: () => void
}

export function LogoutButton({ variant = "menu-item", className, onComplete }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await signOut()
      onComplete?.()
    })
  }

  const label = isPending ? "Logging out…" : "Log out"

  if (variant === "menu-item") {
    return (
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          handleLogout()
        }}
        disabled={isPending}
      >
        {label}
      </DropdownMenuItem>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full", className)}
      onClick={handleLogout}
      disabled={isPending}
    >
      {label}
    </Button>
  )
}
