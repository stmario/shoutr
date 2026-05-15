"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiweSignIn } from "@/components/siwe-sign-in"
import Link from "next/link"
import { ShoutrLogo } from "@/components/shoutr-logo"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-1">
          <ShoutrLogo className="mb-4 justify-center" size={48} showWordmark={false} priority />
          <CardTitle className="text-2xl font-bold">Sign in to Shoutr</CardTitle>
          <CardDescription>Connect your wallet and sign with Ethereum.</CardDescription>
        </CardHeader>
        <CardContent>
          <SiweSignIn />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-purple-700 hover:underline">
            Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
