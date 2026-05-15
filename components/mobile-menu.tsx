"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Home, Search, Bell, Mail, Bookmark, User, Settings, PenSquare, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/logout-button"
import { UnreadDot } from "@/components/unread-dot"

type MobileMenuProps = {
  user: any
  hasUnreadNotifications: boolean
  unreadMessageCount: number
}

export function MobileMenu({ user, hasUnreadNotifications, unreadMessageCount }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Explore", href: "/explore" },
    {
      icon: Bell,
      label: "Notifications",
      href: "/notifications",
      showDot: hasUnreadNotifications,
    },
    {
      icon: Mail,
      label: "Messages",
      href: "/messages",
      badge: unreadMessageCount,
    },
    { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
    { icon: Coins, label: "Staking", href: "/staking" },
    { icon: User, label: "Profile", href: user ? `/profile/${user.username}` : "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden relative">
          <Menu className="h-5 w-5" />
          {hasUnreadNotifications && <UnreadDot className="-top-0.5 -right-0.5" />}
          <span className="sr-only">
            {hasUnreadNotifications ? "Toggle menu (unread notifications)" : "Toggle menu"}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80%] max-w-[300px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-white">
                  <span className="font-bold">S</span>
                </div>
                <span className="text-xl font-bold">Shoutr</span>
              </Link>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <div className="flex-1 overflow-auto py-2">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                >
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.showDot && <UnreadDot />}
                    {item.badge != null && item.badge > 0 && (
                      <div className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-700 text-[10px] font-medium text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </div>
                    )}
                  </div>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {user && (
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg?height=40&width=40"}
                    alt={`@${user.username}`}
                  />
                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-muted-foreground">@{user.username}</div>
                </div>
              </div>
              <Button asChild className="w-full mt-4 bg-purple-700 hover:bg-purple-800 text-white">
                <Link href="/compose" onClick={() => setOpen(false)}>
                  <PenSquare className="mr-2 h-4 w-4" />
                  Shout
                </Link>
              </Button>
              <LogoutButton variant="button" className="mt-2" onComplete={() => setOpen(false)} />
            </div>
          )}

          {!user && (
            <div className="border-t p-4 space-y-2">
              <Button asChild className="w-full" variant="default">
                <Link href="/login" onClick={() => setOpen(false)}>
                  Sign in with wallet
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
