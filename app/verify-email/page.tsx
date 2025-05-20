"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { verifyEmail } from "@/app/actions/user-actions"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [verificationState, setVerificationState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setVerificationState("error")
        setErrorMessage("Verification token is missing")
        return
      }

      try {
        const result = await verifyEmail(token)

        if (result.success) {
          setVerificationState("success")
        } else {
          setVerificationState("error")
          setErrorMessage(result.message || "Verification failed")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setVerificationState("error")
        setErrorMessage("An unexpected error occurred")
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-700 text-white mb-4">
            <Megaphone className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>Verifying your email address</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {verificationState === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-purple-700 animate-spin mb-4" />
              <p className="text-center">Verifying your email address...</p>
            </>
          )}

          {verificationState === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Email Verified!</h2>
              <p className="text-center text-muted-foreground mb-4">
                Your email has been successfully verified. You can now log in to your account.
              </p>
            </>
          )}

          {verificationState === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
              <p className="text-center text-muted-foreground mb-4">
                {errorMessage || "We couldn't verify your email. The link may be invalid or expired."}
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationState === "success" && (
            <Button asChild className="bg-purple-700 hover:bg-purple-800">
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          {verificationState === "error" && (
            <Button asChild variant="outline">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
