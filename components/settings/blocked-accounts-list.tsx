import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BlockUserButton } from "@/components/block-user-button"
import type { BlockedUserRow } from "@/app/actions/block-actions"

interface BlockedAccountsListProps {
  blocked: BlockedUserRow[]
}

export function BlockedAccountsList({ blocked }: BlockedAccountsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked accounts</CardTitle>
        <CardDescription>
          People you block cannot follow you, message you, or view your profile. Unblocking lets you interact again
          unless they have blocked you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">You have not blocked anyone.</p>
        ) : (
          blocked.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <Link href={`/profile/${row.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  {row.avatar_url ? (
                    <Image
                      src={row.avatar_url}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                      {row.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">@{row.username}</p>
                  <p className="text-xs text-muted-foreground">
                    Blocked {new Date(row.blocked_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              <BlockUserButton targetUserId={row.id} initialBlocked size="sm" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
