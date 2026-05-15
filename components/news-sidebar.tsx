import Link from "next/link"
import { ExternalLink, TrendingUp, Coins } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// This would typically come from an API or database
const newsItems = [
  {
    id: 1,
    title: "Shoutr launches new features",
    description: "Check out the latest updates to the platform",
    url: "#",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Tech industry sees major shifts",
    description: "New developments are changing how we interact online",
    url: "#",
    time: "5 hours ago",
  },
  {
    id: 3,
    title: "Global social media usage trends",
    description: "Study reveals changing patterns in social media consumption",
    url: "#",
    time: "Yesterday",
  },
  {
    id: 4,
    title: "Privacy updates for social platforms",
    description: "New regulations impact how data is handled",
    url: "#",
    time: "2 days ago",
  },
]

// This would typically come from an API or database
const trendingTopics = [
  { id: 1, name: "TechTalk", count: "24.5K" },
  { id: 2, name: "SocialMedia", count: "18.2K" },
  { id: 3, name: "WebDev", count: "12.7K" },
  { id: 4, name: "AINews", count: "10.3K" },
  { id: 5, name: "DigitalNomad", count: "8.9K" },
]

export function NewsSidebar() {
  return (
    <aside className="hidden lg:block w-80 shrink-0 p-4 overflow-auto">
      <div className="space-y-4 sticky top-4">
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-purple-600" />
              SHOT Token Sale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <h3 className="font-medium text-purple-800">Join our ICO now!</h3>
              <p className="text-sm text-muted-foreground">
                1&apos;000&apos;000&apos;000 SHOT · 10&apos;000 SHOT/ETH · 10% team allocation
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                Limited Time
              </Badge>
              <span className="text-sm font-medium">14 days left</span>
            </div>
            <Link
              href="/ico"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-center text-sm font-medium transition-colors"
            >
              Participate Now
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">What's happening</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {newsItems.map((item) => (
              <div key={item.id} className="space-y-1">
                <Link href={item.url} className="group">
                  <h3 className="font-medium group-hover:text-purple-700 transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <span>{item.time}</span>
                  </div>
                </Link>
              </div>
            ))}
            <Link href="/news" className="text-sm text-purple-700 hover:text-purple-800 flex items-center gap-1">
              Show more <ExternalLink className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trendingTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/hashtag/${topic.name}`}
                  className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-md transition-colors"
                >
                  <span className="font-medium">#{topic.name}</span>
                  <span className="text-sm text-muted-foreground">{topic.count} shouts</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
