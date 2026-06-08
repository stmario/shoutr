import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Coins, MapPin, LinkIcon, Edit, Wallet } from "lucide-react"
import { getExplorerAddressUrl } from "@/lib/ethereum-network"
import { Button } from "@/components/ui/button"
import { FollowButton } from "@/components/follow-button"
import { MessageButton } from "@/components/message-button"
import { BlockUserButton } from "@/components/block-user-button"
import type { ProfileUser } from "@/app/actions/profile"
import { formatDate } from "@/lib/utils"
import { UsernameDisplay } from "@/components/username-display"

interface ProfileHeaderProps {
  profile: ProfileUser
  isCurrentUser: boolean
  stakedShot?: string | null
}

export function ProfileHeader({ profile, isCurrentUser, stakedShot }: ProfileHeaderProps) {
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
              <div className="flex flex-wrap justify-end gap-2 max-w-[min(100%,22rem)]">
                {profile.viewer_has_blocked ? (
                  <BlockUserButton targetUserId={profile.id} initialBlocked />
                ) : (
                  <>
                    <MessageButton userId={profile.id} />
                    <FollowButton profileUserId={profile.id} initialIsFollowing={profile.is_following} />
                    <BlockUserButton targetUserId={profile.id} initialBlocked={false} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pb-4">
          <h1 className="text-2xl font-bold">
            <UsernameDisplay
              username={profile.username}
              verified={profile.is_verified}
              asLink={false}
              nameClassName="text-2xl font-bold"
            />
          </h1>

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

            {profile.wallet_address && (
              <div className="flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                <a
                  href={getExplorerAddressUrl(profile.wallet_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline font-mono"
                >
                  {profile.wallet_address.slice(0, 6)}…{profile.wallet_address.slice(-4)}
                </a>
              </div>
            )}

            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-3">
            <Link href={`/profile/${profile.username}/following`} className="text-sm hover:underline">
              <span className="font-bold">{profile.following_count}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </Link>
            <Link href={`/profile/${profile.username}/followers`} className="text-sm hover:underline">
              <span className="font-bold">{profile.followers_count}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </Link>
            {stakedShot != null &&
              (isCurrentUser ? (
                <Link href="/staking" className="text-sm hover:underline inline-flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-bold">{stakedShot}</span>{" "}
                  <span className="text-muted-foreground">Staked</span>
                </Link>
              ) : (
                <span className="text-sm inline-flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-bold">{stakedShot}</span>{" "}
                  <span className="text-muted-foreground">Staked</span>
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
