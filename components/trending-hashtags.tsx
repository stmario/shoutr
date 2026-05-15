import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Hash } from "lucide-react"

interface TrendingHashtagsProps {
  hashtags?: {
    id: number
    name: string
    usage_count: number
  }[]
}

export function TrendingHashtags({ hashtags = [] }: TrendingHashtagsProps) {
  if (hashtags.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hashtags.map((hashtag) => (
          <Link key={hashtag.id} href={`/hashtag/${hashtag.name}`}>
            <div className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md">
              <Hash className="h-4 w-4 text-purple-700" />
              <div className="flex-1">
                <div className="font-medium">#{hashtag.name}</div>
                <div className="text-sm text-muted-foreground">{hashtag.usage_count} shouts</div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
