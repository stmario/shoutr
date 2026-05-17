import type React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { IcoSidebar } from "@/components/ico/ico-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { WalletSessionGuard } from "@/components/wallet-session-guard"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata = {
  title: "Shoutr - Connect with friends",
  description: "A social media platform for sharing your thoughts",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/token-logo.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/token-logo.png",
  },
}

/** App uses auth cookies in the root sidebar — opt out of static prerender. */
export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={200}>
          <SidebarProvider defaultOpen>
            <div className="relative flex min-h-screen w-full justify-center">
              <div className="flex w-full max-w-screen-2xl min-h-screen items-start shadow-sm">
                <AppSidebar />
                <SidebarInset
                  role="main"
                  className="min-w-0 flex-1 border-x border-border pt-14 md:pt-0"
                >
                  {children}
                </SidebarInset>
                <IcoSidebar />
              </div>
            </div>
            <Toaster />
            <WalletSessionGuard />
          </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
