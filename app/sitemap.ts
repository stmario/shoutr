import type { MetadataRoute } from "next"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, shouts, hashtags } from "@/lib/schema"
import { SITE_URL } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/explore`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/legal/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  const [recentShouts, recentUsers, popularHashtags] = await Promise.all([
    db
      .select({ id: shouts.id, updated_at: shouts.updated_at })
      .from(shouts)
      .orderBy(desc(shouts.created_at))
      .limit(1000),
    db
      .select({ username: users.username, updated_at: users.updated_at })
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(1000),
    db
      .select({ name: hashtags.name, created_at: hashtags.created_at })
      .from(hashtags)
      .orderBy(desc(hashtags.created_at))
      .limit(500),
  ])

  const shoutPages: MetadataRoute.Sitemap = recentShouts.map((shout) => ({
    url: `${SITE_URL}/shout/${shout.id}`,
    lastModified: shout.updated_at ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const profilePages: MetadataRoute.Sitemap = recentUsers.map((user) => ({
    url: `${SITE_URL}/profile/${encodeURIComponent(user.username)}`,
    lastModified: user.updated_at ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const hashtagPages: MetadataRoute.Sitemap = popularHashtags.map((hashtag) => ({
    url: `${SITE_URL}/hashtag/${encodeURIComponent(hashtag.name)}`,
    lastModified: hashtag.created_at ?? new Date(),
    changeFrequency: "daily",
    priority: 0.5,
  }))

  return [...staticPages, ...shoutPages, ...profilePages, ...hashtagPages]
}
