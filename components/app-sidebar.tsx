import Link from "next/link"
import { Home, Search, Bell, Mail, Bookmark, User, Settings, MoreHorizontal, Megaphone, PenSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser } from "@/lib/auth"
import { getUnreadNotificationCount } from "@/app/actions/notification-actions"
import { getUnreadMessageCount } from "@/app/actions/message-actions"
import { MobileMenu } from "./mobile-menu"

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications", hasBadge: "notifications" },
  { icon: Mail, label: "Messages", href: "/messages", hasBadge: "messages" },
  { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export async function AppSidebar() {
  const user = await getCurrentUser()
  const unreadNotificationCount = user ? await getUnreadNotificationCount() : 0
  const unreadMessageCount = user ? await getUnreadMessageCount() : 0

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 bg-background/80 backdrop-blur-sm border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-white">
            <Megaphone className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Shoutr</span>
        </Link>
        <MobileMenu
          user={user}
          unreadNotificationCount={unreadNotificationCount}
          unreadMessageCount={unreadMessageCount}
        />
      </div>

      <Sidebar className="hidden md:flex">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-white">
                <Megaphone className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold hidden md:inline-block">Shoutr</span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <Link
                    href={item.href === "/profile" && user ? `/profile/${user.username}` : item.href}
                    className="flex items-center gap-4 relative"
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {item.hasBadge === "notifications" && unreadNotificationCount > 0 && (
                        <div className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                          {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                        </div>
                      )}
                      {item.hasBadge === "messages" && unreadMessageCount > 0 && (
                        <div className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-700 text-[10px] font-medium text-white">
                          {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                        </div>
                      )}
                    </div>
                    <span>{item.label}</span>
                    {item.hasBadge === "notifications" && unreadNotificationCount > 0 && (
                      <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                        {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                      </span>
                    )}
                    {item.hasBadge === "messages" && unreadMessageCount > 0 && (
                      <span className="ml-auto text-xs bg-purple-700 text-white px-2 py-0.5 rounded-full">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="px-4 mt-4 hidden md:block">
            <Button asChild className="w-full bg-purple-700 hover:bg-purple-800 text-white">
              <Link href="/compose">
                <PenSquare className="mr-2 h-4 w-4" />
                Shout
              </Link>
            </Button>
          </div>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.avatar_url || "/placeholder.svg?height=32&width=32"}
                      alt={user ? `@${user.username}` : "Guest"}
                    />
                    <AvatarFallback>{user?.username?.charAt(0) || "G"}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium">{user?.username || "Guest"}</div>
                    <div className="text-xs text-muted-foreground">{user ? `@${user.username}` : "Not signed in"}</div>
                  </div>
                  <MoreHorizontal className="ml-auto h-4 w-4 hidden md:block" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.username}`}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile-settings">Edit Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign in with wallet</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
