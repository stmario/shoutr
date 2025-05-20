import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { NotificationItem } from "@/components/notification-item"
import { getCurrentUser } from "@/lib/auth"
import { getNotifications, markAllNotificationsAsRead } from "@/app/actions/notification-actions"
import { redirect } from "next/navigation"

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { notifications, unreadCount } = await getNotifications(50, 0, true)

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsAsRead}>
            <Button type="submit" variant="ghost" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </header>
      <div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground">When someone interacts with you or your shouts, you'll see it here.</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </SidebarInset>
  )
}
