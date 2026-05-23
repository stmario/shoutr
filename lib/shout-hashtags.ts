import { db } from "@/lib/db"
import { hashtags, shoutHashtags } from "@/lib/schema"
import { extractHashtagNames } from "@/lib/mentions"

/** Persist hashtag rows and shout_hashtags links for tokens in content. */
export async function linkHashtagsToShout(shoutId: number, content: string): Promise<void> {
  const names = extractHashtagNames(content)
  if (names.length === 0) return

  for (const name of names) {
    const [hashtagResult] = await db
      .insert(hashtags)
      .values({ name })
      .onConflictDoUpdate({
        target: hashtags.name,
        set: { name },
      })
      .returning()

    await db
      .insert(shoutHashtags)
      .values({
        shout_id: shoutId,
        hashtag_id: hashtagResult.id,
      })
      .onConflictDoNothing()
  }
}
