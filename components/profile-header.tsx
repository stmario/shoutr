import Image from "next/image"
import Link from "next/link"
import { CalendarDays, MapPin, LinkIcon, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FollowButton } from "@/components/follow-button"
import { MessageButton } from "@/components/message-button"
import type { ProfileUser } from "@/app/actions/profile"
import { formatDate } from "@/lib/utils"

interface ProfileHeaderProps {
  profile: ProfileUser
  isCurrentUser: boolean
}

export function ProfileHeader({ profile, isCurrentUser }: ProfileHeaderProps) {
  return (
    <div className="border-b">
      <div className="h-32 bg-purple-100 dark:bg-purple-900/20"></div>
      <div className="container max-w-2xl mx-auto px-4">
        <div className="relative flex justify-between items-start">
          <div className="absolute -top-16">
            <div className="h-32 w-32 rounded-full border-4 border-background overflow-hidden bg-muted">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt={profile.username}
                  width={128}
                  height={128}
                  className="object-cover h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-4xl font-bold text-muted-foreground">
                  {profile.username.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto mt-4">
            {isCurrentUser ? (
              <Button asChild variant="outline">
                <Link href="/profile-settings">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            ) : (
              <div className="flex gap-2">
                <MessageButton userId={profile.id} />
                <FollowButton profileUserId={profile.id} initialIsFollowing={profile.is_following} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pb-4">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>

          {profile.bio && <p className="mt-3">{profile.bio}</p>}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {profile.website && (
              <div className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-3">
            <Link href={`/profile/${profile.username}/following`} className="text-sm hover:underline">
              <span className="font-bold">{profile.following_count}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </Link>
            <Link href={`/profile/${profile.username}/followers`} className="text-sm hover:underline">
              <span className="font-bold">{profile.followers_count}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
