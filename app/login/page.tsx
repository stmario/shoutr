"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SiweSignIn } from "@/components/siwe-sign-in"
import { Megaphone } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-1">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-700 text-white">
            <Megaphone className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Sign in to Shoutr</CardTitle>
          <CardDescription>Connect your wallet and sign with Ethereum. SHOT token holders only.</CardDescription>
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
