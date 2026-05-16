"use client"

import { useRouter } from "next/navigation"
import { ShoutCard } from "@/components/shout-card"

type ShoutDetailCardProps = {
  shout: Parameters<typeof ShoutCard>[0]["shout"]
  currentUserId?: number
}

export function ShoutDetailCard({ shout, currentUserId }: ShoutDetailCardProps) {
  const router = useRouter()

  return (
    <ShoutCard
      shout={shout}
      currentUserId={currentUserId}
      onDeleted={() => router.push("/")}
    />
  )
}
