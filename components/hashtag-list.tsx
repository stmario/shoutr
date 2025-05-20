import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Hash } from "lucide-react"
import type { SearchResult } from "@/app/actions/explore-actions"

interface HashtagListProps {
  hashtags: SearchResult[]
}

export function HashtagList({ hashtags }: HashtagListProps) {
  return (
    <div className="space-y-4">
      {hashtags.map((hashtag) => (
        <Card key={hashtag.id} className="p-4">
          <Link href={`/hashtag/${hashtag.hashtag_name}`}>
            <div className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md">
              <Hash className="h-5 w-5 text-purple-700" />
              <div className="flex-1">
                <div className="font-medium">#{hashtag.hashtag_name}</div>
                <div className="text-sm text-muted-foreground">{hashtag.usage_count} shouts</div>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  )
}
