import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/profile/", "/shout/", "/hashtag/", "/legal/"],
      disallow: [
        "/login",
        "/settings",
        "/messages",
        "/notifications",
        "/bookmarks",
        "/compose",
        "/staking",
        "/profile-settings",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
